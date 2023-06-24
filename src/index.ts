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
      this.message(chat.id, text)
    })
  }

  private command(chat: Chat, action: string) {
    switch (action) {
      case TelegramCommand.Start:
        return this.start(chat)
      case TelegramCommand.Go:
        return this.go(chat)
    }
  }

  private start(chat: Chat) {
    delete this.state[chat.id]
    this.bot.sendMessage(chat.id, "Привет, давай сыграем в игру. Ты присылаешь мне имя исполнителя, а я тебе фрагмент из его песни, тебе нужно угадать название песни)\nЕсли хочешь сыграть жми /go")
  }

  private go(chat: Chat) {
    delete this.state[chat.id]
    this.bot.sendMessage(chat.id, "Отправь мне имя исполнителя")
  }

  private message (chatId: number, text: string) {
    if(this.state[chatId]?.trackId) return this.getAnswer(chatId)

    this.getRandomLyricByArtist(chatId, text)
  }

  private getAnswer(chatId: number): void {
    this.bot.sendMessage(chatId, `Правильный ответ: ${this.state[chatId].trackTitle}`)
    delete this.state[chatId]
  }

  private async getRandomLyricByArtist(chatId: number, artistQuery: string): Promise<void> {
    const randomTrack = await this.getRandomTrackByArtist(artistQuery)
    if(!randomTrack) return this.error(chatId)

    const lyric = await this.api.getTrackLyric(randomTrack.track_id)
    if(!lyric?.lyrics_body) return this.error(chatId)

    const lyricFragment = this.getLyricFragment(lyric.lyrics_body)
    if(!lyricFragment) return this.error(chatId)

    this.bot.sendMessage(chatId, `Фрагмент трека: \n\n${lyricFragment} \n\nНапиши мне название трека`)

    this.state[chatId] = {trackId: randomTrack.track_id, trackTitle: `${randomTrack.artist_name} - ${randomTrack.track_name}`}
  }

  private async getRandomTrackByArtist(artistQuery: string): Promise<Track | null> {
    const artistTracks = await this.api.getArtistTracks(artistQuery)
    if(!artistTracks?.track_list?.length) return null

    const randomTrack = artistTracks.track_list[Math.floor(Math.random() * artistTracks.track_list.length)].track
    return randomTrack || null
  }

  private getLyricFragment(lyric: string): string | null {
    const preparedLyric = lyric.split("\n").slice(8, -3)
    if(!preparedLyric?.length) return null

    let result: Array<string> = []

    for(const line of preparedLyric) {
      if(result.length > 3) break

      if(line.length < 5) {
        result = []
        continue
      }

      result.push(line)
    }

    return result.join("\n")
  }

  private error (chatId: number) {
    this.bot.sendMessage(chatId, "Извините, что-то пошло не так")
  }
}

new Main().process()

// new Main().getRandomLyricByArtist(1, "Miyagi")
