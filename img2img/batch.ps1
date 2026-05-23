$comfyUrl = 'http://127.0.0.1:8188/system_stats'

function Test-ComfyUI {
    try {
        Invoke-WebRequest -Uri $comfyUrl -TimeoutSec 3 -UseBasicParsing | Out-Null
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-ComfyUI)) {
    Write-Host 'ComfyUI not running, searching...' -ForegroundColor Yellow

    $searchRoots = @('C:\', 'D:\', 'E:\', "$env:USERPROFILE")
    $bat = $null
    foreach ($root in $searchRoots) {
        $found = Get-ChildItem -Path $root -Filter 'run_nvidia_gpu.bat' -Recurse -ErrorAction SilentlyContinue -Depth 4 | Select-Object -First 1
        if ($found) { $bat = $found.FullName; break }
    }

    if (-not $bat) {
        Write-Host 'ERROR: ComfyUI not found.' -ForegroundColor Red
        Write-Host 'Searched: C:\, D:\, E:\, and your user folder (depth 4).' -ForegroundColor Yellow
        Write-Host 'Find run_nvidia_gpu.bat on your machine and run it manually, then retry.' -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Found ComfyUI at: $bat" -ForegroundColor Cyan
    Write-Host 'Starting ComfyUI...' -ForegroundColor Yellow
    Start-Process -FilePath 'cmd.exe' -ArgumentList "/c `"$bat`"" -WorkingDirectory (Split-Path $bat)

    Write-Host 'Waiting for ComfyUI to be ready' -NoNewline
    $timeout = 120
    $elapsed = 0
    while (-not (Test-ComfyUI)) {
        if ($elapsed -ge $timeout) {
            Write-Host ''
            Write-Host "ERROR: ComfyUI did not start within ${timeout}s." -ForegroundColor Red
            exit 1
        }
        Write-Host '.' -NoNewline
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    Write-Host ''
    Write-Host 'ComfyUI ready.' -ForegroundColor Green
}

Set-Location $PSScriptRoot
& .\.venv\Scripts\python.exe batch.py
