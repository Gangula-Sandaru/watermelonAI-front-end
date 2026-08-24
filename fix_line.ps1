$path = 'D:\MyProjects\React\watermelonApp\src\app\components\SatelliteInsightsPanel.tsx'
$lines = Get-Content $path
$lines[488] = '          <Card className="md:col-span-2 p-6 flex flex-col">'
$lines | Set-Content $path
Write-Host "Line 489: $($lines[488])"
