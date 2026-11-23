"""
Compiles the Sriyas Healthcare Minimal Luxury Hero Orbital Animation Showcase GIF
demonstrating the clean typography protection, 3 intentional rings, and refined satellite.
"""

from PIL import Image
import os

ARTIFACT_DIR = r"C:\Users\surya\.gemini\antigravity\brain\12cb1919-e846-449e-ac74-8ab8159fca5b"
OUT_GIF = os.path.join(ARTIFACT_DIR, "163_minimal_luxury_orbital_showcase.gif")

frame_files = [
    os.path.join(ARTIFACT_DIR, "159_minimal_luxury_hero_desktop_1440.png"),
    os.path.join(ARTIFACT_DIR, "162_typography_protection_closeup.png"),
    os.path.join(ARTIFACT_DIR, "161_minimal_luxury_hero_ultrawide_1920.png"),
    os.path.join(ARTIFACT_DIR, "160_minimal_luxury_hero_mobile_390.png"),
]

durations = [2400, 2400, 2000, 2000]

frames = []
for f in frame_files:
    if os.path.exists(f):
        img = Image.open(f).convert("RGBA")
        w, h = img.size
        new_w = 840
        new_h = int(h * (new_w / w))
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        p_img = img_resized.convert("RGB").quantize(colors=128, method=Image.Resampling.LANCZOS)
        frames.append(p_img)

if frames:
    frames[0].save(
        OUT_GIF,
        save_all=True,
        append_images=frames[1:],
        duration=durations[:len(frames)],
        loop=0,
        optimize=True
    )
    print(f"Showcase GIF successfully generated: {OUT_GIF} ({len(frames)} frames)")
else:
    print("No frames found to generate GIF.")
