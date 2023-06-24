export interface State {
  [chatId: number]: {
    trackId: number
    trackName: string
    artistName: string
    albumName: string | null
  }
}
