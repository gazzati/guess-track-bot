import "./aliases"

import Api from "@api/index"
import Fuse from "fuse.js"
import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api"

import config from "@root/config"
import Storage from "@root/storage"

import { entities } from "@database/data-source"
import Logger from "@helpers/logger"

import type { Track, TrackListItem } from "@interfaces/api"
import { InlineKeyboard, User } from "@interfaces/telegram"

abstract class Base {
  protected entities = entities

  protected bot: TelegramBot
  protected api: Api
  protected storage: Storage
  protected logger: Logger

  constructor() {
    this.bot = new TelegramBot(config.telegramToken, { polling: true })
    this.api = new Api()
    this.storage = new Storage()
    this.logger = new Logger()
  }

  protected async getRandomTrackByArtist(chatId: number, artistQuery: string): Promise<Track | null> {
    const artistTracks = await this.api.getArtistTracks(artistQuery)
    if (!artistTracks?.track_list?.length) return null

    const filteredTracks = await this.filteredTracks(chatId, artistTracks.track_list)
    if (!filteredTracks?.length) return null

    const randomIndex = this.getRandomIndex(filteredTracks.length)
    const randomTrack = filteredTracks[randomIndex].track
    return randomTrack || null
  }

  private async filteredTracks(chatId: number, trackList: Array<TrackListItem>): Promise<Array<TrackListItem>> {
    const cashedTracks = await this.storage.getLastTracks(chatId)
    if (!cashedTracks.length) return trackList

    return trackList.filter(item => !cashedTracks.includes(String(item.track.track_id)))
  }

  protected async getTrackLyric(trackId: number): Promise<string | null> {
    const cashedLyric = await this.storage.getLyric(trackId)
    if (cashedLyric) return cashedLyric

    const lyric = await this.api.getTrackLyric(trackId)
    if (!lyric?.lyrics_body) return null

    this.storage.saveLyric(trackId, lyric.lyrics_body)

    return lyric.lyrics_body
  }

  protected getLyricFragment(lyric: string): string | null {
    const preparedLyric = lyric.split("\n").slice(0, -3)
    if (!preparedLyric?.length) return null

    const randomIndex = this.getRandomIndex(preparedLyric.length - 4)

    const slice = this.getLyricResult(preparedLyric, randomIndex)
    if (!slice) return this.getLyricResult(preparedLyric)

    return slice
  }

  private getLyricResult(lyricArray: Array<string>, from = 0): string {
    let result: Array<string> = []

    for (let i = from; i < lyricArray.length; i += 1) {
      if (result.length > 3) break

      if (lyricArray[i].length < 5) {
        result = []
        continue
      }

      result.push(lyricArray[i])
    }

    return result.join("\n")
  }

  protected async compareAnswer(chatId: number, answer: string): Promise<string | null> {
    const chat = await this.storage.getChat(chatId)
    if (!chat) return null

    if (!chat.trackName || !chat.artistName) return null

    const fuse = new Fuse([chat.trackName], { includeScore: true })
    const result = fuse.search(answer)
    const score = result.at(0)?.score

    this.updateStats(chatId, score)

    if (score === undefined || score > 0.6) return this.getFailedMessage(chat.trackName, chat.artistName)
    if (score < 0.4) return this.getRightMessage(chat.trackName, chat.artistName, chat.albumName)
    return `Возможно ты имел ввиду *${chat.trackName}* \nЭто правильный ответ 😏`
  }

  private async updateStats(chatId: number, score?: number) {
    const stat = await this.entities.Stat.findOne({ where: { chat_id: chatId } })
    if (stat) {
      stat.answers += 1
      if (score !== undefined && score <= 0.7) stat.success_answers += 1

      this.entities.Stat.save(stat)
    }
  }

  private getFailedMessage(track: string, artist: string): string {
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

  private getRightMessage(track: string, artist: string, album: string | null): string {
    const randResult = Math.random() > 0.5

    if (!album || album.includes(track))
      return randResult
        ? `А ты молодец 💥 \nЭто действительно трек *${artist}* - *${track}*`
        : "В точку ⚜️ \nЭто трек *${artist}* - *${track}*"

    return randResult
      ? `Верно 🔥 \nЭто трек *${track}* с альбома *${album}*`
      : `Ходят слухи, что ты TrueFun ✅ \nУ многих именно с треком *${track}* ассоциируется альбом *${album}*`
  }

  protected send(chatId: number, message: string, keyboards?: Array<InlineKeyboardButton>): void {
    this.bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      ...(keyboards?.length && {
        reply_markup: {
          inline_keyboard: [keyboards]
        }
      })
    })
  }

  protected get startKeyboardButtons(): Array<InlineKeyboardButton> {
    return [
      {
        text: "Начать",
        callback_data: InlineKeyboard.ChooseArtist
      }
    ]
  }

  protected get answerKeyboardButtons(): Array<InlineKeyboardButton> {
    return [
      {
        text: "Новый трек",
        callback_data: InlineKeyboard.NewTrack
      },
      {
        text: "Сменить артиста",
        callback_data: InlineKeyboard.ChooseArtist
      }
    ]
  }

  protected error(chatId: number, user?: User, message?: string): void {
    this.logger.error(user, message)
    this.bot.sendMessage(chatId, message || "Извините, что-то пошло не так \nПопробуйте позже 🫶🏻")
  }

  private getRandomIndex(length: number): number {
    return Math.floor(Math.random() * length)
  }
}

export default Base
