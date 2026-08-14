<#
  Exits 1 when the built export is missing or older than the sources,
  0 when it is up to date.

  Called by RenovApp.bat: without this, editing the code left the desktop
  shortcut serving a stale build, because the launcher only rebuilt when
  out/ was missing entirely.
#>

$ErrorActionPreference = 'SilentlyContinue'

$build = Get-Item 'out\index.html'
if (-not $build) { exit 1 }

$sources = @()
$sources += Get-ChildItem -Recurse -File -Path 'src', 'public'
$sources += Get-Item -Path 'tailwind.config.ts', 'package.json', 'next.config.js', 'postcss.config.js'

$newest = $sources | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $newest) { exit 0 }

if ($newest.LastWriteTime -gt $build.LastWriteTime) { exit 1 }
exit 0
