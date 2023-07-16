import "./aliases"

import Api from "@api/index"
import Fuse from "fuse.js"
import TelegramBot, { User } from "node-telegram-bot-api"

import config from "@root/config"

import Logger from "@helpers/logger"

import { Track } from "@interfaces/api"
import { State } from "@interfaces/main"

abstract class Base {
  protected bot: TelegramBot
  protected api: Api
  protected logger: Logger

  protected state: State

  constructor() {
    this.bot = new TelegramBot(config.telegramToken, { polling: true })
    this.api = new Api()
    this.logger = new Logger()

    this.state = {}
  }

  protected async getRandomTrackByArtist(artistQuery: string): Promise<Track | null> {
    const artistTracks = await this.api.getArtistTracks(artistQuery)
    if (!artistTracks?.track_list?.length) return null

    const randomIndex = this.getRandomIndex(artistTracks.track_list.length)
    const randomTrack = artistTracks.track_list[randomIndex].track
    return randomTrack || null
  }

  protected getLyricFragment(lyric: string): string | null {
    const preparedLyric = lyric.split("\n").slice(0, -3)
    if (!preparedLyric?.length) return null

    const randomIndex = this.getRandomIndex(preparedLyric.length - 4)

    const slice = this.getLyricResult(preparedLyric, randomIndex)
    if(!slice) return this.getLyricResult(preparedLyric)

    return slice
  }

  private getLyricResult(lyricArray: Array<string>, from = 0): string {
    let result: Array<string> = []

    for(let i = from; i < lyricArray.length; i+= 1) {
      if (result.length > 3) break

      if (lyricArray[i].length < 5) {
        result = []
        continue
      }

      result.push(lyricArray[i])
    }

    return result.join("\n")
  }

  protected compareAnswer(chatId: number, answer: string): string | null {
    const track = this.state[chatId].trackName
    const artist = this.state[chatId].artistName
    const album = this.state[chatId].albumName

    if(!track || ! artist) return null

    const fuse = new Fuse([track], { includeScore: true })
    const result = fuse.search(answer)
    const score = result.at(0)?.score

    if (score === undefined || score > 0.7) return this.getFailedMessage(track, artist)
    if (score < 0.4) return this.getRightMessage(track, artist, album)
    return `Возможно ты имел ввиду *${track}* \nЭто правильный ответ 😏`
  }

  protected getFailedMessage(track: string, artist: string): string {
    const random = Math.floor(Math.random() * 3)

    switch (random) {
      case 2:
        return `Эх, ты расстраиваешь *${artist}* 😿 \nПравильный ответ - *${track}*`
      case 1:
        return `Мда... \nНе ожидал от тебя такого 😡 \nПравильный ответ: *${artist} - ${track}*`
      default:
        return `Кажется тебе стоит переслушать *${artist}* ☹️ \nПравильный ответ - *${track}*`
    }
  }

  protected getRightMessage(track: string, artist: string, album: string | null): string {
    if(!album || album.includes(track)) return `А ты молодец 💥, это действительно трек *${artist}* - *${track}*`

    return `Верно 🔥, это трек *${track}* с альбома *${album}*`
  }

  protected send(chatId: number, message: string): void {
    this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" })
  }

  protected error(chatId: number, from?: User, message?: string): void {
    this.logger.error(from, message)
    this.bot.sendMessage(chatId, message || "Извините, что-то пошло не так \nПопробуйте позже 🫶🏻")
  }

  private getRandomIndex(length: number): number{
    return Math.floor(Math.random() * length)
  }
}

export default Base
