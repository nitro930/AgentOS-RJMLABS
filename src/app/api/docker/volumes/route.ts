import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Mock volumes data
const mockVolumes = [
  {
    id: 'vol_a1b2c3',
    name: 'agentos-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/agentos-data/_data',
    size: 2048,
    containers: 2,
    created: '2025-01-01T00:00:00Z',
    labels: { 'com.docker.compose.volume': 'data' },
  },
  {
    id: 'vol_d4e5f6',
    name: 'postgres-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/postgres-data/_data',
    size: 5120,
    containers: 1,
    created: '2025-01-01T00:00:00Z',
    labels: { 'com.docker.compose.volume': 'postgres' },
  },
  {
    id: 'vol_g7h8i9',
    name: 'redis-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/redis-data/_data',
    size: 128,
    containers: 1,
    created: '2025-01-01T00:00:00Z',
    labels: {},
  },
  {
    id: 'vol_j1k2l3',
    name: 'nginx-logs',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/nginx-logs/_data',
    size: 768,
    containers: 1,
    created: '2025-01-08T16:45:00Z',
    labels: {},
  },
  {
    id: 'vol_m4n5o6',
    name: 'grafana-storage',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/grafana-storage/_data',
    size: 256,
    containers: 1,
    created: '2024-12-20T09:00:00Z',
    labels: {},
  },
  {
    id: 'vol_p7q8r9',
    name: 'minio-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/minio-data/_data',
    size: 15360,
    containers: 1,
    created: '2025-01-05T11:30:00Z',
    labels: { 'com.docker.compose.volume': 'minio' },
  },
]

let volumes = [...mockVolumes]

// GET /api/docker/volumes — List all volumes
export async function GET() {
  return NextResponse.json({ volumes })
}

// POST /api/docker/volumes — Create a volume
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, driver } = body

    if (!name) {
      return NextResponse.json({ error: 'Volume name is required' }, { status: 400 })
    }

    const newVolume = {
      id: `vol_${Math.random().toString(36).substring(2, 8)}`,
      name,
      driver: driver || 'local',
      mountpoint: `/var/lib/docker/volumes/${name}/_data`,
      size: 0,
      containers: 0,
      created: new Date().toISOString(),
      labels: {},
    }

    volumes = [newVolume, ...volumes]

    return NextResponse.json({ volume: newVolume }, { status: 201 })
  } catch (error) {
    console.error('Failed to create volume:', error)
    return NextResponse.json({ error: 'Failed to create volume' }, { status: 500 })
  }
}
