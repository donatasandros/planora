import { Effect } from "effect"
import { SqlClient } from "effect/sql"

export default Effect.gen(function* () {
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
