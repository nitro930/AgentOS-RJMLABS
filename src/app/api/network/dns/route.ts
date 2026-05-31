import { NextResponse } from 'next/server'

// In-memory storage for DNS records (simulated)
let dnsRecords = [
  { id: 'dns-1', domain: 'rjmlabs.co.uk', type: 'A', value: '51.38.71.42', ttl: 3600 },
  { id: 'dns-2', domain: 'rjmlabs.co.uk', type: 'AAAA', value: '2001:41d0:301::23', ttl: 3600 },
  { id: 'dns-3', domain: 'www.rjmlabs.co.uk', type: 'CNAME', value: 'rjmlabs.co.uk', ttl: 3600 },
  { id: 'dns-4', domain: 'api.rjmlabs.co.uk', type: 'A', value: '51.38.71.42', ttl: 3600 },
  { id: 'dns-5', domain: 'rjmlabs.co.uk', type: 'MX', value: '10 mail.rjmlabs.co.uk', ttl: 86400 },
  { id: 'dns-6', domain: 'rjmlabs.co.uk', type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all', ttl: 86400 },
  { id: 'dns-7', domain: 'agentos.rjmlabs.co.uk', type: 'A', value: '51.38.71.43', ttl: 3600 },
  { id: 'dns-8', domain: 'ws.rjmlabs.co.uk', type: 'A', value: '51.38.71.43', ttl: 3600 },
  { id: 'dns-9', domain: '_dmarc.rjmlabs.co.uk', type: 'TXT', value: 'v=DMARC1; p=reject; rua=mailto:dmarc@rjmlabs.co.uk', ttl: 86400 },
  { id: 'dns-10', domain: 'rjmlabs.co.uk', type: 'TXT', value: 'google-site-verification=abc123xyz', ttl: 86400 },
]

let nextId = 11

export async function GET() {
  return NextResponse.json({
    resolver: {
      primary: '1.1.1.1',
      secondary: '8.8.8.8',
      searchDomain: 'rjmlabs.co.uk',
    },
    records: dnsRecords,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newRecord = {
      id: `dns-${nextId++}`,
      domain: body.domain || 'example.com',
      type: body.type || 'A',
      value: body.value || '0.0.0.0',
      ttl: body.ttl || 3600,
    }
    dnsRecords = [newRecord, ...dnsRecords]
    return NextResponse.json(newRecord, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create DNS record' }, { status: 500 })
  }
}
