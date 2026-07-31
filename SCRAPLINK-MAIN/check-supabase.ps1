# check-supabase.ps1
# Simple PowerShell checks for Supabase reachability and REST access.
# Usage: Open PowerShell in this project folder and run:
#   .\check-supabase.ps1 -AnonKey "YOUR_ANON_KEY"
param(
  [Parameter(Mandatory=$false)]
  [string]$AnonKey
)

$Url = 'https://mjtvmzzlafbzzzmagzlp.supabase.co'
if (-not $AnonKey) {
  Write-Host "No anon key passed. Using SUPABASE_ANON_KEY env var if set..." -ForegroundColor Yellow
  $AnonKey = $env:SUPABASE_ANON_KEY
}

Write-Host "Checking project URL: $Url" -ForegroundColor Cyan
try {
  $h = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -ErrorAction Stop
  $h | Select-Object StatusCode, StatusDescription | Format-List
} catch {
  Write-Host "Failed to reach $Url: $_" -ForegroundColor Red
  exit 1
}

if ($AnonKey) {
  Write-Host "Calling REST endpoint /rest/v1/posts (requires table and RLS settings)…" -ForegroundColor Cyan
  try {
    $headers = @{ apikey = $AnonKey; Authorization = "Bearer $AnonKey" }
    $res = Invoke-RestMethod -Uri "$Url/rest/v1/posts?select=*" -Method Get -Headers $headers -ErrorAction Stop
    $json = $res | ConvertTo-Json -Depth 3
    Write-Host "REST /posts response (first 1000 chars):" -ForegroundColor Green
    Write-Host ($json.Substring(0, [math]::Min($json.Length, 1000)))
  } catch {
    Write-Host "REST call failed: $_" -ForegroundColor Yellow
  }
} else {
  Write-Host "Skipping REST test because no anon key provided." -ForegroundColor Yellow
}

Write-Host "Done." -ForegroundColor Green
