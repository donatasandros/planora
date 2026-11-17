import { Discord, Ix } from "dfx"
import { Effect } from "effect"
import { tracking } from "./tracking"
import { interactionUserId } from "../interaction-user"
import { Profiles } from "@planora/db"

export const settings = (profiles: Profiles["Service"]) =>
  Ix.global(
    {
      name: "settings",
      description: "Manage your Planora settings.",
      options: [
        {
          type: Discord.ApplicationCommandOptionType.SUB_COMMAND,
          name: "tracking",
          description: "Turn presence tracking on or off.",
          options: [
            {
              type: Discord.ApplicationCommandOptionType.STRING,
              name: "state",
              description: "Whether tracking should be on or off.",
              required: true,
              choices: [
                {
                  name: "on",
                  value: "on",
                },
                {
                  name: "off",
                  value: "off",
                },
              ],
            },
          ],
        },
      ],
    },
    (ix) =>
      ix.subCommands({
        tracking: Effect.gen(function* () {
          const userId = interactionUserId(ix.interaction)
          const enabled = ix.optionValue("state") === "on"

          if (userId === undefined) {
            return Ix.response({
              type: Discord.InteractionCallbackTypes
                .CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Could not identify your Discord id.",
                flags: Discord.MessageFlags.Ephemeral,
              },
            })
          }

          return yield* tracking({
            userId,
            enabled,
          }).pipe(Effect.provideService(Profiles, profiles))
        }),
      }),
  )
