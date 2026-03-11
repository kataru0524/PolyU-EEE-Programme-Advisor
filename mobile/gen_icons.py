from pathlib import Path
from PIL import Image, ImageDraw

BASE = Path(__file__).parent  # mobile/

SRC      = str(BASE / "../web/public/eee-logo.png")
IOS_ICON = str(BASE / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
RES      = str(BASE / "android/app/src/main/res")

PADDING = 0.10          # 10% padding for flat icons (iOS + Android legacy)
FOREGROUND_PADDING = 0.17  # 17% padding for adaptive foreground (logo within 66% safe zone)

def make_padded(src_path, canvas_size, bg_color, padding=PADDING):
    logo_size = int(canvas_size * (1 - 2 * padding))
    img = Image.open(src_path).convert("RGBA")
    logo = img.resize((logo_size, logo_size), Image.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), bg_color)
    offset = (canvas_size - logo_size) // 2
    canvas.paste(logo, (offset, offset), logo)
    return canvas

def make_circle(src_path, canvas_size, circle_color=(255, 255, 255, 255), padding=PADDING):
    """Logo centered on a circle background; outside circle is transparent."""
    logo_size = int(canvas_size * (1 - 2 * padding))
    img = Image.open(src_path).convert("RGBA")
    logo = img.resize((logo_size, logo_size), Image.LANCZOS)
    # Draw circle background
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    circle = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, canvas_size - 1, canvas_size - 1), fill=circle_color)
    canvas = Image.alpha_composite(canvas, circle)
    offset = (canvas_size - logo_size) // 2
    canvas.paste(logo, (offset, offset), logo)
    return canvas

# iOS: white background, 1024x1024 (no transparency allowed)
ios_img = make_padded(SRC, 1024, (255, 255, 255, 255))
ios_img.convert("RGB").save(IOS_ICON, "PNG")
print(f"iOS: {IOS_ICON}")

# Android legacy icons (pre-API 26): white background as fallback
legacy_icons = [
    ("mipmap-mdpi",    48,  ["ic_launcher", "ic_launcher_round"]),
    ("mipmap-hdpi",    72,  ["ic_launcher", "ic_launcher_round"]),
    ("mipmap-xhdpi",   96,  ["ic_launcher", "ic_launcher_round"]),
    ("mipmap-xxhdpi",  144, ["ic_launcher", "ic_launcher_round"]),
    ("mipmap-xxxhdpi", 192, ["ic_launcher", "ic_launcher_round"]),
]

for (folder, size, names) in legacy_icons:
    img = make_circle(SRC, size, circle_color=(255, 255, 255, 255))
    for name in names:
        path = f"{RES}/{folder}/{name}.png"
        img.save(path, "PNG")
        print(f"Android legacy: {path} ({size}x{size})")

# Android adaptive foreground (API 26+): transparent background, system applies mask + ic_launcher_background color
# Logo should sit within the central 66% safe zone; use ~17% padding each side
foreground_icons = [
    ("mipmap-mdpi",    108),
    ("mipmap-hdpi",    162),
    ("mipmap-xhdpi",   216),
    ("mipmap-xxhdpi",  324),
    ("mipmap-xxxhdpi", 432),
]

for (folder, size) in foreground_icons:
    img = make_padded(SRC, size, (0, 0, 0, 0), FOREGROUND_PADDING)  # transparent
    path = f"{RES}/{folder}/ic_launcher_foreground.png"
    img.save(path, "PNG")
    print(f"Android foreground: {path} ({size}x{size})")

print("\nDone!")

# ── Splash screens ────────────────────────────────────────────────────────────

SPLASH_LOGO_RATIO = 0.35  # logo occupies 35% of the shorter screen dimension

IOS_SPLASH = BASE / "ios/App/App/Assets.xcassets/Splash.imageset"
ANDROID_RES = BASE / "android/app/src/main/res"

def make_splash(src_path, width, height, bg=(255, 255, 255, 255)):
    """White canvas with logo centered, sized to 35% of the shorter dimension."""
    logo_size = int(min(width, height) * SPLASH_LOGO_RATIO)
    img = Image.open(src_path).convert("RGBA")
    logo = img.resize((logo_size, logo_size), Image.LANCZOS)
    canvas = Image.new("RGBA", (width, height), bg)
    x = (width - logo_size) // 2
    y = (height - logo_size) // 2
    canvas.paste(logo, (x, y), logo)
    return canvas.convert("RGB")

# iOS: all three scale slots use the same 2732x2732 image
print("\n▶ Generating iOS splash screens...")
for filename in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
    path = IOS_SPLASH / filename
    make_splash(SRC, 2732, 2732).save(str(path), "PNG")
    print(f"  iOS splash: {filename}")

# Android splash variants (portrait + landscape + default)
android_splashes = [
    ("drawable",            480,  320),
    ("drawable-port-mdpi",  320,  480),
    ("drawable-port-hdpi",  480,  800),
    ("drawable-port-xhdpi", 720,  1280),
    ("drawable-port-xxhdpi",960,  1600),
    ("drawable-port-xxxhdpi",1280,1920),
    ("drawable-land-mdpi",  480,  320),
    ("drawable-land-hdpi",  800,  480),
    ("drawable-land-xhdpi", 1280, 720),
    ("drawable-land-xxhdpi",1600, 960),
    ("drawable-land-xxxhdpi",1920,1280),
]

print("\n▶ Generating Android splash screens...")
for (folder, w, h) in android_splashes:
    path = str(ANDROID_RES / folder / "splash.png")
    make_splash(SRC, w, h).save(path, "PNG")
    print(f"  Android splash: {folder}/splash.png ({w}x{h})")

print("\nAll splash screens done!")

