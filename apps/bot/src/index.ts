import { createClient } from "@/app/client"
import { createLifecycle } from "@/app/lifecycle"

const client = createClient()
const lifecycle = createLifecycle(client)

lifecycle.registerSignalHandlers()
void lifecycle.start()
