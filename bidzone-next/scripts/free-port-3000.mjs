// Ensures port 3000 is free before the dev server starts, so Next.js never
// silently falls back to 3001+ (which breaks Google OAuth's fixed origin).
import { execSync } from 'node:child_process'

const PORT = 3000

function findPids() {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano -p tcp | findstr :${PORT}`, { encoding: 'utf8' })
      const pids = new Set()
      for (const line of out.split('\n')) {
        const m = line.trim().match(/LISTENING\s+(\d+)/)
        if (m) pids.add(m[1])
      }
      return [...pids]
    }
    const out = execSync(`lsof -ti tcp:${PORT}`, { encoding: 'utf8' })
    return out.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return [] // no process found on the port — nothing to clean up
  }
}

const pids = findPids().filter((pid) => pid !== String(process.pid))

for (const pid of pids) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
    }
    console.log(`[free-port] Freed port ${PORT} (stopped stale process ${pid})`)
  } catch {
    // process may have exited between detection and kill — safe to ignore
  }
}
