import { NextResponse } from 'next/server'

const connectionStates = ['ESTABLISHED', 'LISTEN', 'TIME_WAIT', 'CLOSE_WAIT', 'SYN_SENT', 'SYN_RECV']
const protocols = ['TCP', 'UDP', 'ICMP']
const processes = [
  'node', 'nginx', 'sshd', 'postgres', 'redis-server', 'bun',
  'prisma', 'next-server', 'caddy', 'cron', 'agentos-api', 'websocket'
]

function generateConnections() {
  const connections = []
  const count = 30 + Math.floor(Math.random() * 20)
  const localPorts = [22, 80, 443, 3000, 3001, 3030, 5432, 6379, 8080, 8443, 9090]

  for (let i = 0; i < count; i++) {
    const protocol = protocols[Math.floor(Math.random() * protocols.length)]
    const localPort = localPorts[Math.floor(Math.random() * localPorts.length)]
    const foreignPort = Math.floor(Math.random() * 65535) + 1024
    const state = connectionStates[Math.floor(Math.random() * connectionStates.length)]
    const pid = Math.floor(Math.random() * 50000) + 1000
    const process = processes[Math.floor(Math.random() * processes.length)]

    connections.push({
      id: `conn-${i}`,
      protocol,
      localAddress: `0.0.0.0:${localPort}`,
      foreignAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${foreignPort}`,
      state: protocol === 'ICMP' ? 'N/A' : state,
      pid,
      process,
    })
  }

  // Make some realistic fixed entries
  connections.unshift(
    { id: 'conn-fixed-1', protocol: 'TCP', localAddress: '0.0.0.0:22', foreignAddress: '0.0.0.0:*', state: 'LISTEN', pid: 1024, process: 'sshd' },
    { id: 'conn-fixed-2', protocol: 'TCP', localAddress: '0.0.0.0:80', foreignAddress: '0.0.0.0:*', state: 'LISTEN', pid: 2048, process: 'caddy' },
    { id: 'conn-fixed-3', protocol: 'TCP', localAddress: '0.0.0.0:443', foreignAddress: '0.0.0.0:*', state: 'LISTEN', pid: 2048, process: 'caddy' },
    { id: 'conn-fixed-4', protocol: 'TCP', localAddress: '0.0.0.0:3000', foreignAddress: '0.0.0.0:*', state: 'LISTEN', pid: 4096, process: 'next-server' },
    { id: 'conn-fixed-5', protocol: 'TCP', localAddress: '0.0.0.0:5432', foreignAddress: '0.0.0.0:*', state: 'LISTEN', pid: 3072, process: 'postgres' },
    { id: 'conn-fixed-6', protocol: 'TCP', localAddress: '0.0.0.0:6379', foreignAddress: '0.0.0.0:*', state: 'LISTEN', pid: 5120, process: 'redis-server' },
  )

  return connections
}

export async function GET() {
  return NextResponse.json(generateConnections())
}
