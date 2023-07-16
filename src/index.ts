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
      if(!query.data || !query.message) return

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

    delete this.state[msg.chat.id]

    await this.entities.Stat.delete({ chat_id: msg.chat.id })
    await this.entities.Stat.save({ chat_id: msg.chat.id, username: msg.from?.username })
  }

  private chooseArtist(chat: Chat) {
    delete this.state[chat.id]
    this.send(chat.id, "Отправь мне имя исполнителя ⬇️")
  }

  private newTrack(chat: Chat) {
    const artist = this.state[chat.id]?.artistName
    if(!artist) return this.chooseArtist(chat)

    this.sendLyric(chat, chat, artist)
  }

  private help(chat: Chat) {
    this.send(chat.id, "Если что то не работает, я не при чем 🤪 \nПиши @gazzati")
  }

  private async stats(chat: Chat) {
    const stats = await this.entities.Stat.findOne({where: { chat_id: chat.id }})
    this.send(chat.id, `Попыток всего: *${stats?.answers || 0}* \nУспешных попыток: *${stats?.success_answers || 0}*`)
  }

  private reset(chat: Chat) {
    delete this.state[chat.id]
    this.entities.Stat.update({ chat_id: chat.id }, {answers: 0, success_answers: 0})

    this.send(chat.id, "Прогресс сброшен 👌")
  }

  private message(msg: Message) {
    if(!msg.from || !msg.text) return

    if (this.state[msg.chat.id]?.trackId) return this.getAnswer(msg)
    this.sendLyric(msg.from, msg.chat, msg.text)
  }

  private getAnswer(msg: Message): void {
    this.logger.log(msg.from, `Answer - ${msg.text}`)

    if (!msg.text) return this.error(msg.chat.id, msg.from)

    const result = this.compareAnswer(msg.chat.id, msg.text)
    if (!result) return this.error(msg.chat.id, msg.from)

    this.send(msg.chat.id, result, this.answerKeyboardButtons)

    this.logger.log(msg.from, `Result - ${result}`)
  }

  private async sendLyric(user: User, chat: Chat, artist: string): Promise<void> {
    this.bot.sendChatAction(chat.id, "typing")

    this.logger.log(user, `Artist - ${artist}`)

    const randomTrack = await this.getRandomTrackByArtist(artist)
    if (!randomTrack) return this.error(chat.id, user, "Треки исполнителя не найдены 😥")

    const lyric = await this.api.getTrackLyric(randomTrack.track_id)
    if (!lyric?.lyrics_body) return this.error(chat.id, user, "Текст песни не найден 😭")

    const lyricFragment = this.getLyricFragment(lyric.lyrics_body)
    if (!lyricFragment) return this.error(chat.id, user)

    this.send(chat.id, `Фрагмент трека: \n\n*${lyricFragment}* \n\nНапиши мне его название 📝`)

    this.logger.log(user, `Lyric - ${lyricFragment}`)

    this.state[chat.id] = {
      trackId: randomTrack.track_id,
      trackName: randomTrack.track_name,
      artistName: randomTrack.artist_name,
      albumName: randomTrack.album_name || null
    }
  }
}

new Main().process()
