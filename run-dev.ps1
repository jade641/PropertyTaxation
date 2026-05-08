$ErrorActionPreference = "Stop"

$frontendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPort = 5173
$backendHealthUrl = "http://localhost:5000/api/health"
$taxSyncContainers = @("taxsync-backend", "taxsync-frontend", "taxsync-mysql")

function Get-RunningTaxSyncContainers {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return @()
    }

    try {
        return @(& docker ps --format "{{.Names}}" | Where-Object { $taxSyncContainers -contains $_ })
    }
    catch {
        return @()
    }
}

function Get-ProcessCommandLine([int]$processId) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    return $processInfo.CommandLine
}

$runningContainers = @(Get-RunningTaxSyncContainers)
if ($runningContainers.Count -gt 0) {
    throw "TaxSync Docker containers are running ($($runningContainers -join ', ')). Run scripts\stop-docker.ps1 before starting local frontend mode."
}

$listeners = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
    $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    $commandLine = Get-ProcessCommandLine $listener.OwningProcess
    $isTaxSyncFrontend = $commandLine -like "*vite*" -and $commandLine -like "*frontend*"

    if ($isTaxSyncFrontend) {
        Write-Host "Stopping existing TaxSync frontend process $($listener.OwningProcess)..."
        Stop-Process -Id $listener.OwningProcess -Force
        continue
    }

    $processName = if ($process) { $process.ProcessName } else { "unknown" }
    throw "Port $frontendPort is already in use by process $($listener.OwningProcess) ($processName). Stop it before starting TaxSync frontend."
}

try {
    Invoke-WebRequest -Uri $backendHealthUrl -UseBasicParsing -TimeoutSec 3 | Out-Null
    Write-Host "Backend health check passed at $backendHealthUrl"
}
catch {
    Write-Warning "Backend is not healthy yet at $backendHealthUrl. The frontend dev launcher will start it before Vite comes up."
}

$env:VITE_RUNTIME_MODE = "local"

Write-Host "Starting TaxSync frontend on http://127.0.0.1:$frontendPort"
Push-Location $frontendRoot
try {
    if (-not (Test-Path (Join-Path $frontendRoot "node_modules"))) {
        npm install
    }

    npm run dev
}
finally {
    Pop-Location
}