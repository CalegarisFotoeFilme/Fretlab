// Casco desktop do FretLab (Tauri).
// O que ele acrescenta ao app web:
// - o Songsterr numa janela do próprio app, encaixada ao lado (o site bloqueia iframe);
// - os arquivos baixados nessa janela (Guitar Pro / MIDI) vão direto para a biblioteca do FretLab.

use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::Serialize;
use tauri::webview::DownloadEvent;
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, State, WebviewUrl, WebviewWindowBuilder};

/// Arquivos que a janela do Songsterr baixou: só eles podem ser lidos pelo app.
#[derive(Default)]
struct Downloads(Mutex<HashSet<PathBuf>>);

/// Destino escolhido no início de cada download (por URL): no macOS, o fim do download chega sem o caminho.
#[derive(Default)]
struct Pending(Mutex<std::collections::HashMap<String, PathBuf>>);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadDone {
    path: String,
    name: String,
    /// página do Songsterr aberta quando o download terminou (para ligar a música à tab)
    page_url: Option<String>,
}

/// Identifica a janela do Songsterr como o Safari: o Google recusa login em navegador "embutido"
/// (reconhecido pelo user agent padrão do WKWebView, que não traz "Version/… Safari/…").
const SAFARI_UA: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";

/// Rótulos únicos para as janelas pop-up (ex.: login com Google).
static POPUPS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

/// Caminho livre em Downloads: "arquivo.gp", "arquivo (1).gp", ...
fn free_path(dir: PathBuf, name: &str) -> PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() {
        return candidate;
    }
    let (stem, ext) = match name.rsplit_once('.') {
        Some((s, e)) => (s.to_string(), format!(".{e}")),
        None => (name.to_string(), String::new()),
    };
    (1..1000)
        .map(|i| dir.join(format!("{stem} ({i}){ext}")))
        .find(|p| !p.exists())
        .unwrap_or(candidate)
}

/// Gancho de download das janelas do Songsterr: salva na pasta "musicas" do app sem sobrescrever e avisa o FretLab
/// (que importa o arquivo na biblioteca). Um pop-up que só servia para baixar fecha sozinho no fim.
fn download_handler(handle: AppHandle) -> impl Fn(tauri::Webview, DownloadEvent) -> bool + Send + Sync + 'static {
    move |webview, event| {
        match event {
            DownloadEvent::Requested { url, destination } => {
                log::info!("download pedido em {}: {} -> {:?}", webview.label(), url, destination);
                // nome sugerido pelo site (ou o fim da URL)
                let name = destination
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .filter(|n| !n.is_empty())
                    .or_else(|| url.path_segments().and_then(|mut s| s.next_back().map(String::from)))
                    .unwrap_or_else(|| "songsterr-download".into());
                // pasta "musicas" do próprio app (backup que não some se a pasta Downloads for limpa)
                let dir = handle
                    .path()
                    .app_data_dir()
                    .map(|d| d.join("musicas"))
                    .or_else(|_| handle.path().download_dir())
                    .unwrap_or_else(|_| std::env::temp_dir());
                let _ = std::fs::create_dir_all(&dir);
                *destination = free_path(dir, &name);
                handle.state::<Pending>().0.lock().unwrap().insert(url.to_string(), destination.clone());
            }
            DownloadEvent::Finished { url, path, success } => {
                log::info!("download terminado em {}: {} ok={} path={:?}", webview.label(), url, success, path);
                // o macOS não informa o caminho no fim: usa o destino guardado no começo
                let path = path.or_else(|| handle.state::<Pending>().0.lock().unwrap().remove(url.as_str()));
                if let (true, Some(path)) = (success, path) {
                    handle.state::<Downloads>().0.lock().unwrap().insert(path.clone());
                    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    // a página da música é a da janela principal do Songsterr (o pop-up não tem)
                    let page_url = handle
                        .get_webview_window("songsterr")
                        .and_then(|w| w.url().ok())
                        .or_else(|| webview.url().ok())
                        .map(|u| u.to_string());
                    let _ = handle.emit_to("main", "songsterr-download", DownloadDone { path: path.to_string_lossy().to_string(), name, page_url });
                }
                if webview.label().starts_with("songsterr-popup") {
                    let _ = webview.window().close();
                }
            }
            _ => {}
        }
        true
    }
}

/// Abre (ou reaproveita) o Songsterr na metade direita da tela e encaixa o FretLab na esquerda.
#[tauri::command]
fn open_songsterr(app: AppHandle, url: String) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("janela principal não encontrada")?;
    let monitor = main.current_monitor().map_err(|e| e.to_string())?.ok_or("monitor não encontrado")?;
    let scale = monitor.scale_factor();
    let size = monitor.work_area().size.to_logical::<f64>(scale);
    let origin = monitor.work_area().position.to_logical::<f64>(scale);
    let half = (size.width / 2.0).floor();

    let _ = main.unmaximize();
    main.set_position(LogicalPosition::new(origin.x, origin.y)).map_err(|e| e.to_string())?;
    main.set_size(LogicalSize::new(half, size.height)).map_err(|e| e.to_string())?;

    let parsed: tauri::Url = url.parse().map_err(|e: url::ParseError| e.to_string())?;
    if let Some(existing) = app.get_webview_window("songsterr") {
        existing.navigate(parsed).map_err(|e| e.to_string())?;
        existing.set_position(LogicalPosition::new(origin.x + half, origin.y)).map_err(|e| e.to_string())?;
        existing.set_size(LogicalSize::new(size.width - half, size.height)).map_err(|e| e.to_string())?;
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let handle = app.clone();
    let popup_app = app.clone();
    WebviewWindowBuilder::new(&app, "songsterr", WebviewUrl::External(parsed))
        .title("Songsterr · FretLab")
        .user_agent(SAFARI_UA)
        // pop-ups (login com Google): janela do app ligada à que abriu, para o login voltar ao Songsterr
        .on_new_window(move |_url, features| {
            let n = POPUPS.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            let built = WebviewWindowBuilder::new(&popup_app, format!("songsterr-popup-{n}"), WebviewUrl::External("about:blank".parse().expect("about:blank")))
                .window_features(features)
                .user_agent(SAFARI_UA)
                .title("Songsterr")
                // o Songsterr baixa o Guitar Pro por uma janela nova: ela também precisa avisar o FretLab
                .on_download(download_handler(popup_app.clone()))
                .build();
            match built {
                Ok(window) => tauri::webview::NewWindowResponse::Create { window },
                Err(_) => tauri::webview::NewWindowResponse::Deny,
            }
        })
        .position(origin.x + half, origin.y)
        .inner_size(size.width - half, size.height)
        .on_download(download_handler(handle))
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Lê um arquivo baixado pela janela do Songsterr (e só esses).
#[tauri::command]
fn read_download(path: String, downloads: State<Downloads>) -> Result<Vec<u8>, String> {
    let path = PathBuf::from(path);
    if !downloads.0.lock().unwrap().contains(&path) {
        return Err("arquivo não veio da janela do Songsterr".into());
    }
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// Salva o backup na pasta Downloads e mostra no Finder (a janela principal não baixa arquivos).
#[tauri::command]
fn save_backup(app: AppHandle, name: String, contents: String) -> Result<String, String> {
    let file = PathBuf::from(&name);
    let name = file.file_name().ok_or("nome inválido")?;
    let path = app.path().download_dir().map_err(|e| e.to_string())?.join(name);
    std::fs::write(&path, contents).map_err(|e| e.to_string())?;
    let _ = std::process::Command::new("open").arg("-R").arg(&path).spawn();
    Ok(path.to_string_lossy().into_owned())
}

/// Lê uma música guardada na pasta "musicas" do app (recuperação quando o arquivo some do banco do navegador).
#[tauri::command]
fn read_saved_song(app: AppHandle, name: String) -> Result<Vec<u8>, String> {
    let file = PathBuf::from(&name);
    let name = file.file_name().ok_or("nome inválido")?;
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("musicas").join(name);
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// Porta local em que o app é servido. Em http://localhost (e não tauri://) o player do YouTube
/// aceita ser embutido: ele exige um "referer" de página web.
const PORT: u16 = 47321;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(PORT).build())
        .plugin(tauri_plugin_http::init())
        .manage(Downloads::default())
        .manage(Pending::default())
        .invoke_handler(tauri::generate_handler![open_songsterr, read_download, save_backup, read_saved_song])
        .setup(|app| {
            // log em arquivo também no app final (~/Library/Logs/br.fretlab.desktop/), para depurar downloads
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .clear_targets()
                    .level(log::LevelFilter::Info)
                    .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: Some("fretlab".into()) }))
                    .build(),
            )?;
            // em desenvolvimento, o servidor do Vite; no app, o servidor local embutido
            let url = if cfg!(debug_assertions) { "http://localhost:5173".to_string() } else { format!("http://localhost:{PORT}") };
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.parse().expect("url local")))
                .title("FretLab")
                .inner_size(1600.0, 1000.0)
                .min_inner_size(900.0, 600.0)
                .maximized(true)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o FretLab");
}
