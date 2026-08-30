import os from "node:os"

type SystemInfo = {
  process: {
    cpuUsage: number
    memoryUsage: number
  }
  system: {
    platform: string
    totalMemory: number
    nodeVersion: string
  }
}

function bytesToMB(bytes: number) {
  return Number((bytes / 1024 / 1024).toFixed(1))
}

async function getProcessCpuUsage() {
  const startUsage = process.cpuUsage()
  const startTime = process.hrtime.bigint()

  await new Promise((resolve) => setTimeout(resolve, 100))

  const elapUsage = process.cpuUsage(startUsage)
  const elapTimeNs = process.hrtime.bigint() - startTime
  const elapTimeUs = Number(elapTimeNs / 1000n)

  const elapUserUs = elapUsage.user
  const elapSystemUs = elapUsage.system
  const totalCpuUs = elapUserUs + elapSystemUs

  const cpuCount = os.cpus().length || 1
  const cpuPercent = (100 * totalCpuUs) / (elapTimeUs * cpuCount)

  return Number(cpuPercent.toFixed(0))
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const memoryUsage = process.memoryUsage().rss

  const totalMem = os.totalmem()

  const processCpuPercent = await getProcessCpuUsage()

  return {
    process: {
      cpuUsage: processCpuPercent,
      memoryUsage: bytesToMB(memoryUsage),
    },
    system: {
      platform: `${os.type()} ${os.arch()}`,
      totalMemory: bytesToMB(totalMem),
      nodeVersion: process.version,
    },
  }
}
