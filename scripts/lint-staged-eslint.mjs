import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { setTimeout } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const cli = require.resolve('eslint_d/bin/eslint_d.js')
const env = {
  ...process.env,
  ESLINT_D_MISS: 'fail',
  ESLINT_D_IDLE: process.env.ESLINT_D_IDLE ?? '120',
}

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    env,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
}

const args = process.argv.slice(2)
let result = run(args)

// On slow filesystems the daemon can outlive eslint_d's two-second startup
// timeout. Wait for that same daemon rather than launching another or skipping
// lint. Ordinary lint failures are returned immediately.
if (
  result.status === 1 &&
  result.stderr.includes('Failed to start daemon') &&
  result.stderr.includes('Timed out waiting for config')
) {
  console.error('Waiting for ESLint to finish its first startup…')
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    await setTimeout(250)
    const status = run(['status'])
    if (
      status.status === 0 &&
      status.stdout.startsWith('eslint_d: Running (')
    ) {
      result = run(args)
      break
    }
  }
}

if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)
if (result.error) console.error(result.error.message)
process.exitCode = result.status ?? 1
