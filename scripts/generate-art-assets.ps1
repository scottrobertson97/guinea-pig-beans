param(
  [string]$OutputRoot = "public/assets"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-AssetDirectory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function New-Bitmap([int]$Width, [int]$Height) {
  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.Clear([System.Drawing.Color]::Transparent)
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Bitmap($Canvas, [string]$Path) {
  New-AssetDirectory (Split-Path -Parent $Path)
  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Dispose()
}

function Brush([string]$Hex, [int]$Alpha = 255) {
  $color = [System.Drawing.ColorTranslator]::FromHtml($Hex)
  return [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($Alpha, $color.R, $color.G, $color.B))
}

function Pen([string]$Hex, [float]$Width, [int]$Alpha = 255) {
  $color = [System.Drawing.ColorTranslator]::FromHtml($Hex)
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($Alpha, $color.R, $color.G, $color.B), $Width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  return $pen
}

function Fill-Ellipse($Graphics, [float]$X, [float]$Y, [float]$W, [float]$H, [string]$Fill, [string]$Stroke = "", [float]$StrokeWidth = 1) {
  $brush = Brush $Fill
  $Graphics.FillEllipse($brush, $X, $Y, $W, $H)
  $brush.Dispose()
  if ($Stroke -ne "") {
    $pen = Pen $Stroke $StrokeWidth 170
    $Graphics.DrawEllipse($pen, $X, $Y, $W, $H)
    $pen.Dispose()
  }
}

function Fill-RoundRect($Graphics, [float]$X, [float]$Y, [float]$W, [float]$H, [float]$R, [string]$Fill, [string]$Stroke = "", [float]$StrokeWidth = 1, [int]$Alpha = 255) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $R * 2
  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $brush = Brush $Fill $Alpha
  $Graphics.FillPath($brush, $path)
  $brush.Dispose()
  if ($Stroke -ne "") {
    $pen = Pen $Stroke $StrokeWidth 180
    $Graphics.DrawPath($pen, $path)
    $pen.Dispose()
  }
  $path.Dispose()
}

function Draw-Highlight($Graphics, [float]$X, [float]$Y, [float]$W, [float]$H) {
  Fill-Ellipse $Graphics $X $Y $W $H "#ffffff" "" 1
}

function New-PigAsset([string]$Path, [string]$Body, [string]$Spot, [string]$Nose) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-Ellipse $g 126 338 270 76 "#000000" "" 1
  ($g).FillEllipse((Brush "#000000" 28), 126, 338, 270, 76)
  Fill-Ellipse $g 122 136 284 220 $Body "#7a5736" 7
  Fill-Ellipse $g 92 154 78 68 $Body "#7a5736" 5
  Fill-Ellipse $g 346 154 74 64 $Body "#7a5736" 5
  Fill-Ellipse $g 158 166 96 72 $Spot "" 1
  Fill-Ellipse $g 250 252 88 64 $Spot "" 1
  Fill-Ellipse $g 332 224 42 34 $Nose "#5b351d" 3
  Fill-Ellipse $g 294 198 18 18 "#17120e" "" 1
  Fill-Ellipse $g 299 201 5 5 "#ffffff" "" 1
  Fill-Ellipse $g 170 306 42 28 $Body "#7a5736" 4
  Fill-Ellipse $g 286 310 42 26 $Body "#7a5736" 4
  Draw-Highlight $g 188 156 92 34
  Save-Bitmap $canvas $Path
}

function New-BeanAsset([string]$Path, [string]$Fill, [string]$Stroke, [switch]$Leaf, [switch]$Rainbow) {
  $canvas = New-Bitmap 256 256
  $g = $canvas.Graphics
  ($g).FillEllipse((Brush "#000000" 34), 64, 153, 130, 36)
  Fill-Ellipse $g 55 76 146 88 $Fill $Stroke 7
  if ($Rainbow) {
    $colors = @("#e85d75", "#f0b94d", "#8fcf6b", "#59b6d6", "#8a73c9")
    for ($i = 0; $i -lt $colors.Length; $i += 1) {
      $pen = Pen $colors[$i] 7 230
      $g.DrawArc($pen, 76 + $i * 5, 80 + $i * 2, 94 - $i * 4, 58 - $i, 205, 105)
      $pen.Dispose()
    }
  }
  if ($Leaf) {
    Fill-Ellipse $g 143 59 38 22 "#7ba95a" "#466c36" 3
    $pen = Pen "#466c36" 3 190
    $g.DrawLine($pen, 140, 79, 176, 65)
    $pen.Dispose()
  }
  Draw-Highlight $g 91 94 46 18
  Save-Bitmap $canvas $Path
}

function New-CageFloor([string]$Path) {
  $canvas = New-Bitmap 1024 1024
  $g = $canvas.Graphics
  Fill-RoundRect $g 0 0 1024 1024 32 "#cbbd90"
  $linePen = Pen "#8faa76" 4 70
  for ($i = 0; $i -le 1024; $i += 128) {
    $g.DrawLine($linePen, $i, 0, $i, 1024)
    $g.DrawLine($linePen, 0, $i, 1024, $i)
  }
  $linePen.Dispose()
  $hayPen = Pen "#d7c652" 8 125
  $rng = [System.Random]::new(7)
  for ($i = 0; $i -lt 42; $i += 1) {
    $x = $rng.Next(36, 980)
    $y = $rng.Next(36, 980)
    $g.DrawLine($hayPen, $x, $y, $x + $rng.Next(-32, 36), $y + $rng.Next(-14, 18))
  }
  $hayPen.Dispose()
  Save-Bitmap $canvas $Path
}

function New-HayRack([string]$Path) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-RoundRect $g 105 152 302 196 32 "#6e8f67" "#405f3c" 10
  for ($i = 0; $i -lt 18; $i += 1) {
    $pen = Pen "#d9c952" 12 235
    $g.DrawLine($pen, 138 + $i * 13, 322, 154 + $i * 11, 178 + (($i % 4) * 10))
    $pen.Dispose()
  }
  Fill-RoundRect $g 120 330 272 32 14 "#7a5736" "#5a3c24" 5
  Save-Bitmap $canvas $Path
}

function New-WaterBottle([string]$Path) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-RoundRect $g 188 78 136 270 36 "#97d9e8" "#3b7b8b" 9 225
  Fill-RoundRect $g 180 54 152 48 18 "#d85f4d" "#943b31" 6
  Fill-RoundRect $g 206 118 78 178 24 "#ffffff" "" 1 70
  $pen = Pen "#aeb5b3" 18 255
  $g.DrawLine($pen, 205, 354, 142, 424)
  $pen.Dispose()
  Fill-Ellipse $g 127 414 32 22 "#d4dad8" "#7a8582" 4
  Save-Bitmap $canvas $Path
}

function New-LitterTray([string]$Path) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-RoundRect $g 92 144 328 216 42 "#6f8585" "#33484e" 11
  Fill-RoundRect $g 126 190 260 118 26 "#c9bea5" "#9c8c70" 5
  Draw-Highlight $g 136 162 116 24
  Save-Bitmap $canvas $Path
}

function New-ToyPile([string]$Path) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-Ellipse $g 124 284 254 58 "#000000" "" 1
  Fill-RoundRect $g 162 190 190 92 44 "#5aa8c9" "#30697e" 7
  Fill-Ellipse $g 126 236 76 76 "#d75b4b" "#8e352d" 6
  Fill-Ellipse $g 288 252 78 78 "#e0c34e" "#998326" 6
  $pen = Pen "#7a5736" 12 235
  $g.DrawLine($pen, 228, 180, 284, 136)
  $g.DrawLine($pen, 230, 178, 270, 190)
  $pen.Dispose()
  Save-Bitmap $canvas $Path
}

function New-Robot([string]$Path, [string]$Body = "#aebbc4", [switch]$Advanced) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-Ellipse $g 150 346 220 48 "#000000" "" 1
  Fill-RoundRect $g 132 158 248 174 42 $Body "#51616b" 10
  Fill-RoundRect $g 246 204 86 58 16 "#2e3a42" "#172027" 5
  Fill-Ellipse $g 266 224 14 14 "#92e6ff" "" 1
  Fill-Ellipse $g 302 224 14 14 "#92e6ff" "" 1
  Fill-Ellipse $g 148 174 30 30 "#e4b83b" "#a47422" 4
  $pen = Pen "#7a5736" 18 245
  $g.DrawLine($pen, 158, 316, 102, 354)
  $pen.Dispose()
  if ($Advanced) {
    $armPen = Pen "#6d8794" 13 245
    $g.DrawLine($armPen, 374, 252, 424, 224)
    $g.DrawLine($armPen, 138, 252, 88, 224)
    $armPen.Dispose()
  }
  Save-Bitmap $canvas $Path
}

function New-CompostBin([string]$Path) {
  $canvas = New-Bitmap 512 512
  $g = $canvas.Graphics
  Fill-RoundRect $g 142 134 228 232 38 "#5f8f5f" "#3e633d" 10
  Fill-RoundRect $g 120 110 272 58 22 "#79a86f" "#3e633d" 8
  Fill-Ellipse $g 228 210 64 40 "#b9d77b" "#628a40" 4
  $pen = Pen "#628a40" 5 210
  $g.DrawLine($pen, 224, 232, 294, 208)
  $pen.Dispose()
  Save-Bitmap $canvas $Path
}

$root = Join-Path (Get-Location) $OutputRoot
New-AssetDirectory $root

New-PigAsset (Join-Path $root "sprites/pigs/pig_cream_brown_idle.png") "#f0d1a3" "#7a4c2e" "#6d4225"
New-PigAsset (Join-Path $root "sprites/pigs/pig_white_black_idle.png") "#efe8dc" "#2f2923" "#5e4534"
New-PigAsset (Join-Path $root "sprites/pigs/pig_russet_idle.png") "#a7643e" "#f6dfbc" "#6d4225"
New-PigAsset (Join-Path $root "sprites/pigs/pig_gray_white_idle.png") "#9faaa8" "#f2eadc" "#5e4534"
New-PigAsset (Join-Path $root "sprites/pigs/pig_tricolor_idle.png") "#efd7aa" "#2f2923" "#8a4e2c"

New-BeanAsset (Join-Path $root "sprites/beans/bean_normal.png") "#56361f" "#2a1c12"
New-BeanAsset (Join-Path $root "sprites/beans/bean_aged.png") "#6e4827" "#3a2415"
New-BeanAsset (Join-Path $root "sprites/beans/bean_golden.png") "#e4b83b" "#fff0a3"
New-BeanAsset (Join-Path $root "sprites/beans/bean_rainbow.png") "#745ab4" "#eadfff" -Rainbow
New-BeanAsset (Join-Path $root "sprites/beans/bean_compost.png") "#68713b" "#a58c4c" -Leaf

New-CageFloor (Join-Path $root "backgrounds/cage_floor_fleece.png")
New-HayRack (Join-Path $root "sprites/decor/hay_rack_full.png")
New-WaterBottle (Join-Path $root "sprites/decor/water_bottle_full.png")
New-LitterTray (Join-Path $root "sprites/decor/litter_tray_clean.png")
New-ToyPile (Join-Path $root "sprites/decor/toy_pile.png")
New-Robot (Join-Path $root "sprites/upgrades/roaming_dustpan.png")
New-CompostBin (Join-Path $root "sprites/upgrades/compost_bin.png")
New-Robot (Join-Path $root "sprites/upgrades/cavybot_3000.png") "#88adc8" -Advanced

Write-Host "Generated art assets in $root"
