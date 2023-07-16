export interface User {
  first_name?: string
  last_name?: string
  username?: string
}

export enum Command {
  Start = "/start",
  Go = "/go",
  Stats = "/stats",
  Reset = "/reset",
  Help = "/help"
}

export enum InlineKeyboard {
  NewTrack = "new_track",
  ChooseArtist = "choose_artist"
}