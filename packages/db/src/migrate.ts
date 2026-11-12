import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { PgMigrator } from "@effect/sql-pg"
import { Console, Effect, Layer } from "effect"
import { DatabaseLive } from "./client"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"

const migrationsDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
)

const program = PgMigrator.run({
  loader: PgMigrator.fromFileSystem(migrationsDirectory),
  table: "planora_migrations",
}).pipe(
  Effect.tap((migrations) =>
    Console.log(
      migrations.length === 0
        ? "no pending migrations"
        : `applied ${migrations.length} migration(s)`,
    ),
  ),
  Effect.provide(Layer.mergeAll(DatabaseLive, NodeServices.layer)),
)

NodeRuntime.runMain(program)
