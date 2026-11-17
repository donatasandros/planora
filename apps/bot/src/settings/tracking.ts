import type { DiscordUserId } from "@planora/core"
import { Effect } from "effect"
import { Profiles } from "@planora/db"
import { Discord, Ix, UI } from "dfx"

export const tracking = ({
  userId,
  enabled,
}: {
  userId: DiscordUserId
  enabled: boolean
}) =>
  Effect.gen(function* () {
    const profiles = yield* Profiles

    yield* profiles.setTrackingEnabled(userId, enabled)

    return Ix.response({
      type: Discord.InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE,
      data: UI.components([
        UI.textDisplay(
          enabled
            ? "presence tracking is **on**."
            : "presence tracking is **off**.",
        ),
      ]),
    })
  }).pipe(
    Effect.catchTag("SqlError", (error) =>
      Effect.logError("failed to save tracking setting", error).pipe(
        Effect.as(
          Ix.response({
            type: Discord.InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "couldnt save your setting. try again.",
            },
          }),
        ),
      ),
    ),
  )
