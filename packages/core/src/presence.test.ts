import { describe, expect, it } from "vitest"
import {
  type NormalizedPresence,
  normalizePresenceUpdate,
  PresencePayloadSchema,
} from "./presence"
import { Schema } from "effect"

const decode = Schema.decodeUnknownSync(PresencePayloadSchema)

const decodeAndNormalize = (input: unknown): NormalizedPresence =>
  normalizePresenceUpdate(decode(input))

describe("PresencePayloadSchema", () => {
  it("rejects a payload without a user id", () => {
    expect(() => decode({ user: {}, status: "online" })).toThrow()
  })

  it("drops fields not declared in the schema", () => {
    const payload = decode({
      user: { id: "1", username: "john", global_name: "john doe" },
      status: "online",
    })

    expect(payload.user).toEqual({ id: "1" })
  })
})

describe("normalizePresenceUpdate", () => {
  it("maps a full presence update", () => {
    const presence = decodeAndNormalize({
      user: { id: "1" },
      guild_id: "2",
      status: "online",
      activities: [{ type: 0, name: "Minecraft", application_id: "3" }],
    })

    expect(presence).toEqual({
      discordUserId: "1",
      guildId: "2",
      status: "online",
      activities: [{ type: 0, name: "Minecraft", applicationId: "3" }],
    })
  })

  it("returns an empty array when activities are missing", () => {
    const presence = decodeAndNormalize({
      user: { id: "1" },
      guild_id: "2",
      status: "online",
    })

    expect(presence.activities).toEqual([])
  })

  it("returns null when guild_id is missing", () => {
    const presence = decodeAndNormalize({
      user: { id: "1" },
      status: "online",
    })

    expect(presence.guildId).toBeNull()
  })

  it("drops custom statuses and keeps other activity types", () => {
    const presence = decodeAndNormalize({
      user: { id: "1" },
      guild_id: "2",
      status: "online",
      activities: [
        { type: 0, name: "Minecraft", application_id: "3" },
        { type: 2, name: "Spotify" },
        { type: 4, name: "Custom Status", state: "sleeping" },
      ],
    })

    expect(presence.activities).toEqual([
      { type: 0, name: "Minecraft", applicationId: "3" },
      { type: 2, name: "Spotify", applicationId: null },
    ])
  })

  it("returns null when application_id is missing", () => {
    const presence = decodeAndNormalize({
      user: { id: "1" },
      guild_id: "2",
      status: "online",
      activities: [{ type: 0, name: "Minecraft" }],
    })

    expect(presence.activities).toEqual([
      { type: 0, name: "Minecraft", applicationId: null },
    ])
  })

  it("returns equal output for identical updates", () => {
    const input = {
      user: { id: "1" },
      guild_id: "2",
      status: "online",
      activities: [{ type: 0, name: "Minecraft" }],
    }

    expect(decodeAndNormalize(input)).toEqual(decodeAndNormalize(input))
  })
})
