import { Schema } from "effect"

export const DiscordUserId = Schema.String.pipe(Schema.brand("DiscordUserId"))
export type DiscordUserId = Schema.Schema.Type<typeof DiscordUserId>

const PresenceActivitySchema = Schema.Struct({
  type: Schema.Int,
  name: Schema.String,
  application_id: Schema.optional(Schema.String),
})

export const PresencePayloadSchema = Schema.Struct({
  user: Schema.Struct({
    id: DiscordUserId,
  }),
  guild_id: Schema.optional(Schema.String),
  status: Schema.String,
  activities: Schema.optional(Schema.Array(PresenceActivitySchema)),
})

export type PresencePayload = Schema.Schema.Type<typeof PresencePayloadSchema>

const CUSTOM_STATUS = 4

export interface NormalizedActivity {
  readonly type: number
  readonly name: string
  readonly applicationId: string | null
}

export interface NormalizedPresence {
  readonly userId: DiscordUserId
  readonly guildId: string | null
  readonly status: string
  readonly activities: ReadonlyArray<NormalizedActivity>
}

export function normalizePresenceUpdate(
  payload: PresencePayload,
): NormalizedPresence {
  return {
    userId: payload.user.id,
    guildId: payload.guild_id ?? null,
    status: payload.status,
    activities: (payload.activities ?? [])
      .filter((activity) => activity.type !== CUSTOM_STATUS)
      .map((activity) => ({
        type: activity.type,
        name: activity.name,
        applicationId: activity.application_id ?? null,
      })),
  }
}
