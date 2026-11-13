param([string]$Distribution = 'Ubuntu-24.04')

$ErrorActionPreference = 'Stop'
$distributions = @(wsl.exe --list --quiet | ForEach-Object { $_.Trim([char]0).Trim() })
if ($LASTEXITCODE -ne 0 -or $distributions -notcontains $Distribution) {
    throw "WSL distribution '$Distribution' is unavailable."
}

# The Linux script checks health first and starts only missing panel dependencies.
& wsl.exe -d $Distribution -- bash -lc 'cd /home/omenh/ibispanel-dev/panel && ./scripts/dev-up.sh'
if ($LASTEXITCODE -ne 0) { throw 'IbisPanel development startup failed.' }
