import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/docker/containers — List all containers
export async function GET() {
  try {
    const containers = await db.dockerContainer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // If no containers exist yet, seed with mock data
    if (containers.length === 0) {
      const mockContainers = [
        {
          name: 'agentos-api',
          image: 'node:20-alpine',
          status: 'running',
          ports: JSON.stringify([{ internal: 3000, external: 3000, protocol: 'tcp' }]),
          envVars: JSON.stringify({ NODE_ENV: 'production', PORT: '3000' }),
          networks: JSON.stringify(['agentos-network']),
          volumes: JSON.stringify(['/app/data:/data']),
          cpuPercent: 12.4,
          memoryUsage: 256,
          memoryLimit: 512,
        },
        {
          name: 'agentos-postgres',
          image: 'postgres:16-alpine',
          status: 'running',
          ports: JSON.stringify([{ internal: 5432, external: 5432, protocol: 'tcp' }]),
          envVars: JSON.stringify({ POSTGRES_DB: 'agentos', POSTGRES_USER: 'admin', POSTGRES_PASSWORD: '••••••••' }),
          networks: JSON.stringify(['agentos-network']),
          volumes: JSON.stringify(['/var/lib/postgresql/data']),
          cpuPercent: 3.2,
          memoryUsage: 128,
          memoryLimit: 256,
        },
        {
          name: 'agentos-redis',
          image: 'redis:7-alpine',
          status: 'running',
          ports: JSON.stringify([{ internal: 6379, external: 6379, protocol: 'tcp' }]),
          envVars: JSON.stringify({ REDIS_MAXMEMORY: '128mb' }),
          networks: JSON.stringify(['agentos-network']),
          volumes: JSON.stringify(['/data']),
          cpuPercent: 1.1,
          memoryUsage: 64,
          memoryLimit: 128,
        },
        {
          name: 'agentos-nginx',
          image: 'nginx:latest',
          status: 'running',
          ports: JSON.stringify([
            { internal: 80, external: 80, protocol: 'tcp' },
            { internal: 443, external: 443, protocol: 'tcp' },
          ]),
          envVars: JSON.stringify({ NGINX_HOST: 'rjmlabs.co.uk' }),
          networks: JSON.stringify(['agentos-network', 'frontend']),
          volumes: JSON.stringify(['/etc/nginx/conf.d', '/var/log/nginx']),
          cpuPercent: 0.8,
          memoryUsage: 32,
          memoryLimit: 64,
        },
        {
          name: 'agentos-worker',
          image: 'node:20-alpine',
          status: 'paused',
          ports: JSON.stringify([]),
          envVars: JSON.stringify({ NODE_ENV: 'production', WORKER_CONCURRENCY: '5' }),
          networks: JSON.stringify(['agentos-network']),
          volumes: JSON.stringify(['/app/jobs:/jobs']),
          cpuPercent: 0,
          memoryUsage: 0,
          memoryLimit: 512,
        },
        {
          name: 'agentos-monitor',
          image: 'grafana/grafana:latest',
          status: 'stopped',
          ports: JSON.stringify([{ internal: 3001, external: 3001, protocol: 'tcp' }]),
          envVars: JSON.stringify({ GF_SECURITY_ADMIN_PASSWORD: '••••••••' }),
          networks: JSON.stringify(['agentos-network']),
          volumes: JSON.stringify(['/var/lib/grafana']),
          cpuPercent: 0,
          memoryUsage: 0,
          memoryLimit: 256,
        },
        {
          name: 'agentos-minio',
          image: 'minio/minio:latest',
          status: 'running',
          ports: JSON.stringify([
            { internal: 9000, external: 9000, protocol: 'tcp' },
            { internal: 9001, external: 9001, protocol: 'tcp' },
          ]),
          envVars: JSON.stringify({ MINIO_ROOT_USER: 'minioadmin', MINIO_ROOT_PASSWORD: '••••••••' }),
          networks: JSON.stringify(['agentos-network']),
          volumes: JSON.stringify(['/data']),
          cpuPercent: 2.3,
          memoryUsage: 96,
          memoryLimit: 256,
        },
        {
          name: 'legacy-app',
          image: 'python:3.9-slim',
          status: 'dead',
          ports: JSON.stringify([{ internal: 8080, external: 8080, protocol: 'tcp' }]),
          envVars: JSON.stringify({ FLASK_ENV: 'development' }),
          networks: JSON.stringify([]),
          volumes: JSON.stringify([]),
          cpuPercent: 0,
          memoryUsage: 0,
          memoryLimit: 512,
        },
      ]

      for (const mc of mockContainers) {
        await db.dockerContainer.create({ data: mc })
      }

      const seeded = await db.dockerContainer.findMany({ orderBy: { createdAt: 'desc' } })
      return NextResponse.json({ containers: seeded })
    }

    return NextResponse.json({ containers })
  } catch (error) {
    console.error('Failed to list containers:', error)
    return NextResponse.json({ error: 'Failed to list containers' }, { status: 500 })
  }
}

// POST /api/docker/containers — Create/start a container
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, image, ports, envVars, networks, volumes } = body

    if (!name || !image) {
      return NextResponse.json({ error: 'Name and image are required' }, { status: 400 })
    }

    const container = await db.dockerContainer.create({
      data: {
        name,
        image,
        status: 'running',
        ports: JSON.stringify(ports || []),
        envVars: JSON.stringify(envVars || {}),
        networks: JSON.stringify(networks || []),
        volumes: JSON.stringify(volumes || []),
        cpuPercent: Math.random() * 5,
        memoryUsage: Math.floor(Math.random() * 128) + 16,
        memoryLimit: 512,
      },
    })

    return NextResponse.json({ container }, { status: 201 })
  } catch (error) {
    console.error('Failed to create container:', error)
    return NextResponse.json({ error: 'Failed to create container' }, { status: 500 })
  }
}
