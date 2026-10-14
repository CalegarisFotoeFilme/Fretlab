export interface ExerciseProps<S> {
  spec: S
  round: number
  /** score 0..1 da rodada */
  onRoundDone: (score: number) => void
}
