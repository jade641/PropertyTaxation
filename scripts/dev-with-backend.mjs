import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const frontendRoot = process.cwd()
const workspaceRoot = resolve(frontendRoot, '..')
const backendScriptPath = resolve(workspaceRoot, 'backend', 'run-dev.ps1')
const viteCliPath = resolve(
  frontendRoot,
  'node_modules',
  'vite',
  'bin',
  'vite.js',
)
const frontendHost = process.env.VITE_DEV_HOST ?? '127.0.0.1'
const frontendPort = Number.parseInt(process.env.VITE_DEV_PORT ?? '5173', 10)
const frontendUrl = `http://${frontendHost}:${frontendPort}`
const backendHealthUrl = process.env.TAXSYNC_BACKEND_HEALTH_URL ?? 'http://localhost:5000/api/health'
const healthTimeoutMs = Number.parseInt(process.env.TAXSYNC_BACKEND_HEALTH_TIMEOUT_MS ?? '3000', 10)
const healthRetries = Number.parseInt(process.env.TAXSYNC_BACKEND_HEALTH_RETRIES ?? '90', 10)
const healthRetryDelayMs = Number.parseInt(process.env.TAXSYNC_BACKEND_HEALTH_DELAY_MS ?? '1000', 10)
const powershellCommand = process.platform === 'win32' ? 'powershell.exe' : 'pwsh'

let backendProcess = null
let viteProcess = null
let backendStartedByLauncher = false
let shuttingDown = false

const waitForExit = (childProcess) =>
  new Promise((resolvePromise, rejectPromise) => {
    childProcess.once('error', rejectPromise)
    childProcess.once('exit', (code, signal) => {
      resolvePromise({ code, signal })
    })
  })

const killProcessTree = async (childProcess) => {
  if (!childProcess?.pid) return

  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(childProcess.pid), '/t', '/f'], {
      stdio: 'ignore',
    })

    await new Promise((resolvePromise) => {
      killer.once('error', () => resolvePromise())
      killer.once('exit', () => resolvePromise())
    })

    return
  }

  try {
    process.kill(-childProcess.pid, 'SIGTERM')
  } catch {
    try {
      childProcess.kill('SIGTERM')
    } catch {
      // ignore cleanup failures
    }
  }
}

const withTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    dispose: () => clearTimeout(timeout),
  }
}

const isBackendHealthy = async () => {
  const { signal, dispose } = withTimeoutSignal(healthTimeoutMs)

  try {
    const response = await fetch(backendHealthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })

    return response.ok
  } catch {
    return false
  } finally {
    dispose()
  }
}

const getWindowsPortOwner = (port) => {
  if (process.platform !== 'win32') return null

  const inspectResult = spawnSync(
    powershellCommand,
    [
      '-NoProfile',
      '-Command',
      `$connection = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -eq ${port} | Select-Object -First 1; if (-not $connection) { exit 0 }; $process = Get-CimInstance Win32_Process -Filter \"ProcessId = $($connection.OwningProcess)\" -ErrorAction SilentlyContinue; [PSCustomObject]@{ processId = [int]$connection.OwningProcess; name = if ($process) { $process.Name } else { $null }; commandLine = if ($process) { $process.CommandLine } else { $null } } | ConvertTo-Json -Compress`,
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
    },
  )

  if (inspectResult.error) {
    throw inspectResult.error
  }

  if ((inspectResult.status ?? 0) !== 0) {
    throw new Error(inspectResult.stderr?.trim() || `Unable to inspect port ${port}.`)
  }

  const output = inspectResult.stdout.trim()
  if (!output) return null

  return JSON.parse(output)
}

const isExistingTaxSyncFrontend = (portOwner) => {
  const commandLine = (portOwner?.commandLine ?? '').toLowerCase()
  return commandLine.includes(viteCliPath.toLowerCase()) && commandLine.includes(frontendRoot.toLowerCase())
}

const reuseExistingFrontendIfRunning = async () => {
  const portOwner = getWindowsPortOwner(frontendPort)
  if (!portOwner) return false

  if (!isExistingTaxSyncFrontend(portOwner)) {
    const processName = portOwner.name ?? 'unknown'
    throw new Error(`Port ${frontendPort} is already in use by process ${portOwner.processId} (${processName}). Stop it before starting TaxSync frontend.`)
  }

  if (await isBackendHealthy()) {
    console.log(`[TaxSync] Reusing healthy backend at ${backendHealthUrl}.`)
  } else {
    console.warn(`[TaxSync] Frontend is already running at ${frontendUrl}, but backend is not healthy at ${backendHealthUrl}.`)
  }

  console.log(`[TaxSync] Reusing running frontend at ${frontendUrl} (PID ${portOwner.processId}).`)
  return true
}

const startBackend = () => {
  if (!existsSync(backendScriptPath)) {
    throw new Error(`Backend startup script not found at ${backendScriptPath}.`)
  }

  console.log(`[TaxSync] Backend is offline. Starting ${backendScriptPath}...`)
  backendProcess = spawn(
    powershellCommand,
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', backendScriptPath],
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
    },
  )
  backendStartedByLauncher = true
}

const ensureViteExecutable = () => {
  if (!existsSync(viteCliPath)) {
    throw new Error(`Vite CLI not found at ${viteCliPath}. Run npm install in the frontend first.`)
  }
}

const waitForBackendHealth = async () => {
  for (let attempt = 1; attempt <= healthRetries; attempt += 1) {
    if (await isBackendHealthy()) {
      console.log(`[TaxSync] Backend is healthy at ${backendHealthUrl}.`)
      return
    }

    if (backendProcess && backendProcess.exitCode !== null) {
      throw new Error('Backend exited before /api/health returned healthy.')
    }

    if (attempt < healthRetries) {
      console.log(`[TaxSync] Waiting for backend health (${attempt}/${healthRetries})...`)
      await delay(healthRetryDelayMs)
    }
  }

  throw new Error(`Backend did not become healthy at ${backendHealthUrl}.`)
}

const cleanup = async (exitCode = 0) => {
  if (shuttingDown) return
  shuttingDown = true

  if (viteProcess && viteProcess.exitCode === null) {
    await killProcessTree(viteProcess)
  }

  if (backendStartedByLauncher && backendProcess && backendProcess.exitCode === null) {
    await killProcessTree(backendProcess)
  }

  process.exit(exitCode)
}

process.once('SIGINT', () => {
  void cleanup(0)
})

process.once('SIGTERM', () => {
  void cleanup(0)
})

process.once('uncaughtException', (error) => {
  console.error('[TaxSync] Dev launcher crashed.', error)
  void cleanup(1)
})

process.once('unhandledRejection', (error) => {
  console.error('[TaxSync] Dev launcher rejected.', error)
  void cleanup(1)
})

const main = async () => {
  if (await reuseExistingFrontendIfRunning()) {
    return
  }

  if (await isBackendHealthy()) {
    console.log(`[TaxSync] Reusing healthy backend at ${backendHealthUrl}.`)
  } else {
    startBackend()
    await waitForBackendHealth()
  }

  console.log('[TaxSync] Starting Vite dev server...')
  ensureViteExecutable()
  viteProcess = spawn(process.execPath, [viteCliPath, '--mode', 'development', '--host', frontendHost, '--port', String(frontendPort), '--strictPort'], {
    cwd: frontendRoot,
    env: process.env,
    stdio: 'inherit',
  })

  const { code, signal } = await waitForExit(viteProcess)

  if (signal && !shuttingDown) {
    console.log(`[TaxSync] Frontend process ended with signal ${signal}.`)
  }

  await cleanup(code ?? 0)
}

void main().catch(async (error) => {
  console.error('[TaxSync] Unable to start local development mode.', error)
  await cleanup(1)
})