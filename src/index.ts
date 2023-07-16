import "./aliases"

import { Chat, Message } from "node-telegram-bot-api"

import { Command, InlineKeyboard, User } from "@interfaces/telegram"

import Base from "./base"

class Main extends Base {
  public process() {
    this.bot.on("message", msg => {
      const { from, text } = msg
      if (!text || !from) return

      if (Object.values(Command).includes(text as Command)) return this.command(msg)
      this.message(msg)
    })

    this.bot.on("callback_query", query => {
      if (!query.data || !query.message) return

      this.inlineKeyboard(query.data, query.message)
    })
  }

  private command(msg: Message) {
    this.logger.log(msg.from, `Command - ${msg.text}`)

    switch (msg.text) {
      case Command.Start:
        return this.start(msg)
      case Command.Go:
        return this.chooseArtist(msg.chat)
      case Command.Stats:
        return this.stats(msg.chat)
      case Command.Reset:
        return this.reset(msg.chat)
      case Command.Help:
        return this.help(msg.chat)
    }
  }

  private inlineKeyboard(key: string, msg: Message) {
    this.logger.log(msg.chat, `Inline keyboard - ${key}`)

    switch (key) {
      case InlineKeyboard.NewTrack:
        return this.newTrack(msg.chat)
      case InlineKeyboard.ChooseArtist:
        return this.chooseArtist(msg.chat)
    }
  }

  private async start(msg: Message) {
    this.send(
      msg.chat.id,
      "Привет, давай сыграем в игру \nТы присылаешь мне имя исполнителя, а я тебе фрагмент из его песни, тебе нужно угадать название песни 🤙",
      this.startKeyboardButtons
    )

    this.storage.remove(msg.chat.id)

    await this.entities.Stat.delete({ chat_id: msg.chat.id })
    await this.entities.Stat.save({ chat_id: msg.chat.id, username: msg.from?.username })
  }

  private chooseArtist(chat: Chat) {
    this.storage.remove(chat.id)
    this.send(chat.id, "Отправь мне имя исполнителя ⬇️")
  }

  private async newTrack(chat: Chat) {
    const chatData = await this.storage.get(chat.id)
    if (!chatData?.artistName) return this.chooseArtist(chat)

    this.sendLyric(chat, chat, chatData.artistName)
  }

  private help(chat: Chat) {
    this.send(chat.id, "Если что то не работает, я не при чем 🤪 \nПиши @gazzati")
  }

  private async stats(chat: Chat) {
    const stats = await this.entities.Stat.findOne({ where: { chat_id: chat.id } })
    this.send(chat.id, `Попыток всего: *${stats?.answers || 0}* \nУспешных попыток: *${stats?.success_answers || 0}*`)
  }

  private reset(chat: Chat) {
    this.storage.remove(chat.id)
    this.entities.Stat.update({ chat_id: chat.id }, { answers: 0, success_answers: 0 })

    this.send(chat.id, "Прогресс сброшен 👌")
  }

  private async message(msg: Message) {
    if (!msg.from || !msg.text) return

    const chat = await this.storage.get(msg.chat.id)
    if (!chat) return

    if (chat.trackId) return this.getAnswer(msg)
    this.sendLyric(msg.from, msg.chat, msg.text)
  }

  private async getAnswer(msg: Message): Promise<void> {
    this.logger.log(msg.from, `Answer - ${msg.text}`)

    if (!msg.text) return this.error(msg.chat.id, msg.from)

    const result = await this.compareAnswer(msg.chat.id, msg.text)
    if (!result) return this.error(msg.chat.id, msg.from)

    this.send(msg.chat.id, result, this.answerKeyboardButtons)

    this.logger.log(msg.from, `Result - ${result}`)
  }

  private async sendLyric(user: User, chat: Chat, artist: string): Promise<void> {
    this.bot.sendChatAction(chat.id, "typing")

    this.logger.log(user, `Artist - ${artist}`)

    const randomTrack = await this.getRandomTrackByArtist(chat.id, artist)
    if (!randomTrack) return this.error(chat.id, user, "Треки исполнителя не найдены 😥")

    const lyric = await this.api.getTrackLyric(randomTrack.track_id)
    if (!lyric?.lyrics_body) return this.error(chat.id, user, "Текст песни не найден 😭")

    const lyricFragment = this.getLyricFragment(lyric.lyrics_body)
    if (!lyricFragment) return this.error(chat.id, user)

    this.send(chat.id, `Фрагмент трека: \n\n*${lyricFragment}* \n\nНапиши мне его название 📝`)

    this.logger.log(user, `Lyric - ${lyricFragment}`)

    this.storage.save(chat.id, {
      trackId: randomTrack.track_id,
      trackName: randomTrack.track_name,
      artistName: randomTrack.artist_name,
      albumName: randomTrack.album_name || null
    })

    this.storage.appendTrack(chat.id, randomTrack.track_id)
  }
}

new Main().process()
