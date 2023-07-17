// import merge from "merge-deep"

import redis from "@database/redis"

import type { Chat } from "@interfaces/storage"

const KEYS = {
  chats: "chats",
  tracksLyric: "tracks:lyric",
  lastTracks: "tracks:last"
}
class Storage {
  public async saveChat(cashId: number, data: Chat): Promise<void> {
    await redis.setex(`${KEYS.chats}:${cashId}`, 21600, JSON.stringify(data))
  }

  public async getChat(cashId: number): Promise<Chat | null> {
    const data = await redis.get(`${KEYS.chats}:${cashId}`)
    return data ? JSON.parse(data) : null
  }

  public async removeChat(cashId: number): Promise<any> {
    return await redis.del(`${KEYS.chats}:${cashId}`)
  }

  public async saveLyric(cashId: number, lyric: string): Promise<void> {
    await redis.setex(`${KEYS.tracksLyric}:${cashId}`, 21600, lyric)
  }

  public async getLyric(cashId: number): Promise<string | null> {
    return await redis.get(`${KEYS.tracksLyric}:${cashId}`)
  }

  public async appendToLastTracks(cashId: number, trackId: number) {
    await redis.rpush(`${KEYS.lastTracks}:${cashId}`, trackId)
    await redis.ltrim(`${KEYS.lastTracks}:${cashId}`, -3, -1)
  }

  public async getLastTracks(cashId: number): Promise<Array<string>> {
    return await redis.lrange(`${KEYS.lastTracks}:${cashId}`, 0, -1)
  }
}

export default Storage
