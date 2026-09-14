import { createChildLogger } from "@workspace/logger"
import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"

const logger = createChildLogger("db")
const { native } = pg

if (!native) {
  throw new Error("pg-native couldn't be loaded.")
}

const pool = new native.Pool({
  connectionString: process.env.DATABASE_URL as string,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
})

pool.on("error", (err) => {
  logger.error({ err }, "PostgreSQL pool error")
})

export const db = drizzle({ client: pool })

export * from "drizzle-orm"

export * from "./schema/index"
