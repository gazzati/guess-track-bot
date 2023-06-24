import "./aliases"

import Api from "@api/index"
import TelegramBot, { Chat } from "node-telegram-bot-api"

import config from "@root/config"

import { Track } from "@interfaces/api"
import {State} from '@interfaces/main';
import { TelegramCommand } from "@interfaces/telegram"

class Main {
  private bot: TelegramBot
  private api: Api

  private state: State

  constructor() {
    this.bot = new TelegramBot(config.telegramToken, { polling: true })
    this.api = new Api()

    this.state = {}
  }

  public process() {
    this.bot.on("message", msg => {
      const { chat, text } = msg
      if (!text) return

      if (Object.values(TelegramCommand).includes(text as TelegramCommand)) return this.command(chat, text)
      //this.message(chat, text)
    })
  }

  private command(chat: Chat, action: string) {
    switch (action) {
      case TelegramCommand.Artist:
        return this.artist(chat)
    }
  }

  private artist(chat: Chat) {
    this.bot.sendMessage(chat.id, "Hello")
  }



  public async getRandomLyricByArtist(chatId: number, artistQuery: string): Promise<void> {
    const randomTrack = await this.getRandomTrackByArtist(artistQuery)
    if(!randomTrack) return this.error(chatId)

    const lyric = await this.api.getTrackLyric(randomTrack.track_id)
    if(!lyric?.lyrics_body) return this.error(chatId)

    const lyricFragment = this.getLyricFragment(lyric.lyrics_body)
    this.bot.sendMessage(chatId, lyricFragment)

    this.state[chatId] = {trackId: randomTrack.track_id}
  }

  private async getRandomTrackByArtist(artistQuery: string): Promise<Track | null> {
    const artistTracks = await this.api.getArtistTracks(artistQuery)
    if(!artistTracks) return null

    const randomTrack = artistTracks.track_list[Math.floor(Math.random() * artistTracks.track_list.length)].track
    return randomTrack || null
  }

  private getLyricFragment(lyric: string) {

  }

  private error (chatId: number) {
    this.bot.sendMessage(chatId, "Извините, что-то пошло не так")
  }
}

new Main().getResult("Miyagi")
