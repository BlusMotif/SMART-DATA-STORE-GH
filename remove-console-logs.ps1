# Remove all console logging statements for production
$clientPath = "client\src"
$serverPath = "src\server"

Write-Host "Removing console statements from client..." -ForegroundColor Yellow
$clientFiles = Get-ChildItem -Path $clientPath -Recurse -Include *.tsx,*.ts,*.jsx,*.js

foreach ($file in $clientFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'console\.(log|warn|error|debug|info|trace)') {
        # Remove console statements
        $newContent = $content -replace 'console\.(log|warn|error|debug|info|trace)\([^\)]*(?:\)(?:[^\)]*\))*)*\);?', ''
        # Remove empty lines created by removal
        $newContent = $newContent -replace '(?m)^\s*$\r?\n', ''
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  Cleaned: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nRemoving console statements from server..." -ForegroundColor Yellow
$serverFiles = Get-ChildItem -Path $serverPath -Recurse -Include *.ts,*.js

foreach ($file in $serverFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'console\.(log|warn|error|debug|info|trace)') {
        # Remove console statements
        $newContent = $content -replace 'console\.(log|warn|error|debug|info|trace)\([^\)]*(?:\)(?:[^\)]*\))*)*\);?', ''
        # Remove empty lines created by removal
        $newContent = $newContent -replace '(?m)^\s*$\r?\n', ''
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  Cleaned: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nDone! All console statements removed." -ForegroundColor Cyan
