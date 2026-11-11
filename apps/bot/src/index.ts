import { NodeHttpClient, NodeRuntime, NodeSocket } from "@effect/platform-node"
import { Config, Effect, Layer, Schema, Stream } from "effect"
import { Discord, DiscordConfig } from "dfx"
import { DiscordGateway, DiscordLive } from "dfx/gateway"
import { normalizePresenceUpdate, PresencePayloadSchema } from "@planora/core"
import { DatabaseLive, storePresenceEvent } from "@planora/db"

const program = Effect.gen(function* () {
  const gateway = yield* DiscordGateway

  yield* Effect.log("gateway connected, waiting for presence")

  yield* gateway.fromDispatch("PRESENCE_UPDATE").pipe(
    Stream.mapEffect((payload) =>
      Schema.decodeUnknownEffect(PresencePayloadSchema)(payload).pipe(
        Effect.map(normalizePresenceUpdate),
        Effect.tap(storePresenceEvent),
        Effect.catchTag("SchemaError", (error) =>
          Effect.logWarning("invalid presence payload", error),
        ),
      ),
    ),
    Stream.runDrain,
  )
})

const DiscordLayer = DiscordConfig.layerConfig({
  token: Config.Redacted("DISCORD_BOT_TOKEN"),
  gateway: {
    intents: Config.succeed(
      Discord.GatewayIntentBits.Guilds |
        Discord.GatewayIntentBits.GuildPresences,
    ),
  },
})

const AppLive = Layer.effectDiscard(program).pipe(
  Layer.provide(DiscordLive),
  Layer.provide(DiscordLayer),
  Layer.provide(NodeHttpClient.layerUndici),
  Layer.provide(NodeSocket.layerWebSocketConstructor),
  Layer.provide(DatabaseLive),
)

NodeRuntime.runMain(Layer.launch(AppLive))
