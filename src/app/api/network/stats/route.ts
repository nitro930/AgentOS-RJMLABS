import { NextResponse } from 'next/server'

function generateBandwidthHistory() {
  const now = Date.now()
  const points = []
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now - i * 60000)
    points.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: time.toISOString(),
      bandwidthIn: Math.round((80 + Math.random() * 120) * 10) / 10,
      bandwidthOut: Math.round((40 + Math.random() * 80) * 10) / 10,
    })
  }
  return points
}

export async function GET() {
  const currentIn = Math.round((80 + Math.random() * 120) * 10) / 10
  const currentOut = Math.round((40 + Math.random() * 80) * 10) / 10
  const peakIn = Math.round((currentIn * (1.2 + Math.random() * 0.5)) * 10) / 10
  const peakOut = Math.round((currentOut * (1.2 + Math.random() * 0.5)) * 10) / 10

  return NextResponse.json({
    bandwidth: {
      currentIn,
      currentOut,
      peakIn,
      peakOut,
      unit: 'Mbps',
    },
    connections: {
      total: Math.floor(140 + Math.random() * 60),
      active: Math.floor(40 + Math.random() * 30),
      listeners: Math.floor(8 + Math.random() * 8),
    },
    firewall: {
      status: 'active',
      rulesCount: 12,
      blockedToday: Math.floor(40 + Math.random() * 30),
    },
    bandwidthHistory: generateBandwidthHistory(),
  })
}
