<#
.SYNOPSIS
Capture an Android emulator screenshot as a binary-safe PNG.

.DESCRIPTION
Runs screencap on the device and pulls the file with adb, then verifies the
PNG signature. Never use `adb exec-out screencap -p > file.png` in Windows
PowerShell: it decodes the binary stream as text and writes UTF-16, producing
a corrupt "PNG" that the Claude API rejects as an unsupported image.

.EXAMPLE
./scripts/emulator-screenshot.ps1 -OutFile "$env:TEMP\emu.png"
#>
param(
  [Parameter(Mandatory = $true)][string]$OutFile,
  [string]$Serial = ""
)

$ErrorActionPreference = "Stop"
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { throw "adb not found at $adb" }

$remote = "/sdcard/emulator-screenshot.png"
$adbArgs = @()
if ($Serial) { $adbArgs += @("-s", $Serial) }

& $adb @adbArgs shell screencap -p $remote | Out-Null
if ($LASTEXITCODE -ne 0) { throw "adb shell screencap failed (exit $LASTEXITCODE)" }

& $adb @adbArgs pull $remote $OutFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw "adb pull failed (exit $LASTEXITCODE)" }

$bytes = [System.IO.File]::ReadAllBytes($OutFile)
$magic = ($bytes[0..7] | ForEach-Object { $_.ToString("X2") }) -join " "
if ($magic -ne "89 50 4E 47 0D 0A 1A 0A") {
  Move-Item -LiteralPath $OutFile -Destination "$OutFile.invalid" -Force
  throw "Captured file is not a valid PNG (magic: $magic); moved to $OutFile.invalid"
}

Write-Output $OutFile
