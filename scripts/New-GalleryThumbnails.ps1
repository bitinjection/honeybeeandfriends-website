<#
.SYNOPSIS
    Generates optimized thumbnails for gallery images.

.DESCRIPTION
    Creates small, optimized thumbnail versions of gallery images for the gallery grid display.
    Target: 300px width, JPEG quality 75%, optimized for fast grid loading.

.PARAMETER SourcePath
    Path to the honeybee website root directory. Defaults to parent of script location.

.PARAMETER GalleryFolder
    Name of the gallery folder. Default is "gallery".

.PARAMETER ThumbnailFolder
    Name of the thumbnail subfolder. Default is "thumbnails".

.PARAMETER Width
    Thumbnail width in pixels. Default is 300.

.PARAMETER Quality
    JPEG quality (1-100). Default is 75 (thumbnails can use lower quality).

.PARAMETER Force
    Regenerate thumbnails even if they already exist.

.PARAMETER WhatIf
    Shows what would be done without making changes.

.EXAMPLE
    .\New-GalleryThumbnails.ps1
    Generates missing thumbnails with default settings.

.EXAMPLE
    .\New-GalleryThumbnails.ps1 -Force
    Regenerates all thumbnails.

.EXAMPLE
    .\New-GalleryThumbnails.ps1 -Width 400 -Quality 80
    Generates larger, higher quality thumbnails.
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$SourcePath = (Split-Path -Parent $PSScriptRoot),
    [string]$GalleryFolder = "gallery",
    [string]$ThumbnailFolder = "thumbnails",
    [int]$Width = 300,
    [int]$Quality = 75,
    [switch]$Force
)

# Verify ImageMagick is available
try {
    $null = & magick --version 2>&1
} catch {
    Write-Error "ImageMagick is not installed or not in PATH. Install via: winget install ImageMagick.ImageMagick"
    exit 1
}

$galleryPath = Join-Path $SourcePath $GalleryFolder
$thumbnailPath = Join-Path $galleryPath $ThumbnailFolder

if (-not (Test-Path $galleryPath)) {
    Write-Error "Gallery folder not found: $galleryPath"
    exit 1
}

# Create thumbnails folder if it doesn't exist
if (-not (Test-Path $thumbnailPath)) {
    New-Item -ItemType Directory -Path $thumbnailPath -Force | Out-Null
    Write-Host "Created thumbnails folder: $thumbnailPath" -ForegroundColor Gray
}

Write-Host "`n=== Thumbnail Generation ===" -ForegroundColor Cyan
Write-Host "Source: $galleryPath"
Write-Host "Output: $thumbnailPath"
Write-Host "Settings: ${Width}px width, JPEG quality $Quality%`n"

# Get all image files from gallery (not thumbnails)
$images = Get-ChildItem -Path "$galleryPath\*" -File -Include @("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG") |
    Where-Object { $_.DirectoryName -eq $galleryPath -and $_.Name -notmatch '~$' }

$created = 0
$skipped = 0
$errors = 0

foreach ($image in $images) {
    # Determine thumbnail name (always JPEG for thumbnails)
    $thumbName = [System.IO.Path]::ChangeExtension($image.Name, ".jpg")

    # Keep PNG extension for images that might need transparency (check later)
    $isPng = $image.Extension -match "\.png$"

    $thumbPath = Join-Path $thumbnailPath $thumbName

    # Also check for PNG version of thumbnail
    $thumbPngPath = Join-Path $thumbnailPath ([System.IO.Path]::ChangeExtension($image.Name, ".png"))

    # Skip if thumbnail exists (unless Force)
    if (-not $Force) {
        if ((Test-Path $thumbPath) -or (Test-Path $thumbPngPath)) {
            Write-Host "  SKIP: $($image.Name) (thumbnail exists)" -ForegroundColor Gray
            $skipped++
            continue
        }
    }

    if ($PSCmdlet.ShouldProcess($image.Name, "Create thumbnail")) {
        try {
            # Check if PNG has transparency
            $keepPng = $false
            if ($isPng) {
                $hasAlpha = & magick identify -format "%A" $image.FullName 2>&1
                $keepPng = ($hasAlpha -eq "True")
            }

            if ($keepPng) {
                # Keep as PNG with transparency
                $thumbPath = Join-Path $thumbnailPath ([System.IO.Path]::ChangeExtension($image.Name, ".png"))
                $magickArgs = @(
                    $image.FullName,
                    "-thumbnail", "${Width}x",
                    "-quality", $Quality,
                    "-strip",
                    $thumbPath
                )
            } else {
                # Convert to optimized JPEG
                $magickArgs = @(
                    $image.FullName,
                    "-thumbnail", "${Width}x",
                    "-quality", $Quality,
                    "-sampling-factor", "4:2:0",
                    "-strip",
                    "-interlace", "Plane"
                )

                # Flatten PNG to remove transparency (white background)
                if ($isPng) {
                    $magickArgs += @("-background", "white", "-flatten")
                }

                $magickArgs += $thumbPath
            }

            & magick @magickArgs 2>&1 | Out-Null

            if (Test-Path $thumbPath) {
                $thumbSize = [math]::Round((Get-Item $thumbPath).Length / 1KB, 2)
                $sourceSize = [math]::Round($image.Length / 1KB, 2)
                Write-Host ("  OK: {0} -> {1} ({2} KB from {3} KB)" -f $image.Name, (Split-Path $thumbPath -Leaf), $thumbSize, $sourceSize) -ForegroundColor Green
                $created++
            } else {
                Write-Host "  ERROR: Failed to create thumbnail for $($image.Name)" -ForegroundColor Red
                $errors++
            }
        } catch {
            Write-Host "  ERROR: $($image.Name) - $_" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Created: $created thumbnails"
Write-Host "Skipped: $skipped (already exist)"
Write-Host "Errors: $errors"

# List any gallery images without thumbnails in HTML
Write-Host "`n=== Verification ===" -ForegroundColor Yellow
$htmlPath = Join-Path $SourcePath "index.html"
if (Test-Path $htmlPath) {
    $html = Get-Content $htmlPath -Raw
    $pattern = 'gallery/thumbnails/([^"'']+)'
    $matches = [regex]::Matches($html, $pattern)
    $missingInHtml = @()

    foreach ($match in $matches) {
        $thumbFile = $match.Groups[1].Value
        $fullThumbPath = Join-Path $thumbnailPath $thumbFile
        if (-not (Test-Path $fullThumbPath)) {
            $missingInHtml += $thumbFile
        }
    }

    if ($missingInHtml.Count -gt 0) {
        Write-Host "Thumbnails referenced in HTML but missing:" -ForegroundColor Red
        $missingInHtml | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    } else {
        Write-Host "All thumbnails referenced in HTML exist." -ForegroundColor Green
    }
}
