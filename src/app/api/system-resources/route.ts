import { NextResponse } from 'next/server'

function vary(value: number, percent: number = 5): number {
  const variance = value * (percent / 100)
  return Math.round((value + (Math.random() * 2 - 1) * variance) * 100) / 100
}

export async function GET() {
  const cpuUsage = vary(34)
  const cpuTemp = vary(52)

  const memUsed = vary(8192, 3)
  const memCached = vary(2048, 3)
  const swapUsed = vary(512, 4)

  const diskUsed = vary(256000, 2)

  const bytesIn = vary(1048576, 8)
  const bytesOut = vary(524288, 8)
  const packetsIn = Math.round(vary(12345, 5))
  const packetsOut = Math.round(vary(6789, 5))

  const uptime = 864000 + Math.floor(Math.random() * 60)

  const loadAvg1 = vary(1.2, 10)
  const loadAvg5 = vary(0.9, 8)
  const loadAvg15 = vary(0.7, 6)

  const processes = [
    { pid: 1, name: 'systemd', cpu: vary(0.1, 30), memory: vary(0.5, 20), status: 'running' },
    { pid: 1234, name: 'node', cpu: vary(12.5, 15), memory: vary(8.3, 10), status: 'running' },
    { pid: 5678, name: 'agent-worker', cpu: vary(8.2, 20), memory: vary(5.1, 15), status: 'running' },
    { pid: 9012, name: 'prisma-engine', cpu: vary(3.1, 25), memory: vary(4.2, 12), status: 'running' },
    { pid: 3456, name: 'caddy', cpu: vary(0.8, 30), memory: vary(1.2, 20), status: 'running' },
    { pid: 7890, name: 'cron-daemon', cpu: vary(0.0, 50), memory: vary(0.3, 25), status: 'sleeping' },
    { pid: 2345, name: 'sshd', cpu: vary(0.1, 30), memory: vary(0.4, 20), status: 'running' },
    { pid: 6789, name: 'rsyslogd', cpu: vary(0.2, 25), memory: vary(0.6, 15), status: 'sleeping' },
  ]

  // Sort by CPU descending and take top 5
  processes.sort((a, b) => b.cpu - a.cpu)
  const topProcesses = processes.slice(0, 5).map(p => ({
    ...p,
    cpu: Math.round(p.cpu * 10) / 10,
    memory: Math.round(p.memory * 10) / 10,
  }))

  return NextResponse.json({
    cpu: {
      usage: Math.max(0, Math.min(100, Math.round(cpuUsage))),
      cores: 4,
      model: 'AMD EPYC 7543',
      temperature: Math.round(cpuTemp),
    },
    memory: {
      total: 16384,
      used: Math.round(memUsed),
      cached: Math.round(memCached),
      swapTotal: 4096,
      swapUsed: Math.round(swapUsed),
    },
    disk: {
      total: 512000,
      used: Math.round(diskUsed),
      filesystem: 'ext4',
      mountPoint: '/',
    },
    network: {
      bytesIn: Math.round(bytesIn),
      bytesOut: Math.round(bytesOut),
      packetsIn,
      packetsOut,
    },
    processes: topProcesses,
    uptime,
    loadAverage: [
      Math.round(loadAvg1 * 100) / 100,
      Math.round(loadAvg5 * 100) / 100,
      Math.round(loadAvg15 * 100) / 100,
    ],
  })
}
