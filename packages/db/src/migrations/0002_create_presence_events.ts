import { Effect } from "effect"
import { SqlClient } from "effect/sql"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE planora_presence_events
    (
      id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      discord_id  text        NOT NULL,
      guild_id    text,
      status      text        NOT NULL,
      activities  jsonb       NOT NULL DEFAULT '[]' ::jsonb,
      recorded_at timestamptz NOT NULL DEFAULT now()
    )
  `

  yield* sql`
    CREATE INDEX planora_presence_events_profile_time ON planora_presence_events (discord_id, recorded_at)
  `
})
