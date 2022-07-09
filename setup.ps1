# Download gechodriver.zip from https://github.com/mozilla/geckodriver/releases/download/v0.31.0/geckodriver-v0.31.0-win64.zip and unzip it, then add geckodriver.exe to PATH
function PathExists {
    param([string]$path)
    if (Test-Path $path) {
        return $true
    } else {
        return $false
    }
}

if (PathExists "geckodriver.exe") {
    Write-Output "geckodriver.exe already exists... Deleting it..."
    Remove-Item -Path "geckodriver.exe" -Force
}
if (PathExists "geckodriver.zip") {
    Write-Output "geckodriver.zip already exists... Deleting it..."
    Remove-Item -Path "geckodriver.zip" -Force
}

Write-Output "Downloading geckodriver.zip"
$WebClient = New-Object System.Net.WebClient
$WebClient.DownloadFile("https://github.com/mozilla/geckodriver/releases/download/v0.31.0/geckodriver-v0.31.0-win64.zip", "geckodriver.zip")
Write-Output "Unzipping geckodriver.zip"
Start-Sleep 1
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Unzip
{
    param([string]$zipfile, [string]$outpath)

    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipfile, $outpath)
}

Unzip -zipfile geckodriver.zip -outpath .
Start-Sleep 1
Write-Output "Adding geckodriver.exe to PATH"
Start-Sleep 1
$ActualPath = (Get-Item -Path ".").FullName
Write-Output "Actual path: $ActualPath"
$Env:Path += ";$ActualPath"

# move the geckodriver.exe to be executable in cmd
# $geckodriver = "geckodriver.exe"
# $geckodriverPath = "$ActualPath/$geckodriver"
# $geckodriverPath = $geckodriverPath.Replace("/", "\\")
# move-item -path $geckodriverPath -destination

# Write-Output "Deleting geckodriver.zip..."
# Start-Sleep 1
# Remove-Item -path geckodriver.zip -Force
Start-Sleep 1
Write-Output "Done"
for ($i = 3; $i -gt 0; $i--) {
    Write-Output "Exiting in $i seconds..."
    Start-Sleep -s 1
}

# Remove-Item -Path "geckodriver.zip" -Force
