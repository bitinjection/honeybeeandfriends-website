<#
.SYNOPSIS
    Adds a new image to the gallery with automatic optimization.

.DESCRIPTION
    Complete pipeline for adding a new image to the gallery:
    1. Copies original to gallery-fullsize (backup)
    2. Creates optimized version in gallery
    3. Generates thumbnail in gallery/thumbnails
    4. Optionally outputs HTML snippet for index.html

.PARAMETER ImagePath
    Path to the source image file.

.PARAMETER Name
    Optional new name for the image (without extension). If not specified, uses original name.

.PARAMETER AltText
    Alt text for the image (for accessibility). Required for HTML snippet.

.PARAMETER GalleryWidth
    Max width for gallery display image. Default 1600.

.PARAMETER ThumbnailWidth
    Width for thumbnail. Default 300.

.PARAMETER Quality
    JPEG quality for optimization. Default 82.

.PARAMETER SkipFullsize
    Don't save to gallery-fullsize.

.PARAMETER ShowHtml
    Output HTML snippet for adding to index.html.

.EXAMPLE
    .\Add-GalleryImage.ps1 -ImagePath "C:\Photos\vacation.jpg" -AltText "Kids playing outside" -ShowHtml

.EXAMPLE
    .\Add-GalleryImage.ps1 -ImagePath ".\newphoto.png" -Name "playroom-activity" -AltText "Children in playroom"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$ImagePath,

    [string]$Name,

    [string]$AltText = "Gallery image",

    [int]$GalleryWidth = 1600,

    [int]$ThumbnailWidth = 300,

    [int]$Quality = 82,

    [switch]$SkipFullsize,

    [switch]$ShowHtml
)

# Verify ImageMagick
try {
    $null = & magick --version 2>&1
} catch {
    Write-Error "ImageMagick is not installed. Install via: winget install ImageMagick.ImageMagick"
    exit 1
}

# Resolve paths
$basePath = Split-Path -Parent $PSScriptRoot
$galleryPath = Join-Path $basePath "gallery"
$fullsizePath = Join-Path $basePath "gallery-fullsize"
$thumbnailPath = Join-Path $galleryPath "thumbnails"

# Validate source
if (-not (Test-Path $ImagePath)) {
    Write-Error "Source image not found: $ImagePath"
    exit 1
}

$sourceFile = Get-Item $ImagePath

# Determine output name
if ($Name) {
    $baseName = $Name
} else {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($sourceFile.Name)
}

# Clean the name (remove spaces, special chars)
$baseName = $baseName -replace '[^\w\-]', '-'

# Determine if we should convert to JPEG
$isPng = $sourceFile.Extension -match "\.png$"
$outputExt = ".jpg"

# Check for transparency
if ($isPng) {
    $hasAlpha = & magick identify -format "%A" $sourceFile.FullName 2>&1
    $isOpaque = & magick identify -format "%[opaque]" $sourceFile.FullName 2>&1
    if ($hasAlpha -eq "True" -and $isOpaque -eq "False") {
        $outputExt = ".png"
        Write-Host "Image has transparency, keeping PNG format" -ForegroundColor Yellow
    }
}

$outputName = "$baseName$outputExt"
$thumbName = "$baseName.jpg"  # Thumbnails always JPEG

Write-Host "`n=== Adding Gallery Image ===" -ForegroundColor Cyan
Write-Host "Source: $($sourceFile.FullName)"
Write-Host "Output: $outputName"
Write-Host ""

# Ensure directories exist
foreach ($dir in @($galleryPath, $fullsizePath, $thumbnailPath)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Step 1: Copy to gallery-fullsize (backup)
if (-not $SkipFullsize) {
    $fullsizeOutput = Join-Path $fullsizePath $sourceFile.Name
    if (-not (Test-Path $fullsizeOutput)) {
        Copy-Item $sourceFile.FullName $fullsizeOutput
        Write-Host "  [1/3] Saved original to gallery-fullsize" -ForegroundColor Green
    } else {
        Write-Host "  [1/3] Original already in gallery-fullsize" -ForegroundColor Gray
    }
} else {
    Write-Host "  [1/3] Skipped fullsize backup" -ForegroundColor Gray
}

# Step 2: Create optimized gallery version
$galleryOutput = Join-Path $galleryPath $outputName

$magickArgs = @(
    $sourceFile.FullName,
    "-resize", "${GalleryWidth}x>",
    "-quality", $Quality,
    "-strip",
    "-interlace", "Plane"
)

if ($outputExt -eq ".jpg") {
    $magickArgs += @("-sampling-factor", "4:2:0")
    if ($isPng) {
        $magickArgs += @("-background", "white", "-flatten")
    }
}

$magickArgs += $galleryOutput

& magick @magickArgs 2>&1 | Out-Null

if (Test-Path $galleryOutput) {
    $gallerySize = [math]::Round((Get-Item $galleryOutput).Length / 1KB, 2)
    Write-Host "  [2/3] Created gallery image: $gallerySize KB" -ForegroundColor Green
} else {
    Write-Error "Failed to create gallery image"
    exit 1
}

# Step 3: Create thumbnail
$thumbOutput = Join-Path $thumbnailPath $thumbName

$thumbArgs = @(
    $sourceFile.FullName,
    "-thumbnail", "${ThumbnailWidth}x",
    "-quality", "75",
    "-sampling-factor", "4:2:0",
    "-strip",
    "-interlace", "Plane"
)

if ($isPng) {
    $thumbArgs += @("-background", "white", "-flatten")
}

$thumbArgs += $thumbOutput

& magick @thumbArgs 2>&1 | Out-Null

if (Test-Path $thumbOutput) {
    $thumbSize = [math]::Round((Get-Item $thumbOutput).Length / 1KB, 2)
    Write-Host "  [3/3] Created thumbnail: $thumbSize KB" -ForegroundColor Green
} else {
    Write-Error "Failed to create thumbnail"
    exit 1
}

# Summary
$originalSize = [math]::Round($sourceFile.Length / 1KB, 2)
$totalOutput = $gallerySize + $thumbSize
$saved = [math]::Round($originalSize - $gallerySize, 2)

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Original: $originalSize KB"
Write-Host "Gallery:  $gallerySize KB (saved $saved KB)"
Write-Host "Thumb:    $thumbSize KB"

# HTML snippet
if ($ShowHtml) {
    Write-Host "`n=== HTML Snippet (add to gallery section in index.html) ===" -ForegroundColor Yellow
    Write-Host @"
          <img src="gallery/thumbnails/$thumbName" loading="lazy" alt="$AltText">
"@
}

Write-Host "`nDone!" -ForegroundColor Green
