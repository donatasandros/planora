import type { NormalizedPresence } from "@planora/core"
import { Context, Effect, Layer } from "effect"
import { SqlClient } from "effect/sql"
import { PgClient } from "@effect/sql-pg"
import type { SqlError } from "effect/sql/SqlError"

export class Presence extends Context.Service<
  Presence,
  {
    readonly create: (
      event: NormalizedPresence,
    ) => Effect.Effect<boolean, SqlError>
  }
>()("planora/Presence", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const pg = yield* PgClient.PgClient

    const insertQuery = (event: NormalizedPresence) => sql<{ id: string }>`
      INSERT INTO planora_presence_events (discord_id, guild_id, status, activities)
      SELECT ${event.userId}, ${event.guildId}, ${event.status}, ${pg.json(event.activities)}
      WHERE EXISTS (SELECT 1 FROM planora_profiles WHERE discord_id = ${event.userId} AND tracking_enabled = true)
      RETURNING id
    `

    return {
      create: (event) =>
        Effect.gen(function* () {
          const rows = yield* insertQuery(event)

          return rows.length > 0
        }),
    }
  }),
}) {
  static readonly layer = Layer.effect(this, this.make)
}
