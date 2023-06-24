export interface Track {
  track_id: number
  track_name: string
  track_rating: number
  album_id: number
  album_name: string
  artist_id: number
  artist_name: string
}

export interface TrackList {
  track_list: Array<{ track: Track }>
}

export interface Lyric {
  lyrics_id: number
  lyrics_body: string
  explicit: number
}

export interface LyricResponse {
  lyrics: Lyric
}
