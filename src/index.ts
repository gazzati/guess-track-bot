import "./aliases"

import { Chat, Message } from "node-telegram-bot-api"

import { TelegramCommand } from "@interfaces/telegram"

import Base from "./base"

class Main extends Base {
  public process() {
    this.bot.on("message", msg => {
      const { from, text } = msg
      if (!text || !from) return

      if (Object.values(TelegramCommand).includes(text as TelegramCommand)) return this.command(msg)
      this.message(msg)
    })
  }

  private command(msg: Message) {
    this.logger.log(msg.from, `Command - ${msg.text}`)

    switch (msg.text) {
      case TelegramCommand.Start:
        return this.start(msg.chat)
      case TelegramCommand.Go:
        return this.go(msg.chat)
    }
  }

  private start(chat: Chat) {
    delete this.state[chat.id]
    this.send(
      chat.id,
      "Привет 🖖🏻, давай сыграем в игру \nТы присылаешь мне имя исполнителя, а я тебе фрагмент из его песни, тебе нужно угадать название песни) \nЕсли хочешь сыграть жми /go"
    )
  }

  private go(chat: Chat) {
    delete this.state[chat.id]
    this.send(chat.id, "Отправь мне имя исполнителя ⬇️")
  }

  private message(msg: Message) {
    if (this.state[msg.chat.id]?.trackId) return this.getAnswer(msg)

    this.sendLyric(msg)
  }

  private getAnswer(msg: Message): void {
    this.logger.log(msg.from, `Answer - ${msg.text}`)

    if (!msg.text) return this.error(msg.chat.id, msg.from)

    const result = this.compareAnswer(msg.chat.id, msg.text)
    if (!result) return this.error(msg.chat.id, msg.from)

    this.send(msg.chat.id, result)

    this.logger.log(msg.from, `Result - ${result}`)

    delete this.state[msg.chat.id]
  }

  private async sendLyric(msg: Message): Promise<void> {
    this.bot.sendChatAction(msg.chat.id, "typing")

    this.logger.log(msg.from, `Artist - ${msg.text}`)

    const randomTrack = await this.getRandomTrackByArtist(msg.text || "")
    if (!randomTrack) return this.error(msg.chat.id, msg.from, "Треки исполнителя не найдены 😥")

    const lyric = await this.api.getTrackLyric(randomTrack.track_id)
    if (!lyric?.lyrics_body) return this.error(msg.chat.id, msg.from, "Текст песни не найден 😭")

    const lyricFragment = this.getLyricFragment(lyric.lyrics_body)
    if (!lyricFragment) return this.error(msg.chat.id, msg.from)

    this.send(msg.chat.id, `Фрагмент трека: \n\n*${lyricFragment}* \n\nНапиши мне его название 📝`)

    this.logger.log(msg.from, `Lyric - ${lyricFragment}`)

    this.state[msg.chat.id] = {
      trackId: randomTrack.track_id,
      trackName: randomTrack.track_name,
      artistName: randomTrack.artist_name,
      albumName: randomTrack.album_name || null
    }
  }
}

new Main().process()
