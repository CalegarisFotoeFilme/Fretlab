fn main() {
    // comandos do app declarados: como o app é servido em http://localhost (origem "remota"),
    // eles só funcionam se estiverem liberados na capability (allow-open-songsterr, allow-read-download)
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["open_songsterr", "read_download", "save_backup", "read_saved_song"])),
    )
    .expect("falha no build script do Tauri")
}
