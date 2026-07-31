# start-site.ps1
# Starts a simple static server that serves this repo and opens index.html in the default browser.
# Usage: run from project root in PowerShell: .\start-site.ps1

$port = 5500
$root = Get-Location
$indexUrl = "http://localhost:$port/index.html"

function Start-PythonServer {
    Write-Host "Starting Python http.server on port $port..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; python -m http.server $port" -WindowStyle Hidden
}

function Start-NpxServer {
    Write-Host "Starting npx http-server on port $port..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npx http-server -p $port" -WindowStyle Hidden
}

# Try python, then npx
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Start-PythonServer
}
else {
    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if ($npx) {
        Start-NpxServer
    }
    else {
        Write-Host "Neither 'python' nor 'npx' found. Install Python 3 or Node.js + http-server (npm i -g http-server), then re-run this script." -ForegroundColor Yellow
        exit 1
    }
}

Start-Sleep -Seconds 1
Write-Host "Opening $indexUrl in default browser..."
Start-Process $indexUrl

Write-Host "Server started (in a new PowerShell window). Press Ctrl+C in that window to stop it." -ForegroundColor Green
