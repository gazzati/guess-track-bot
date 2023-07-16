/* eslint-disable no-console */
import type { User } from "@interfaces/telegram"

enum Color {
  Red = "\x1b[31m",
  Blue = "\x1b[34m",
  Cyan = "\x1b[36m",
  White = "\x1b[37m"
  // Green = "\x1b[32m",
  // Yellow = "\x1b[33m",
  // Magenta = "\x1b[35m",
  // DarkBlue = "\x1b[94m"
}

class Logger {
  public log(from?: User, message?: string): void {
    if (!from) return
    const date = this.getDate()
    const user = this.getUser(from)

    console.log(`${Color.Cyan}${date} ${Color.White}${user} | ${Color.Blue}${message}`)
  }

  public error(from?: User, message?: string): void {
    const date = this.getDate()
    const user = from ? this.getUser(from) : ""

    console.log(`${Color.Cyan}${date} ${Color.Red}ERROR for user ${user} ${message}`)
  }

  private getPads(value: string | number, chars = 2): string {
    if (value.toString().length < chars) {
      const zeros = chars - value.toString().length
      const str = new Array(zeros).fill(0)
      return `${str.join("")}${value}`
    }

    return value.toString()
  }

  private getDate(): string {
    const today = new Date()

    const date = `${this.getPads(today.getDate())}.${this.getPads(today.getMonth() + 1)}.${this.getPads(
      today.getFullYear()
    )}`
    const time = `${this.getPads(today.getHours())}:${this.getPads(today.getMinutes())}`

    return `[${date} ${time}]`
  }

  private getUser(from: User): string {
    const userDetails =
      from.first_name || from.last_name
        ? ` (${from.first_name || ""}${from.last_name ? ` ${from.last_name}` : ""})`
        : ""

    return `👨 @${from.username}${userDetails}`
  }
}

export default Logger
