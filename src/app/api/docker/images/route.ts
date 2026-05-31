import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Mock images data — stored in memory since we use SQLite
const mockImages = [
  {
    id: 'img_sha256_a1b2c3',
    name: 'node',
    tag: '20-alpine',
    size: 182,
    created: '2025-01-15T10:30:00Z',
    containers: 2,
  },
  {
    id: 'img_sha256_d4e5f6',
    name: 'postgres',
    tag: '16-alpine',
    size: 233,
    created: '2025-01-10T08:00:00Z',
    containers: 1,
  },
  {
    id: 'img_sha256_g7h8i9',
    name: 'redis',
    tag: '7-alpine',
    size: 40,
    created: '2025-01-12T14:20:00Z',
    containers: 1,
  },
  {
    id: 'img_sha256_j1k2l3',
    name: 'nginx',
    tag: 'latest',
    size: 187,
    created: '2025-01-08T16:45:00Z',
    containers: 1,
  },
  {
    id: 'img_sha256_m4n5o6',
    name: 'grafana/grafana',
    tag: 'latest',
    size: 412,
    created: '2024-12-20T09:00:00Z',
    containers: 1,
  },
  {
    id: 'img_sha256_p7q8r9',
    name: 'minio/minio',
    tag: 'latest',
    size: 168,
    created: '2025-01-05T11:30:00Z',
    containers: 1,
  },
  {
    id: 'img_sha256_s1t2u3',
    name: 'python',
    tag: '3.9-slim',
    size: 152,
    created: '2024-11-30T07:15:00Z',
    containers: 0,
  },
  {
    id: 'img_sha256_v4w5x6',
    name: 'alpine',
    tag: '3.19',
    size: 7,
    created: '2025-01-02T12:00:00Z',
    containers: 0,
  },
  {
    id: 'img_sha256_y7z8a9',
    name: 'traefik',
    tag: 'v3.0',
    size: 152,
    created: '2024-12-15T18:30:00Z',
    containers: 0,
  },
  {
    id: 'img_sha256_b1c2d3',
    name: 'mongo',
    tag: '7',
    size: 695,
    created: '2024-12-10T10:00:00Z',
    containers: 0,
  },
]

// Keep a mutable copy for the session
let images = [...mockImages]

// GET /api/docker/images — List all images
export async function GET() {
  return NextResponse.json({ images })
}

// POST /api/docker/images — Pull a new image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nameTag } = body // e.g. "ubuntu:22.04"

    if (!nameTag) {
      return NextResponse.json({ error: 'Image name:tag is required' }, { status: 400 })
    }

    const [name, tag] = nameTag.includes(':') ? nameTag.split(':') : [nameTag, 'latest']

    const newImage = {
      id: `img_sha256_${Math.random().toString(36).substring(2, 8)}`,
      name,
      tag: tag || 'latest',
      size: Math.floor(Math.random() * 500) + 20,
      created: new Date().toISOString(),
      containers: 0,
    }

    images = [newImage, ...images]

    return NextResponse.json({ image: newImage }, { status: 201 })
  } catch (error) {
    console.error('Failed to pull image:', error)
    return NextResponse.json({ error: 'Failed to pull image' }, { status: 500 })
  }
}
