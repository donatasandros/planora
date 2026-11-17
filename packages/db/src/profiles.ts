import { Context, Effect, Layer } from "effect"
import type { DiscordUserId } from "@planora/core"
import type { SqlError } from "effect/sql/SqlError"
import { SqlClient } from "effect/sql"

export class Profiles extends Context.Service<
  Profiles,
  {
    readonly setTrackingEnabled: (
      discordId: DiscordUserId,
      enabled: boolean,
    ) => Effect.Effect<void, SqlError>
  }
>()("planora/Profiles", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const upsertTrackingQuery = (discordId: DiscordUserId, enabled: boolean) =>
      sql`
        INSERT INTO planora_profiles (discord_id, tracking_enabled)
        VALUES (${discordId}, ${enabled})
        ON CONFLICT (discord_id) DO UPDATE SET tracking_enabled = ${enabled}
      `.pipe(Effect.asVoid)

    return {
      setTrackingEnabled: (discordId, enabled) =>
        upsertTrackingQuery(discordId, enabled),
    }
  }),
}) {
  static readonly layer = Layer.effect(this, this.make)
}
