import { Effect } from "effect"
import { Migrator, SqlClient } from "effect/sql"

const createProfiles = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
      CREATE TABLE planora_profiles
      (
        discord_id       text PRIMARY KEY,
        tracking_enabled boolean     NOT NULL DEFAULT false,
        created_at       timestamptz NOT NULL DEFAULT now()
      )
    `
})

const createPresenceEvents = Effect.gen(function* () {
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

export const migrationLoader = Migrator.fromRecord({
  "1_create_profiles": createProfiles,
  "2_create_presence_events": createPresenceEvents,
})
