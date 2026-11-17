import { DiscordIxLive } from "dfx/gateway"
import { Config, Layer } from "effect"
import { Discord, DiscordConfig } from "dfx"
import { NodeHttpClient, NodeSocket } from "@effect/platform-node"
import { DatabaseLive, Presence, Profiles } from "@planora/db"
import { SettingsLive } from "./settings/live"
import { PresenceLive } from "./presence/live"

const DiscordLayer = DiscordIxLive.pipe(
  Layer.provide(
    DiscordConfig.layerConfig({
      token: Config.Redacted("DISCORD_BOT_TOKEN"),
      gateway: {
        intents: Config.succeed(
          Discord.GatewayIntentBits.Guilds |
            Discord.GatewayIntentBits.GuildPresences,
        ),
      },
    }),
  ),
  Layer.provide(NodeHttpClient.layerUndici),
  Layer.provide(NodeSocket.layerWebSocketConstructor),
)

const DatabaseServices = Layer.mergeAll(Profiles.layer, Presence.layer).pipe(
  Layer.provide(DatabaseLive),
)

export const AppLive = Layer.mergeAll(SettingsLive, PresenceLive).pipe(
  Layer.provide(DiscordLayer),
  Layer.provide(DatabaseServices),
)
