import { Effect } from "effect"
import { Migrator } from "effect/sql"
import { migrationLoader } from "./migrations"
import { DatabaseLive } from "./client"

const program = Effect.gen(function* () {
  const migrate = Migrator.make({})
  const applied = yield* migrate({
    loader: migrationLoader,
    table: "planora_migrations",
  })

  yield* Effect.log(`applied ${applied.length} migration(s)`)
})

await Effect.runPromise(program.pipe(Effect.provide(DatabaseLive)))
