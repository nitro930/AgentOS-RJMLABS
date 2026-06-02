# AgentOS — RJMLABS VPS Deployment Guide

> **Complete reference for deploying AgentOS on a VPS host.**
> Designed to be handed to Claude (or any AI assistant) alongside the GitHub repository to set up the full production environment.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [VPS Requirements](#2-vps-requirements)
3. [GitHub Repository Setup](#3-github-repository-setup)
4. [Server Initial Setup](#4-server-initial-setup)
5. [Install Runtime Dependencies](#5-install-runtime-dependencies)
6. [Clone and Install Project](#6-clone-and-install-project)
7. [Environment Configuration](#7-environment-configuration)
8. [Database Setup (Prisma + SQLite)](#8-database-setup-prisma--sqlite)
9. [Build the Application](#9-build-the-application)
10. [Production Deployment Options](#10-production-deployment-options)
    - [Option A: PM2 (Bare Metal)](#option-a-pm2-bare-metal)
    - [Option B: Docker Compose](#option-b-docker-compose)
11. [Caddy Reverse Proxy & HTTPS](#11-caddy-reverse-proxy--https)
12. [DNS Configuration](#12-dns-configuration)
13. [Firewall & Security Hardening](#13-firewall--security-hardening)
14. [Seeding the Database](#14-seeding-the-database)
15. [Backup Strategy](#15-backup-strategy)
16. [Monitoring & Health Checks](#16-monitoring--health-checks)
17. [Updating / Redeploying](#17-updating--redeploying)
18. [Troubleshooting](#18-troubleshooting)
19. [Architecture Reference](#19-architecture-reference)
20. [All 102 Prisma Models](#20-all-102-prisma-models)
21. [All 71 UI Components](#21-all-71-ui-components)
22. [All 160+ API Routes](#22-all-160-api-routes)

---

## 1. Project Overview

**AgentOS by RJMLABS.CO.UK** is a comprehensive AI Agent Operating System built as a single-page Next.js application. It provides a cyberpunk-themed dark UI for managing AI agents, memory vaults, workflows, MCP integrations, agent swarms, knowledge bases with RAG, human-in-the-loop approval gates, guardrails, cost tracking (in GBP/£), and much more.

| Property | Value |
|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript |
| **Database** | SQLite via Prisma ORM (102 models) |
| **State Management** | Zustand |
| **UI Library** | shadcn/ui + Radix + Tailwind CSS 4 |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Runtime** | Node.js 20+ or Bun |
| **Branding** | RJMLABS.CO.UK — "RJM" logo, £/GBP currency |
| **Encryption** | AES-256-CBC for API keys |
| **Deployment** | Docker + Caddy or PM2 + Caddy |
| **Output Mode** | Standalone (`next.config.ts` → `output: "standalone"`) |

### 7-Layer Architecture

| Layer | Name | Purpose |
|---|---|---|
| L1 | Foundation | System config, settings, onboarding |
| L2 | Memory (Omi + Obsidian) | Memory vault, knowledge base, RAG, knowledge graph |
| L3 | Brain (Routed Models) | Model configs, routing rules, brain router |
| L4 | Agents | Agent CRUD, tasks, skills, chains, delegation, consensus |
| L5 | Command Center | Mission control, command terminal, scheduler, event bus, automation |
| L6 | Production Surfaces | Workspaces, goals, playground, file manager, prompt library |
| L7 | Loop (Output Writeback) | Agent outputs, export/import, backup/recovery |
| L8+ | Enterprise | Analytics, cost tracker, guardrails, RBAC, observability, Docker manager, marketplace |

---

## 2. VPS Requirements

### Minimum Specs

| Resource | Minimum | Recommended |
|---|---|---|
| **CPU** | 1 vCPU | 2+ vCPU |
| **RAM** | 1 GB | 2+ GB |
| **Disk** | 10 GB | 25+ GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **Network** | Public IP | Public IP + domain |

### Ports to Open

| Port | Service |
|---|---|
| 22 | SSH |
| 80 | HTTP (Caddy) |
| 443 | HTTPS (Caddy) |
| 3000 | AgentOS (internal, not exposed if using Caddy) |

### Domain (Optional but Recommended)

Point a domain or subdomain (e.g., `agentos.rjmlabs.co.uk`) to your VPS IP address. Caddy will auto-provision Let's Encrypt SSL certificates.

---

## 3. GitHub Repository Setup

The project needs to be uploaded to a GitHub repository. From your local machine:

```bash
# Navigate to the project directory
cd /path/to/AgentOS

# Initialize git (if not already done)
git init

# Ensure .gitignore is correct
cat .gitignore
# Should include: node_modules, .next, .env*, *.log, .z-ai-config, skills/

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: AgentOS RJMLABS"

# Create the GitHub repo (requires GitHub CLI or manual creation)
gh repo create RJMLABS/agentos --private --source=. --push

# OR manually:
git remote add origin git@github.com:RJMLABS/agentos.git
git branch -M main
git push -u origin main
```

### Files to Verify Before Push

- `.gitignore` — Must exclude `node_modules/`, `.next/`, `.env*`, `*.log`, `db/`, `*.db`
- `.env` — **Must NOT be committed** (contains `DATABASE_URL`); use `.env.example` instead
- `prisma/schema.prisma` — 102 models, must be present
- `Dockerfile` — Production Docker build
- `docker-compose.yml` — Docker Compose orchestration
- `Caddyfile` — Reverse proxy configuration

### Create .env.example for the Repo

```bash
cat > .env.example << 'EOF'
# Database — SQLite file path (will be created automatically)
DATABASE_URL=file:./data/agentos.db

# Encryption key for API key storage (generate: openssl rand -hex 16)
ENCRYPTION_KEY=change-me-to-a-secure-32char-key

# NextAuth (generate: openssl rand -base64 32)
NEXTAUTH_SECRET=change-me-to-a-secure-secret
NEXTAUTH_URL=http://localhost:3000

# Optional: If deploying behind a proxy
# PORT=3000
# HOSTNAME=0.0.0.0
EOF
```

---

## 4. Server Initial Setup

Run these commands on the VPS as root:

```bash
# Update the system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl git unzip wget software-properties-common apt-transport-https ca-certificates gnupg lsb-release htop

# Create a deployment user (optional but recommended)
adduser agentos --disabled-password --gecos "AgentOS"
usermod -aG sudo agentos

# Set up SSH key authentication (from your local machine)
ssh-copy-id agentos@YOUR_VPS_IP

# Disable root SSH login and password auth
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Set the server timezone
timedatectl set-timezone Europe/London
```

---

## 5. Install Runtime Dependencies

### Option 1: Node.js + npm (Recommended for PM2 deployment)

```bash
# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify
node --version   # Should be v20.x
npm --version    # Should be 10.x

# Install PM2 globally
npm install -g pm2

# Install Prisma CLI globally (optional, useful for debugging)
npm install -g prisma
```

### Option 2: Bun (Alternative runtime — project uses bun.lock)

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Verify
bun --version
```

### Option 3: Docker + Docker Compose (For containerized deployment)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add agentos user to docker group
usermod -aG docker agentos

# Install Docker Compose (v2 is bundled with Docker)
docker compose version

# Enable Docker on boot
systemctl enable docker
systemctl start docker
```

---

## 6. Clone and Install Project

```bash
# Switch to the deployment user
su - agentos

# Clone the repository
cd /home/agentos
git clone git@github.com:RJMLABS/agentos.git
cd agentos

# Install dependencies
npm install

# If using Bun instead:
# bun install
```

---

## 7. Environment Configuration

```bash
# Create the .env file from the example
cp .env.example .env

# Edit with your production values
nano .env
```

### Required Environment Variables

```env
# Database — SQLite file path (data directory will be created)
DATABASE_URL=file:./data/agentos.db

# Encryption key for AES-256-CBC API key encryption
# Generate with: openssl rand -hex 16
ENCRYPTION_KEY=<your-32-character-hex-key>

# NextAuth configuration
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=<your-nextauth-secret>
NEXTAUTH_URL=https://agentos.rjmlabs.co.uk

# Server binding
PORT=3000
HOSTNAME=0.0.0.0
```

### Generate Secure Keys

```bash
# Generate ENCRYPTION_KEY (32 hex chars for AES-256)
openssl rand -hex 16
# Example output: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Example output: vK8j3N2m9Qw7Xp4Rt6Yb5Hc1Fs8Gd0Az

# Create the data directory
mkdir -p /home/agentos/agentos/data
```

### Critical: .env Security

```bash
# Ensure .env is never world-readable
chmod 600 .env

# Verify .gitignore includes .env*
grep ".env" .gitignore
```

---

## 8. Database Setup (Prisma + SQLite)

```bash
# Generate the Prisma client (must run before building)
npx prisma generate

# Push the schema to create the SQLite database and all 102 tables
npx prisma db push

# Verify the database was created
ls -la data/agentos.db
# Should show the SQLite file

# (Optional) View the database with Prisma Studio
npx prisma studio
# Opens a web UI at http://localhost:5555
```

### Important Notes on the Schema

- The project uses **102 Prisma models** covering all features from L1 through L8+
- SQLite is used for simplicity — no external database server needed
- The `prisma db push` command creates/updates tables without migration files
- The database file location is controlled by `DATABASE_URL` in `.env`
- For Docker deployments, the database is stored in a persistent Docker volume at `/app/data/agentos.db`

---

## 9. Build the Application

```bash
# Build the Next.js application (standalone output)
npm run build

# The build script does:
# 1. next build (creates .next/standalone)
# 2. Copies .next/static → .next/standalone/.next/static
# 3. Copies public → .next/standalone/public

# Verify the standalone build
ls -la .next/standalone/
# Should show: server.js, .next/, node_modules/, public/
```

### What the Build Produces

The `output: "standalone"` configuration in `next.config.ts` creates a self-contained production bundle at `.next/standalone/` that includes:
- `server.js` — The production server entry point
- `.next/static/` — Static assets (JS, CSS, images)
- `public/` — Public assets
- `node_modules/` — Only production dependencies

---

## 10. Production Deployment Options

### Option A: PM2 (Bare Metal)

This is the simplest approach — run AgentOS directly on the VPS with PM2 process management.

```bash
# Start AgentOS with PM2
cd /home/agentos/agentos

# Using Node.js
pm2 start .next/standalone/server.js --name agentos --node-args="--env-file=.env"

# OR using Bun (if installed)
pm2 start "bun .next/standalone/server.js" --name agentos

# Save the PM2 process list (survives reboots)
pm2 save

# Set up PM2 to start on boot
pm2 startup
# This will output a command — copy and run it

# Verify it's running
pm2 status
pm2 logs agentos
```

#### PM2 Ecosystem Config (Alternative)

Create `ecosystem.config.js` in the project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'agentos',
      script: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      node_args: '--env-file=.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '750M',
      error_file: './logs/agentos-error.log',
      out_file: './logs/agentos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
}
```

Then start with:

```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
```

#### PM2 Useful Commands

```bash
pm2 status              # View all processes
pm2 logs agentos        # View logs
pm2 restart agentos     # Restart
pm2 stop agentos        # Stop
pm2 delete agentos      # Remove from PM2
pm2 monit               # Real-time monitoring
pm2 describe agentos    # Detailed process info
```

---

### Option B: Docker Compose

This approach uses the included `Dockerfile` and `docker-compose.yml` for containerized deployment.

```bash
cd /home/agentos/agentos

# Create a .env file in the project root (Docker Compose reads it)
# Make sure DATABASE_URL uses the container path: file:./data/agentos.db

# Build and start all services
docker compose up -d --build

# Verify containers are running
docker compose ps

# View logs
docker compose logs -f agentos

# The Caddy container will also start and proxy requests
```

#### Docker Compose Service Details

| Service | Image | Port | Purpose |
|---|---|---|---|
| `agentos` | Built from Dockerfile | 3000 (internal) | Next.js application |
| `caddy` | caddy:2-alpine | 80, 443 | Reverse proxy + auto-HTTPS |

#### Docker Volume Persistence

| Volume | Mount Point | Purpose |
|---|---|---|
| `agentos-data` | `/app/data` | SQLite database |
| `agentos-uploads` | `/app/uploads` | User uploads |
| `caddy-data` | `/data` | Caddy certificates |
| `caddy-config` | `/config` | Caddy configuration |

#### Docker Useful Commands

```bash
docker compose up -d --build        # Rebuild and restart
docker compose down                  # Stop all containers
docker compose logs -f agentos       # Follow AgentOS logs
docker compose logs -f caddy         # Follow Caddy logs
docker compose restart agentos       # Restart just AgentOS
docker compose exec agentos sh       # Shell into the container
docker compose ps                    # Check container status
docker system prune -a               # Clean up unused images/containers
```

---

## 11. Caddy Reverse Proxy & HTTPS

### With Docker Compose (Automatic)

The `docker-compose.yml` already includes a Caddy service. Just update the `Caddyfile` with your domain:

```bash
nano Caddyfile
```

Replace `:80` with your domain:

```
agentos.rjmlabs.co.uk {
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }

    encode gzip zstd

    @static path *.js *.css *.svg *.png *.jpg *.jpeg *.gif *.ico *.woff *.woff2 *.ttf *.eot
    header @static Cache-Control "public, max-age=31536000, immutable"

    @health path /api/health
    log @health off

    handle {
        reverse_proxy agentos:3000 {
            header_up Host {host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Real-IP {remote_host}
            flush_interval -1
        }
    }

    log {
        output file /var/log/caddy/agentos.log {
            max_size 10MB
            max_backups 3
        }
        format json
    }
}
```

Then restart Caddy:

```bash
docker compose restart caddy
```

Caddy will **automatically** obtain and renew Let's Encrypt SSL certificates for your domain.

### Without Docker (Standalone Caddy)

```bash
# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Edit the Caddyfile
nano /etc/caddy/Caddyfile
# Use the same content as above but replace "agentos:3000" with "localhost:3000"

# Start Caddy
systemctl enable caddy
systemctl start caddy
systemctl status caddy
```

---

## 12. DNS Configuration

In your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy), create DNS records pointing to your VPS:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | agentos | YOUR_VPS_IP | 300 |
| AAAA | agentos | YOUR_VPS_IPV6 | 300 (if applicable) |

If using Cloudflare:
- Set SSL mode to "Full (Strict)" if using Cloudflare proxy
- Or set to "DNS Only" (grey cloud) to let Caddy handle SSL directly

---

## 13. Firewall & Security Hardening

```bash
# Install UFW
apt install -y ufw

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this before enabling UFW!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Do NOT expose port 3000 externally (Caddy handles it internally)
# If you need direct access temporarily:
# ufw allow from YOUR_HOME_IP to any port 3000

# Enable the firewall
ufw enable

# Verify rules
ufw status verbose
```

### Additional Security

```bash
# Install fail2ban for SSH brute-force protection
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Harden SSH further
cat >> /etc/ssh/sshd_config << 'EOF'
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers agentos
EOF
systemctl restart sshd

# Set up automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 14. Seeding the Database

The project includes a comprehensive seed route that populates the database with demo data including agents (Hermes, OpenClaw, Claude Code, Sentinel), workflows, memory entries, cost entries, and more.

```bash
# Seed the database by calling the seed API endpoint
# First, ensure AgentOS is running, then:

curl -X POST http://localhost:3000/api/seed

# Or from a browser:
# https://agentos.rjmlabs.co.uk/api/seed

# The seed creates:
# - 4 Agents (Hermes, OpenClaw, Claude Code, Sentinel)
# - 5 Model Configs (GPT-4o, Claude 3.5 Sonnet, GPT-4o-mini, Llama 3.1, Mistral Large)
# - 3 Routing Rules
# - 30+ Memory Entries
# - 5 Workflows
# - 5 Scheduled Tasks
# - 8 Notifications
# - 20+ Cost Entries with £/GBP values
# - 3 Budget Alerts
# - 3 Webhooks (GitHub, Slack, Stripe)
# - 10+ Agent Messages
# - MCP Servers, Tools, Resources, Prompts
# - 3 Agent Teams
# - 2 Swarms
# - Knowledge Bases with Documents and Chunks
# - Guardrails (PII, Toxicity, Rate Limit, Cost Limit, Scope)
# - Approval Requests and Review Gates
# - Escalation Policies
# - Content Policies
# - Eval Suites, Cases, and Runs
# - Traces and Spans
# - Users, Roles, and Permissions
# - Plugins
# - Templates
# - Health Metrics and Alerts
# - And much more
```

### Important: Seed Data Currency

All seed data uses **£/GBP** currency. Budget alerts, cost entries, and guardrail messages all display with the £ (Pound Sterling) symbol. The `PoundSterling` icon from lucide-react is used throughout the UI instead of `DollarSign`.

---

## 15. Backup Strategy

### Automated SQLite Backup (Cron)

```bash
# Create a backup script
cat > /home/agentos/backup-agentos.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/home/agentos/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="/home/agentos/agentos/data/agentos.db"

# Stop the app briefly for consistent backup (optional for SQLite)
# pm2 stop agentos

# Create backup
cp "$DB_PATH" "$BACKUP_DIR/agentos_${TIMESTAMP}.db"

# Compress
gzip "$BACKUP_DIR/agentos_${TIMESTAMP}.db"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "agentos_*.db.gz" -mtime +30 -delete

# Restart (if stopped)
# pm2 start agentos

echo "Backup completed: agentos_${TIMESTAMP}.db.gz"
SCRIPT

chmod +x /home/agentos/backup-agentos.sh

# Schedule daily backups at 3 AM
crontab -e
# Add this line:
0 3 * * * /home/agentos/backup-agentos.sh >> /home/agentos/backups/backup.log 2>&1
```

### Using the Built-in Backup API

AgentOS has a built-in backup/restore system accessible through the UI or API:

```bash
# Create a backup via API
curl -X POST http://localhost:3000/api/backups \
  -H "Content-Type: application/json" \
  -d '{"name": "Daily Backup", "type": "full", "description": "Automated daily backup"}'

# List backups
curl http://localhost:3000/api/backups

# Restore from a backup
curl -X POST http://localhost:3000/api/backups/BACKUP_ID/restore
```

### Off-Site Backup (Recommended)

```bash
# Sync backups to S3 (requires awscli)
apt install -y awscli
aws configure  # Set up AWS credentials

# Add to the backup script:
aws s3 sync /home/agentos/backups s3://rjmlabs-agentos-backups/$(hostname)/
```

---

## 16. Monitoring & Health Checks

### Health Check Endpoint

AgentOS exposes a health check endpoint:

```bash
# Simple health check
curl http://localhost:3000/api/health

# Detailed metrics (CPU, memory, disk, uptime)
curl http://localhost:3000/api/health/metrics
```

### System Resource Monitoring

```bash
# The AgentOS UI includes built-in system monitoring at /system-health
# It shows: CPU, memory, disk, network stats, load averages

# API endpoint for system resources
curl http://localhost:3000/api/system-resources
```

### PM2 Monitoring

```bash
# Real-time monitoring dashboard
pm2 monit

# Process details
pm2 describe agentos

# Memory and CPU usage
pm2 list
```

### Docker Health Checks

The Dockerfile includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

Check health status:

```bash
docker inspect --format='{{.State.Health.Status}}' agentos
```

---

## 17. Updating / Redeploying

### PM2 Deployment

```bash
cd /home/agentos/agentos

# Pull the latest code
git pull origin main

# Install any new dependencies
npm install

# Regenerate Prisma client (if schema changed)
npx prisma generate
npx prisma db push

# Rebuild
npm run build

# Restart the application
pm2 restart agentos

# Check logs
pm2 logs agentos
```

### Docker Deployment

```bash
cd /home/agentos/agentos

# Pull the latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Check logs
docker compose logs -f agentos
```

### Zero-Downtime Update (Advanced)

```bash
# Build new version in a separate directory
git clone git@github.com:RJMLABS/agentos.git /home/agentos/agentos-new
cd /home/agentos/agentos-new
npm install
npx prisma generate
npm run build

# Swap directories
mv /home/agentos/agentos /home/agentos/agentos-old
mv /home/agentos/agentos-new /home/agentos/agentos

# Restart
cd /home/agentos/agentos
pm2 restart agentos

# Clean up old version after confirming it works
rm -rf /home/agentos/agentos-old
```

---

## 18. Troubleshooting

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

### Database Issues

```bash
# Check database file exists and has data
ls -la data/agentos.db
sqlite3 data/agentos.db ".tables"

# Reset the database (WARNING: destroys all data)
rm data/agentos.db
npx prisma db push

# Re-seed
curl -X POST http://localhost:3000/api/seed
```

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 $(lsof -t -i:3000)

# Restart
pm2 restart agentos
```

### Caddy / SSL Issues

```bash
# Check Caddy logs
docker compose logs caddy
# OR
journalctl -u caddy

# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# Check certificate status
docker compose exec caddy caddy list-modules
```

### Memory Issues

```bash
# Check server memory
free -h

# Check Node.js memory usage
pm2 describe agentos | grep memory

# Increase Node.js heap size (in ecosystem.config.js)
# node_args: '--max-old-space-size=512'

# Docker: increase memory limit in docker-compose.yml
# deploy.resources.limits.memory: 2G
```

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs agentos --lines 100

# Check if the standalone build exists
ls -la .next/standalone/server.js

# Try running directly for debugging
cd .next/standalone
NODE_ENV=production node server.js
```

---

## 19. Architecture Reference

### Tech Stack Detail

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.1.1 |
| Language | TypeScript | 5.x |
| Database | SQLite via Prisma | 6.11.1 |
| ORM | Prisma Client | 6.11.1 |
| State | Zustand | 5.0.6 |
| UI Components | shadcn/ui + Radix | Latest |
| CSS | Tailwind CSS | 4.x |
| Charts | Recharts | 2.15.4 |
| Animation | Framer Motion | 12.23.2 |
| Auth | NextAuth | 4.24.11 |
| AI SDK | z-ai-web-dev-sdk | 0.0.17 |
| Drag & Drop | @dnd-kit | 6.3.1 |
| Tables | @tanstack/react-table | 8.21.3 |
| Forms | react-hook-form + zod | 7.60.0 / 4.0.2 |

### Key Configuration Files

| File | Purpose |
|---|---|
| `next.config.ts` | `output: "standalone"`, `ignoreBuildErrors: true` |
| `prisma/schema.prisma` | 102 database models |
| `.env` | `DATABASE_URL`, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET` |
| `Dockerfile` | Multi-stage Node.js 20 Alpine build |
| `docker-compose.yml` | AgentOS + Caddy services |
| `Caddyfile` | Reverse proxy with security headers |
| `.gitignore` | Excludes node_modules, .next, .env*, logs |

### Currency & Branding

All currency displays use **£ (UK Pounds / GBP)**:
- `PoundSterling` lucide icon (not `DollarSign`) used across 6 components
- All cost displays use `£` prefix (e.g., `£142.50`)
- Seed data uses `currency: 'gbp'` and `currency: 'GBP'`
- Budget alerts, guardrail messages all use £

Branding: **RJMLABS.CO.UK** with "RJM" logo throughout the UI.

---

## 20. All 102 Prisma Models

These are the complete database models in `prisma/schema.prisma`:

### L1 — Foundation
1. SystemConfig

### L2 — Memory
2. MemoryEntry

### L3 — Brain
3. ModelConfig
4. RoutingRule

### L4 — Agents
5. Agent
6. AgentTask

### L5 — Command Center
7. CommandLog

### L6 — Production Surfaces
8. Workspace
9. Goal

### L7 — Loop
10. AgentOutput

### Analytics & Activity
11. ActivityEvent

### Workflow & Scheduling
12. Workflow
13. ScheduledTask

### Notifications
14. Notification

### Cost & Usage
15. CostEntry
16. BudgetAlert

### Webhooks
17. Webhook
18. WebhookEvent

### Agent Communication
19. AgentMessage

### Backup & Recovery
20. Backup

### Templates
21. Template

### VPS Terminal
22. TerminalSession
23. TerminalCommand

### Security
24. ApiKey
25. AccessRule

### Audit
26. AuditLog

### Playground
27. PlaygroundSession

### Plugins
28. Plugin

### Health Monitoring
29. HealthMetric
30. HealthAlert

### File Manager
31. FileEntry

### Agent Skills
32. AgentSkill

### MCP (Model Context Protocol)
33. MCPServer
34. MCPTool
35. MCPResource
36. MCPPrompt
37. MCPExecution
38. MCPPipeline

### Notification Channels
39. NotificationChannel
40. ChannelDelivery

### Agent Swarm
41. Swarm
42. SwarmMember
43. SwarmTask
44. SwarmDecision

### RAG Knowledge Base
45. KnowledgeBase
46. KnowledgeDocument
47. KnowledgeChunk
48. RetrievalQuery

### Human-in-the-Loop
49. ApprovalRequest
50. ReviewGate
51. EscalationPolicy

### Guardrails & Safety
52. Guardrail
53. GuardrailViolation
54. ContentPolicy

### Agent Evals
55. EvalSuite
56. EvalCase
57. EvalRun
58. EvalResult

### Observability & Tracing
59. Trace
60. TraceSpan

### Service Graph
61. ServiceGraph
62. ServiceEdge

### Users & RBAC
63. User
64. UserSession
65. Role
66. RolePermission

### Teams
67. AgentTeam
68. TeamMember
69. TeamChannel

### Agent Chains
70. AgentChain
71. ChainRun

### Delegation
72. Delegation
73. DelegationHistory

### Consensus
74. ConsensusRound
75. ConsensusVote

### Benchmarking
76. BenchmarkSuite
77. BenchmarkRun

### Versioning
78. AgentVersion

### Environment Manager
79. EnvVar
80. EnvProfile

### Marketplace
81. MarketplaceAgent
82. MarketplaceReview

### Dashboard Customization
83. DashboardWidget
84. DashboardPreference

### Prompt Library
85. PromptTemplate

### Feature Flags
86. FeatureFlag
87. FeatureFlagHistory

### Docker Manager
88. DockerContainer

### Onboarding
89. OnboardingState
90. OnboardingStep

### Automation
91. AutomationRule
92. AutomationExecution

### Event Bus
93. EventTopic
94. EventSubscription
95. EventRecord
96. EventDelivery

### Resource Quotas
97. ResourceQuota
98. QuotaUsageRecord

### Incident Management
99. Incident
100. IncidentTimeline
101. IncidentAction
102. PostMortem

---

## 21. All 71 UI Components

Located in `src/components/agent-os/`:

| # | Component File | Feature |
|---|---|---|
| 1 | activity-timeline.tsx | Activity feed in mission control |
| 2 | agent-benchmarking.tsx | Agent benchmark suites & runs |
| 3 | agent-card.tsx | Individual agent display card |
| 4 | agent-chains.tsx | Agent chain orchestration |
| 5 | agent-consensus.tsx | Consensus voting interface |
| 6 | agent-delegation.tsx | Task delegation management |
| 7 | agent-evals.tsx | Evaluation suites and results |
| 8 | agent-grid.tsx | Agent grid layout view |
| 9 | agent-marketplace.tsx | Browse & install marketplace agents |
| 10 | agent-messages.tsx | Agent-to-agent messaging |
| 11 | agent-playground.tsx | Test agents in a sandbox |
| 12 | agent-skills.tsx | Manage agent skills/tools |
| 13 | agent-swarm.tsx | Swarm management & monitoring |
| 14 | agent-teams.tsx | Team management |
| 15 | agent-versioning.tsx | Agent version history & rollback |
| 16 | analytics-dashboard.tsx | Analytics with Recharts |
| 17 | audit-log.tsx | Audit trail viewer |
| 18 | automation-rules.tsx | Automation rule builder |
| 19 | backup-recovery.tsx | Backup & restore management |
| 20 | brain-router.tsx | Model routing & brain configuration |
| 21 | breadcrumb-nav.tsx | Navigation breadcrumbs |
| 22 | command-terminal.tsx | Command terminal interface |
| 23 | cost-tracker.tsx | Cost tracking with £/GBP |
| 24 | create-agent-dialog.tsx | Create new agent dialog |
| 25 | create-goal-dialog.tsx | Create new goal dialog |
| 26 | create-memory-dialog.tsx | Create new memory entry dialog |
| 27 | dashboard-customizer.tsx | Dashboard widget customization |
| 28 | docker-manager.tsx | Docker container management |
| 29 | environment-manager.tsx | Environment variable profiles |
| 30 | error-boundary.tsx | Error boundary wrapper |
| 31 | event-bus.tsx | Event bus topics & subscriptions |
| 32 | export-import.tsx | Data export & import |
| 33 | feature-flags.tsx | Feature flag management |
| 34 | file-manager.tsx | VPS file browser |
| 35 | global-search.tsx | Global search (Cmd+K) |
| 36 | goal-card.tsx | Goal display card |
| 37 | guardrails.tsx | Safety guardrails & violations |
| 38 | human-in-loop.tsx | Approval gates & review |
| 39 | incident-management.tsx | Incident tracking & post-mortems |
| 40 | keyboard-shortcuts.tsx | Keyboard shortcut help |
| 41 | knowledge-base.tsx | RAG knowledge base management |
| 42 | knowledge-graph.tsx | Knowledge graph visualization |
| 43 | loop-system.tsx | Output writeback & routing |
| 44 | mcp-servers.tsx | MCP server management |
| 45 | memory-card.tsx | Memory entry display card |
| 46 | memory-vault.tsx | Memory vault (Omi + Obsidian) |
| 47 | mission-control.tsx | Main dashboard / mission control |
| 48 | mobile-nav.tsx | Mobile responsive navigation |
| 49 | network-monitor.tsx | Network stats & connections |
| 50 | notification-center.tsx | Notification management |
| 51 | notification-channels.tsx | Notification channel config |
| 52 | observability.tsx | Traces, spans, service graph |
| 53 | onboarding-wizard.tsx | First-run onboarding wizard |
| 54 | plugin-system.tsx | Plugin management |
| 55 | production-surfaces.tsx | Workspaces & goals overview |
| 56 | prompt-library.tsx | Prompt template management |
| 57 | resource-quotas.tsx | Resource quota management |
| 58 | scheduler.tsx | Cron-based task scheduling |
| 59 | security-vault.tsx | API key management (AES-256) |
| 60 | settings-page.tsx | System settings |
| 61 | shortcuts-provider.tsx | Keyboard shortcuts context |
| 62 | sidebar.tsx | Main sidebar navigation |
| 63 | stat-card.tsx | Stat display card |
| 64 | system-health.tsx | Health monitoring dashboard |
| 65 | system-resource-monitor.tsx | CPU/RAM/Disk monitoring |
| 66 | template-library.tsx | Template browsing & usage |
| 67 | user-management.tsx | Users & RBAC management |
| 68 | user-menu.tsx | User dropdown menu |
| 69 | vps-terminal.tsx | VPS SSH terminal |
| 70 | webhook-integrations.tsx | Webhook management |
| 71 | workflow-builder.tsx | Visual workflow builder |

### Additional Supporting Components

| Component | Purpose |
|---|---|
| auth-guard.tsx | Authentication guard |
| empty-state.tsx | Empty state placeholder |
| section-skeleton.tsx | Loading skeleton |

---

## 22. All 160+ API Routes

Located in `src/app/api/`, these are the full REST API endpoints:

### Core
| Route | Methods | Purpose |
|---|---|---|
| `/api` | GET | API root |
| `/api/health` | GET | Health check |
| `/api/health/metrics` | GET | System metrics (CPU, memory, disk) |
| `/api/health/alerts` | GET/POST | Health alerts |
| `/api/seed` | POST | Seed database with demo data |
| `/api/auth` | GET/POST | Authentication |
| `/api/search` | GET | Global search |
| `/api/dashboard` | GET | Dashboard data |
| `/api/dashboard-preferences` | GET/POST | Dashboard customization |
| `/api/dashboard-widgets` | GET/POST | Widget CRUD |
| `/api/dashboard-widgets/[id]` | GET/PUT/DELETE | Single widget |
| `/api/analytics` | GET | Analytics data |
| `/api/system-resources` | GET | System resource data |
| `/api/activity` | GET | Activity events |

### Agents
| Route | Methods | Purpose |
|---|---|---|
| `/api/agents` | GET/POST | Agent CRUD |
| `/api/agents/[id]` | GET/PUT/DELETE | Single agent |
| `/api/agents/[id]/tasks` | GET/POST | Agent tasks |
| `/api/agent-messages` | GET/POST | Agent messages |
| `/api/agent-messages/[id]` | PUT/DELETE | Single message |
| `/api/agent-versions` | GET/POST | Agent versions |
| `/api/agent-versions/[id]` | GET/PUT/DELETE | Single version |
| `/api/agent-versions/[id]/restore` | POST | Restore version |
| `/api/agent-versions/compare` | GET | Compare versions |

### Memory & Knowledge
| Route | Methods | Purpose |
|---|---|---|
| `/api/memory` | GET/POST | Memory entries |
| `/api/memory/[id]` | GET/PUT/DELETE | Single memory |
| `/api/knowledge` | GET/POST | Knowledge bases |
| `/api/knowledge/[id]` | GET/PUT/DELETE | Single knowledge base |
| `/api/knowledge/[id]/documents` | GET/POST | Documents in a base |
| `/api/knowledge/[id]/search` | POST | RAG search |
| `/api/knowledge-graph` | GET | Knowledge graph data |

### Brain & Models
| Route | Methods | Purpose |
|---|---|---|
| `/api/models` | GET/POST | Model configs |
| `/api/models/[id]` | GET/PUT/DELETE | Single model |
| `/api/routing-rules` | GET/POST | Routing rules |
| `/api/chat` | POST | Chat completions |

### Workflows & Scheduling
| Route | Methods | Purpose |
|---|---|---|
| `/api/workflows` | GET/POST | Workflow CRUD |
| `/api/workflows/[id]` | GET/PUT/DELETE | Single workflow |
| `/api/scheduled-tasks` | GET/POST | Scheduled tasks |
| `/api/scheduled-tasks/[id]` | GET/PUT/DELETE | Single task |

### Teams & Swarm
| Route | Methods | Purpose |
|---|---|---|
| `/api/teams` | GET/POST | Team CRUD |
| `/api/teams/[id]` | GET/PUT/DELETE | Single team |
| `/api/teams/[id]/members` | GET/POST | Team members |
| `/api/teams/[id]/channels` | GET/POST | Team channels |
| `/api/swarm` | GET/POST | Swarm CRUD |
| `/api/swarm/[id]` | GET/PUT/DELETE | Single swarm |
| `/api/swarm/[id]/members` | GET/POST | Swarm members |
| `/api/swarm/[id]/tasks` | GET/POST | Swarm tasks |

### MCP
| Route | Methods | Purpose |
|---|---|---|
| `/api/mcp/servers` | GET/POST | MCP servers |
| `/api/mcp/servers/[id]` | GET/PUT/DELETE | Single server |
| `/api/mcp/discover` | POST | Discover MCP tools |
| `/api/mcp/tools` | GET | MCP tools list |
| `/api/mcp/resources` | GET | MCP resources |
| `/api/mcp/prompts` | GET | MCP prompts |
| `/api/mcp/execute` | POST | Execute MCP tool |
| `/api/mcp/executions` | GET | Execution history |
| `/api/mcp/pipelines` | GET/POST | MCP pipelines |
| `/api/mcp/pipelines/[id]` | GET/PUT/DELETE | Single pipeline |

### Cost Tracking
| Route | Methods | Purpose |
|---|---|---|
| `/api/costs` | GET/POST | Cost entries |
| `/api/costs/budgets` | GET/POST | Budget alerts |
| `/api/costs/budgets/[id]` | GET/PUT/DELETE | Single budget |

### Guardrails & Safety
| Route | Methods | Purpose |
|---|---|---|
| `/api/guardrails` | GET/POST | Guardrails |
| `/api/guardrails/[id]` | GET/PUT/DELETE | Single guardrail |
| `/api/guardrails/violations` | GET | Violations list |
| `/api/guardrails/violations/[id]` | PUT | Resolve violation |
| `/api/content-policies` | GET/POST | Content policies |
| `/api/content-policies/[id]` | GET/PUT/DELETE | Single policy |

### Human-in-the-Loop
| Route | Methods | Purpose |
|---|---|---|
| `/api/approvals` | GET/POST | Approval requests |
| `/api/approvals/[id]` | GET/PUT | Single approval |
| `/api/review-gates` | GET/POST | Review gates |
| `/api/review-gates/[id]` | GET/PUT/DELETE | Single gate |
| `/api/escalation-policies` | GET/POST | Escalation policies |
| `/api/escalation-policies/[id]` | GET/PUT/DELETE | Single policy |

### Security
| Route | Methods | Purpose |
|---|---|---|
| `/api/security/keys` | GET/POST | API keys (encrypted) |
| `/api/security/keys/[id]` | GET/PUT/DELETE | Single key |
| `/api/security/rules` | GET/POST | Access rules |
| `/api/security/rules/[id]` | GET/PUT/DELETE | Single rule |
| `/api/audit-log` | GET | Audit log entries |

### Users & RBAC
| Route | Methods | Purpose |
|---|---|---|
| `/api/users` | GET/POST | User management |
| `/api/users/[id]` | GET/PUT/DELETE | Single user |
| `/api/roles` | GET/POST | Role management |
| `/api/roles/[id]` | GET/PUT/DELETE | Single role |
| `/api/notifications` | GET | Notifications |
| `/api/notifications/[id]` | PUT | Update notification |
| `/api/notifications/mark-all-read` | POST | Mark all read |
| `/api/channels` | GET/POST | Notification channels |
| `/api/channels/[id]` | GET/PUT/DELETE | Single channel |

### Observability
| Route | Methods | Purpose |
|---|---|---|
| `/api/traces` | GET/POST | Traces |
| `/api/traces/[id]` | GET | Single trace |
| `/api/traces/[id]/spans` | GET | Trace spans |
| `/api/service-graph` | GET | Service graph |

### Automation
| Route | Methods | Purpose |
|---|---|---|
| `/api/automation-rules` | GET/POST | Automation rules |
| `/api/automation-rules/[id]` | GET/PUT/DELETE | Single rule |
| `/api/automation-rules/[id]/toggle` | POST | Toggle rule active |
| `/api/automation-rules/[id]/execute` | POST | Execute rule |
| `/api/automation-executions` | GET | Execution history |

### Event Bus
| Route | Methods | Purpose |
|---|---|---|
| `/api/event-bus/topics` | GET/POST | Event topics |
| `/api/event-bus/topics/[id]` | GET/PUT/DELETE | Single topic |
| `/api/event-bus/subscriptions` | GET/POST | Subscriptions |
| `/api/event-bus/subscriptions/[id]` | GET/PUT/DELETE | Single subscription |
| `/api/event-bus/events` | GET/POST | Events |
| `/api/event-bus/deliveries` | GET | Event deliveries |

### Evaluation & Benchmarking
| Route | Methods | Purpose |
|---|---|---|
| `/api/evals` | GET/POST | Eval suites |
| `/api/evals/[id]` | GET/PUT/DELETE | Single suite |
| `/api/evals/[id]/cases` | GET/POST | Eval cases |
| `/api/evals/[id]/run` | POST | Run eval suite |
| `/api/evals/runs` | GET | Eval run history |
| `/api/benchmarks` | GET/POST | Benchmark suites |
| `/api/benchmarks/[id]` | GET/PUT/DELETE | Single benchmark |
| `/api/benchmarks/[id]/run` | POST | Run benchmark |
| `/api/benchmarks/runs` | GET | Benchmark run history |

### Chains, Delegation & Consensus
| Route | Methods | Purpose |
|---|---|---|
| `/api/chains` | GET/POST | Agent chains |
| `/api/chains/[id]` | GET/PUT/DELETE | Single chain |
| `/api/chains/[id]/run` | POST | Run chain |
| `/api/chains/[id]/runs` | GET | Chain run history |
| `/api/delegations` | GET/POST | Delegations |
| `/api/delegations/[id]` | GET/PUT/DELETE | Single delegation |
| `/api/delegations/[id]/history` | GET | Delegation history |
| `/api/consensus` | GET/POST | Consensus rounds |
| `/api/consensus/[id]` | GET | Single round |
| `/api/consensus/[id]/vote` | POST | Cast vote |
| `/api/consensus/[id]/result` | GET | Get result |

### Infrastructure
| Route | Methods | Purpose |
|---|---|---|
| `/api/docker/containers` | GET/POST | Docker containers |
| `/api/docker/containers/[id]` | GET/PUT/DELETE | Single container |
| `/api/docker/images` | GET | Docker images |
| `/api/docker/networks` | GET | Docker networks |
| `/api/docker/volumes` | GET | Docker volumes |
| `/api/terminal/sessions` | GET/POST | Terminal sessions |
| `/api/terminal/sessions/[id]` | GET/PUT/DELETE | Single session |
| `/api/terminal/commands` | GET/POST | Terminal commands |
| `/api/network/firewall` | GET/POST | Firewall rules |
| `/api/network/connections` | GET | Network connections |
| `/api/network/dns` | GET | DNS resolution |
| `/api/network/stats` | GET | Network statistics |

### Data Management
| Route | Methods | Purpose |
|---|---|---|
| `/api/outputs` | GET/POST | Agent outputs |
| `/api/outputs/[id]` | GET/PUT/DELETE | Single output |
| `/api/files` | GET/POST | File entries |
| `/api/files/[id]` | GET/PUT/DELETE | Single file |
| `/api/backups` | GET/POST | Backups |
| `/api/backups/[id]` | GET/DELETE | Single backup |
| `/api/backups/[id]/restore` | POST | Restore backup |
| `/api/export` | GET | Export data |
| `/api/workspaces` | GET/POST | Workspaces |
| `/api/goals` | GET/POST | Goals |
| `/api/goals/[id]` | GET/PUT/DELETE | Single goal |

### Configuration
| Route | Methods | Purpose |
|---|---|---|
| `/api/templates` | GET/POST | Templates |
| `/api/templates/[id]` | GET/PUT/DELETE | Single template |
| `/api/plugins` | GET/POST | Plugins |
| `/api/plugins/[id]` | GET/PUT/DELETE | Single plugin |
| `/api/skills` | GET/POST | Agent skills |
| `/api/skills/[id]` | GET/PUT/DELETE | Single skill |
| `/api/prompts` | GET/POST | Prompt templates |
| `/api/prompts/[id]` | GET/PUT/DELETE | Single prompt |
| `/api/commands` | GET/POST | Command logs |
| `/api/webhooks` | GET/POST | Webhooks |
| `/api/webhooks/[id]` | GET/PUT/DELETE | Single webhook |
| `/api/webhooks/[id]/events` | GET | Webhook events |
| `/api/feature-flags` | GET/POST | Feature flags |
| `/api/feature-flags/[id]` | GET/PUT/DELETE | Single flag |
| `/api/feature-flags/[id]/toggle` | POST | Toggle flag |
| `/api/env-vars` | GET/POST | Environment variables |
| `/api/env-vars/[id]` | GET/PUT/DELETE | Single env var |
| `/api/env-profiles` | GET/POST | Environment profiles |
| `/api/env-profiles/[id]` | GET/PUT/DELETE | Single profile |
| `/api/env-profiles/[id]/activate` | POST | Activate profile |
| `/api/quotas` | GET/POST | Resource quotas |
| `/api/quotas/[id]` | GET/PUT/DELETE | Single quota |
| `/api/quotas/[id]/reset` | POST | Reset quota |
| `/api/quotas/[id]/usage` | GET | Quota usage |
| `/api/quotas/alerts` | GET | Quota alerts |
| `/api/incidents` | GET/POST | Incidents |
| `/api/incidents/[id]` | GET/PUT/DELETE | Single incident |
| `/api/incidents/[id]/timeline` | GET | Incident timeline |
| `/api/incidents/[id]/actions` | GET/POST | Incident actions |
| `/api/post-mortems` | GET/POST | Post-mortems |
| `/api/post-mortems/[id]` | GET/PUT/DELETE | Single post-mortem |
| `/api/marketplace` | GET | Marketplace agents |
| `/api/marketplace/[id]` | GET | Single marketplace agent |
| `/api/marketplace/[id]/reviews` | GET/POST | Marketplace reviews |
| `/api/marketplace/[id]/install` | POST | Install marketplace agent |
| `/api/marketplace/installed` | GET | Installed marketplace agents |
| `/api/onboarding` | GET | Onboarding state |
| `/api/onboarding/complete` | POST | Complete onboarding |
| `/api/playground` | GET/POST | Playground sessions |
| `/api/playground/[id]` | GET/PUT/DELETE | Single session |
| `/api/playground/[id]/run` | POST | Run playground test |

---

## Quick Reference: Full Deployment Command Sequence

### PM2 + Caddy (Bare Metal) — Copy & Paste

```bash
# === SERVER SETUP ===
apt update && apt upgrade -y
apt install -y curl git unzip wget htop ufw fail2ban

# === NODE.JS ===
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2 prisma

# === FIREWALL ===
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# === CLONE PROJECT ===
cd /home/agentos
git clone git@github.com:RJMLABS/agentos.git
cd agentos
npm install

# === ENVIRONMENT ===
cp .env.example .env
# Edit .env with production values:
nano .env

# === DATABASE ===
npx prisma generate
npx prisma db push

# === BUILD ===
npm run build

# === START WITH PM2 ===
pm2 start .next/standalone/server.js --name agentos --node-args="--env-file=.env"
pm2 save
pm2 startup

# === SEED ===
curl -X POST http://localhost:3000/api/seed

# === CADDY ===
apt install -y caddy
# Edit /etc/caddy/Caddyfile with your domain
nano /etc/caddy/Caddyfile
systemctl enable caddy
systemctl start caddy

# === DONE ===
echo "AgentOS is live at https://agentos.rjmlabs.co.uk"
```

### Docker Compose — Copy & Paste

```bash
# === SERVER SETUP ===
apt update && apt upgrade -y
apt install -y curl git ufw

# === DOCKER ===
curl -fsSL https://get.docker.com | sh

# === FIREWALL ===
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# === CLONE PROJECT ===
cd /home/agentos
git clone git@github.com:RJMLABS/agentos.git
cd agentos

# === ENVIRONMENT ===
cp .env.example .env
# Edit .env with production values:
nano .env
# IMPORTANT: Set DATABASE_URL=file:./data/agentos.db (container path)

# === DEPLOY ===
docker compose up -d --build

# === SEED ===
sleep 30  # Wait for AgentOS to be healthy
curl -X POST http://localhost:3000/api/seed

# === DONE ===
echo "AgentOS is live at https://agentos.rjmlabs.co.uk"
```

---

## Notes for Claude (or any AI assistant)

When asked to deploy or manage this AgentOS instance on the VPS, refer to this document for:

1. **Project structure**: Next.js 16 App Router with 102 Prisma models, 71 UI components, 160+ API routes
2. **Database**: SQLite — no external database server needed, just `prisma db push`
3. **Currency**: All displays use £/GBP — `PoundSterling` icon, not `DollarSign`
4. **Branding**: RJMLABS.CO.UK with "RJM" logo
5. **Encryption**: AES-256-CBC for API key storage, key set via `ENCRYPTION_KEY` env var
6. **Deployment**: Standalone output — run `.next/standalone/server.js` directly (no `next start`)
7. **Reverse proxy**: Caddy handles HTTPS auto-provisioning via Let's Encrypt
8. **Health check**: `/api/health` endpoint for monitoring
9. **Seeding**: POST to `/api/seed` creates comprehensive demo data
10. **Backups**: Built-in API at `/api/backups` plus file-level SQLite backup

### Common Tasks

| Task | Command |
|---|---|
| Restart AgentOS | `pm2 restart agentos` |
| View logs | `pm2 logs agentos` |
| Rebuild after update | `git pull && npm install && npx prisma generate && npm run build && pm2 restart agentos` |
| Re-seed database | `curl -X POST http://localhost:3000/api/seed` |
| Database backup | `cp data/agentos.db backups/agentos_$(date +%Y%m%d).db` |
| Check health | `curl http://localhost:3000/api/health` |
| Renew SSL | Caddy auto-renews; force reload: `systemctl reload caddy` |

---

*Document generated for RJMLABS.CO.UK AgentOS deployment*
*Last updated: 2026-06-01*
