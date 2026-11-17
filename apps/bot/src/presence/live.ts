import { Effect, Layer, Schema, Stream } from "effect"
import { DiscordGateway } from "dfx/DiscordGateway"
import { Presence } from "@planora/db"
import { normalizePresenceUpdate, PresencePayloadSchema } from "@planora/core"

export const PresenceLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const gateway = yield* DiscordGateway
    const presence = yield* Presence

    yield* gateway.fromDispatch("PRESENCE_UPDATE").pipe(
      Stream.mapEffect((payload) =>
        Schema.decodeUnknownEffect(PresencePayloadSchema)(payload).pipe(
          Effect.map(normalizePresenceUpdate),
          Effect.flatMap((event) =>
            presence
              .create(event)
              .pipe(
                Effect.catchTag("SqlError", (error) =>
                  Effect.logWarning("failed to store presence event", error),
                ),
              ),
          ),
          Effect.catchTag("SchemaError", (error) =>
            Effect.logWarning("invalid presence payload", error),
          ),
        ),
      ),
      Stream.runDrain,
      Effect.forkScoped,
    )
  }),
)
