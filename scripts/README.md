# Honeybee Website Image Optimization Scripts

PowerShell scripts for optimizing images on the Honeybee and Friends Daycare website.

## Prerequisites

- **ImageMagick**: Install via `winget install ImageMagick.ImageMagick`
- **PowerShell 5.1+** (included with Windows 10/11)

## Quick Start

### Optimize Everything (First Time Setup)

```powershell
cd C:\Users\dougl\honeybee\scripts
.\Process-AllImages.ps1
```

This runs the complete optimization pipeline and typically reduces total image size by 80-90%.

### Add a New Gallery Image

```powershell
.\Add-GalleryImage.ps1 -ImagePath "C:\Photos\new-photo.jpg" -AltText "Kids playing" -ShowHtml
```

This will:
1. Save original to `gallery-fullsize/`
2. Create optimized version in `gallery/`
3. Generate thumbnail in `gallery/thumbnails/`
4. Output HTML snippet to paste into `index.html`

## Individual Scripts

### `Optimize-SlideshowImages.ps1`

Optimizes the homepage slideshow images for fast initial page load.

```powershell
# Default settings (1920x800 max, 82% quality)
.\Optimize-SlideshowImages.ps1

# With backups
.\Optimize-SlideshowImages.ps1 -BackupOriginals

# Preview without changes
.\Optimize-SlideshowImages.ps1 -WhatIf
```

### `Optimize-GalleryImages.ps1`

Optimizes images in the `gallery/` folder.

```powershell
# Default settings (1600px max width, 82% quality)
.\Optimize-GalleryImages.ps1

# With backups to gallery-fullsize
.\Optimize-GalleryImages.ps1 -BackupOriginals
```

### `New-GalleryThumbnails.ps1`

Generates thumbnails for gallery images.

```powershell
# Generate missing thumbnails
.\New-GalleryThumbnails.ps1

# Regenerate all thumbnails
.\New-GalleryThumbnails.ps1 -Force

# Custom size
.\New-GalleryThumbnails.ps1 -Width 400 -Quality 80
```

### `Convert-PngToJpeg.ps1`

Converts PNG photographs to JPEG (70-90% size reduction).

```powershell
# Convert large PNGs in root
.\Convert-PngToJpeg.ps1

# Convert all PNGs and update HTML
.\Convert-PngToJpeg.ps1 -Recursive -UpdateHtmlReferences
```

### `Process-AllImages.ps1`

Master script that runs the complete optimization pipeline.

```powershell
# Full optimization
.\Process-AllImages.ps1

# With backups
.\Process-AllImages.ps1 -BackupOriginals

# Skip specific steps
.\Process-AllImages.ps1 -SkipSlideshow -SkipPngConversion
```

## Image Specifications

| Image Type | Max Dimensions | Quality | Target Size |
|------------|---------------|---------|-------------|
| Slideshow | 1920 x 800 | 82% | < 200 KB |
| Gallery | 1600 x auto | 82% | < 200 KB |
| Thumbnails | 300 x auto | 75% | < 50 KB |

## Folder Structure

```
honeybee/
├── gallery-fullsize/    # Original unmodified images (backup)
├── gallery/             # Optimized display images
│   └── thumbnails/      # Small preview images
├── scripts/             # These optimization scripts
└── *.jpg               # Slideshow and other site images
```

## Troubleshooting

### "ImageMagick is not installed"

```powershell
winget install ImageMagick.ImageMagick
```

Then restart your terminal.

### Images look too compressed

Increase quality setting:

```powershell
.\Optimize-GalleryImages.ps1 -Quality 90
```

### Need to restore original images

Originals are in `gallery-fullsize/` if you used `-BackupOriginals`, or check git history.
