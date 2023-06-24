import type { TrackList, Lyric, LyricResponse } from "@interfaces/api"

import ApiBase from "./api.base"

class Api extends ApiBase {
    public async getArtists(artistQuery: string): Promise<Array<string> | null> {
        const response = await this.get<Array<any>>("/artist.search", {params: {q_artist: artistQuery}})
        if(!response) return null
        const artists = response.map(item => item.artist.artist_name)

        return artists
    }

    public async getArtistTracks(artistQuery: string): Promise<TrackList | null> {
        const response = await this.get<TrackList>("/track.search", {params: {q_artist: artistQuery, s_track_rating: "desc", page_size: 30, f_has_lyrics: 1}})
        return response || null
    }

    public async getTrackLyric(trackId: number): Promise<Lyric | null> {
        const response = await this.get<LyricResponse>("/track.lyrics.get", {params: {track_id: trackId}})
        return response?.lyrics || null
    }
}

export default Api