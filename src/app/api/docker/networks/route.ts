import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Mock networks data
const mockNetworks = [
  {
    id: 'net_br1a2b3',
    name: 'agentos-network',
    driver: 'bridge',
    scope: 'local',
    containers: 6,
    created: '2025-01-01T00:00:00Z',
    labels: { 'com.docker.compose.network': 'default' },
  },
  {
    id: 'net_br4c5d6',
    name: 'frontend',
    driver: 'bridge',
    scope: 'local',
    containers: 2,
    created: '2025-01-01T00:00:00Z',
    labels: { 'com.docker.compose.network': 'frontend' },
  },
  {
    id: 'net_br7e8f9',
    name: 'backend',
    driver: 'bridge',
    scope: 'local',
    containers: 4,
    created: '2025-01-05T10:30:00Z',
    labels: {},
  },
  {
    id: 'net_br0g1h2',
    name: 'monitoring',
    driver: 'bridge',
    scope: 'local',
    containers: 1,
    created: '2025-01-10T14:00:00Z',
    labels: { environment: 'production' },
  },
  {
    id: 'net_ho3i4j5',
    name: 'host',
    driver: 'host',
    scope: 'local',
    containers: 0,
    created: '2025-01-01T00:00:00Z',
    labels: {},
  },
  {
    id: 'net_no6k7l8',
    name: 'none',
    driver: 'null',
    scope: 'local',
    containers: 0,
    created: '2025-01-01T00:00:00Z',
    labels: {},
  },
]

let networks = [...mockNetworks]

// GET /api/docker/networks — List all networks
export async function GET() {
  return NextResponse.json({ networks })
}

// POST /api/docker/networks — Create a network
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, driver } = body

    if (!name) {
      return NextResponse.json({ error: 'Network name is required' }, { status: 400 })
    }

    const newNetwork = {
      id: `net_br${Math.random().toString(36).substring(2, 8)}`,
      name,
      driver: driver || 'bridge',
      scope: 'local',
      containers: 0,
      created: new Date().toISOString(),
      labels: {},
    }

    networks = [newNetwork, ...networks]

    return NextResponse.json({ network: newNetwork }, { status: 201 })
  } catch (error) {
    console.error('Failed to create network:', error)
    return NextResponse.json({ error: 'Failed to create network' }, { status: 500 })
  }
}
