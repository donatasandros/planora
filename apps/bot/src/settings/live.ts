import { Effect, Layer } from "effect"
import { InteractionsRegistry } from "dfx/gateway"
import { Profiles } from "@planora/db"
import { Ix } from "dfx"
import { settings } from "./command"

export const SettingsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const registry = yield* InteractionsRegistry
    const profiles = yield* Profiles

    yield* registry.register(
      Ix.builder.add(settings(profiles)).catchAllCause(Effect.logError),
    )
  }),
)
