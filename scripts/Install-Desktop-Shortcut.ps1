<#
  Creates a "RenovApp" shortcut on the Desktop pointing at RenovApp.bat,
  with the generated icon and the project folder as working directory.

  Run once, from the project folder:
      powershell -ExecutionPolicy Bypass -File scripts\Install-Desktop-Shortcut.ps1
#>

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$launcher    = Join-Path $projectRoot 'RenovApp.bat'
$iconPath    = Join-Path $projectRoot 'public\favicon.ico'

if (-not (Test-Path $launcher)) {
    throw "RenovApp.bat est introuvable dans $projectRoot"
}

$desktop      = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'RenovApp.lnk'

$shell    = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath       = $launcher
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description      = 'Pilotage du projet de dortoir - plans, depenses et rentabilite'
$shortcut.WindowStyle      = 7   # start minimised; the browser window is the UI

if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}

$shortcut.Save()

Write-Host ''
Write-Host "  Raccourci cree : $shortcutPath" -ForegroundColor Green
Write-Host '  Double-cliquez sur RenovApp depuis le Bureau pour lancer l''application.'
Write-Host ''
