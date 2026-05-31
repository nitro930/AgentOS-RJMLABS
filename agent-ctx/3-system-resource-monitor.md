# Task 3 - System Resource Monitor

## Work Completed

- Created `/api/system-resources` API route with mock but realistic VPS system data
  - Returns CPU, Memory, Disk, Network metrics with small random variance (±5%) on each request
  - Returns top 5 processes sorted by CPU with status badges
  - Includes uptime and load average data
- Created SystemResourceMonitor component with:
  - 4 metric cards in responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
  - CPU card: percentage gauge with color coding (green <50%, amber <80%, red ≥80%)
  - Memory card: used/total with progress bar, swap info
  - Disk card: used/total with progress bar, filesystem info
  - Network card: bytes in/out with trend indicators
  - Process list table: top 5 processes by CPU with PID, Name, CPU%, Memory%, Status badges
  - Auto-refresh every 10 seconds
  - Manual refresh button
  - Loading skeletons
  - System info bar (uptime, load average, CPU model)
- Updated store.ts: Added 'system-resources' to SectionId, systemResourcesTab state
- Updated page.tsx: Imported and registered SystemResourceMonitor
- Updated sidebar.tsx: Added Resources nav item with Gauge icon, L0 layer, tools group
- Lint: No errors in any new/modified files
