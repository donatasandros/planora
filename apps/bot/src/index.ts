import { NodeHttpClient, NodeRuntime, NodeSocket } from "@effect/platform-node"
import { Config, Effect, Layer, Stream } from "effect"
import { Discord, DiscordConfig } from "dfx"
import { DiscordGateway, DiscordLive } from "dfx/gateway"

const program = Effect.gen(function* () {
  const gateway = yield* DiscordGateway

  yield* Effect.log("gateway connected, waiting for presence")

  yield* gateway.fromDispatch("PRESENCE_UPDATE").pipe(
    Stream.runForEach((p) =>
      Effect.log("presence", {
        userId: p.user.id,
        username: p.user.username,
        status: p.status,
        guild: p.guild_id,
        playing: p.activities?.map((a) => a.name),
      }),
    ),
  )
})

const DiscordLayer = DiscordConfig.layerConfig({
  token: Config.Redacted("DISCORD_BOT_TOKEN"),
  gateway: {
    intents:
    Config.succeed(
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
)

NodeRuntime.runMain(Layer.launch(AppLive))
