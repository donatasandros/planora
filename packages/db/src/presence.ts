import type { NormalizedPresence } from "@planora/core"
import { Effect } from "effect"
import { SqlClient } from "effect/sql"
import { PgClient } from "@effect/sql-pg"

export const storePresenceEvent = (event: NormalizedPresence) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const pg = yield* PgClient.PgClient

    const [profile] = yield* sql`
      SELECT 1
      FROM planora_profiles
      WHERE discord_id = ${event.userId}
        AND tracking_enabled = true
      LIMIT 1
    `

    if (!profile) {
      return
    }

    yield* sql`
      INSERT INTO planora_presence_events (discord_id, guild_id, status, activities)
      VALUES (${event.userId}, ${event.guildId}, ${event.status}, ${pg.json(event.activities)})
    `
  })
