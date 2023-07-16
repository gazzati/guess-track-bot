// import merge from "merge-deep"

import redis from "@database/redis"

import type { Chat } from "@interfaces/storage"

class Storage {
  private chatsKey = "chats"
  private cashKey = "tracks:cash"

  public async save(cashId: number, data: Chat): Promise<void> {
    await redis.setex(`${this.chatsKey}:${cashId}`, 21600, JSON.stringify(data))
  }

  public async get(cashId: number): Promise<Chat | null> {
    const data = await redis.get(`${this.chatsKey}:${cashId}`)
    return data ? JSON.parse(data) : null
  }

  public async remove(cashId: number): Promise<any> {
    return await redis.del(`${this.chatsKey}:${cashId}`)
  }

  public async appendTrack(cashId: number, trackId: number) {
    await redis.rpush(`${this.cashKey}:${cashId}`, trackId)
    await redis.ltrim(`${this.cashKey}:${cashId}`, -3, -1)
  }

  public async getTracks(cashId: number): Promise<Array<string>> {
    return await redis.lrange(`${this.cashKey}:${cashId}`, 0, -1)
  }
}

export default Storage
