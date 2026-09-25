$port = 8080
while($true) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        break
    } catch {
        $port++
    }
}

Write-Host "Server berjalan di http://localhost:$port/"
Start-Process "http://localhost:$port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    
    $path = $req.Url.LocalPath.TrimStart('/')
    if ($path -eq "") { $path = "index.html" }
    
    $filePath = Join-Path $PWD $path
    
    if (Test-Path $filePath -PathType Leaf) {
        try {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentLength64 = $bytes.Length
            
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $type = "application/octet-stream"
            
            if ($ext -eq ".html") { $type = "text/html" }
            elseif ($ext -eq ".css") { $type = "text/css" }
            elseif ($ext -eq ".js") { $type = "application/javascript" }
            elseif ($ext -eq ".json") { $type = "application/json" }
            elseif ($ext -eq ".png") { $type = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $type = "image/jpeg" }
            elseif ($ext -eq ".svg") { $type = "image/svg+xml" }
            
            $res.ContentType = $type
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $res.StatusCode = 500
        }
    } else {
        $res.StatusCode = 404
    }
    $res.Close()
}
