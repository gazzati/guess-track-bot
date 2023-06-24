import dotenv from "dotenv"
import Joi from "joi"

dotenv.config()

const envVarsSchema = Joi.object({
  TELEGRAM_TOKEN: Joi.string().description("Telegram token"),
  MUSIXMATCH_HOST: Joi.string().description("Musixmatch host"),
  MUSIXMATCH_KEY: Joi.string().description("Musixmatch API key")
})

const { error, value: envVars } = envVarsSchema.validate(process.env)
if (error) new Error(`Config validation error: ${error.message}`)

export default {
  telegramToken: envVars.TELEGRAM_TOKEN,
  musixmatchHost: envVars.MUSIXMATCH_HOST,
  musixmatchKey: envVars.MUSIXMATCH_KEY
}
