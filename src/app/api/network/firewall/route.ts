import { NextResponse } from 'next/server'

// In-memory storage for firewall rules (simulated)
let firewallRules = [
  { id: 'fw-1', action: 'allow', protocol: 'TCP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '22', direction: 'in', comment: 'SSH access' },
  { id: 'fw-2', action: 'allow', protocol: 'TCP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '80', direction: 'in', comment: 'HTTP' },
  { id: 'fw-3', action: 'allow', protocol: 'TCP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '443', direction: 'in', comment: 'HTTPS' },
  { id: 'fw-4', action: 'allow', protocol: 'TCP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '3000', direction: 'in', comment: 'AgentOS API' },
  { id: 'fw-5', action: 'deny', protocol: 'TCP', source: '10.0.0.0/8', destination: '0.0.0.0/0', port: '5432', direction: 'in', comment: 'Block external DB access' },
  { id: 'fw-6', action: 'allow', protocol: 'TCP', source: '127.0.0.1', destination: '127.0.0.1', port: '5432', direction: 'in', comment: 'Local DB access' },
  { id: 'fw-7', action: 'allow', protocol: 'TCP', source: '127.0.0.1', destination: '127.0.0.1', port: '6379', direction: 'in', comment: 'Local Redis access' },
  { id: 'fw-8', action: 'deny', protocol: 'UDP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', direction: 'in', comment: 'Block unsolicited UDP' },
  { id: 'fw-9', action: 'allow', protocol: 'ICMP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', direction: 'in', comment: 'Allow ping' },
  { id: 'fw-10', action: 'allow', protocol: 'TCP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', direction: 'out', comment: 'Allow all outbound' },
  { id: 'fw-11', action: 'deny', protocol: 'TCP', source: '192.168.1.0/24', destination: '0.0.0.0/0', port: '3030', direction: 'in', comment: 'Block internal subnet from WS' },
  { id: 'fw-12', action: 'allow', protocol: 'TCP', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '3030', direction: 'in', comment: 'WebSocket service' },
]

let nextId = 13

export async function GET() {
  return NextResponse.json({
    status: 'active',
    defaultPolicy: 'deny',
    rules: firewallRules,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newRule = {
      id: `fw-${nextId++}`,
      action: body.action || 'deny',
      protocol: body.protocol || 'TCP',
      source: body.source || '0.0.0.0/0',
      destination: body.destination || '0.0.0.0/0',
      port: body.port || '*',
      direction: body.direction || 'in',
      comment: body.comment || '',
    }
    firewallRules = [newRule, ...firewallRules]
    return NextResponse.json(newRule, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create firewall rule' }, { status: 500 })
  }
}
