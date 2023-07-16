import { DataSource } from "typeorm"

import config from "@root/config"
import { Stat } from "@root/database/entities/Stat"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.psqlHost,
  port: 5432,
  database: config.psqlDatabase,
  username: config.psqlUsername,
  password: config.psqlPassword,
  entities: [Stat],
  subscribers: [],
  migrations: [],
  synchronize: true
  //logging: true
})

AppDataSource.initialize()
  // eslint-disable-next-line no-console
  .then(() => console.log(`Connected to the database: ${config.psqlDatabase}`))
  .catch(error => console.error(error))

export const entities = {
  Stat: AppDataSource.getRepository(Stat),
}
