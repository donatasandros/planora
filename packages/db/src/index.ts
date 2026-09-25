import { env } from "@workspace/env"
import { createChildLogger } from "@workspace/logger"
import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"

const logger = createChildLogger("db")

const { native } = pg
if (!native) {
	throw new Error("pg-native couldn't be loaded.")
}

const pool = new native.Pool({
	connectionString: env.DATABASE_URL,
	max: 10,
	connectionTimeoutMillis: 5 * 1000,
	idleTimeoutMillis: 30 * 1000,
})

pool.on("error", (err) => {
	logger.error({ err }, "PostgreSQL pool error")
})

let closePromise: Promise<void> | undefined

export function closeDb(): Promise<void> {
	closePromise ??= new Promise<void>((resolve, reject) => {
		pool.end((err?: Error) => {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})

	return closePromise
}

export const db = drizzle({ client: pool })
export type Db = typeof db

export * from "drizzle-orm"
export * from "./schema/index"
