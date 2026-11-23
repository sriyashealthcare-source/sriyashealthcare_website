"""
Compiles the Sriyas Healthcare Hero Orbital Animation Showcase GIF
demonstrating the complete 6-panel storyboard flow.
"""

from PIL import Image
import glob
import os

ARTIFACT_DIR = r"C:\Users\surya\.gemini\antigravity\brain\12cb1919-e846-449e-ac74-8ab8159fca5b"
OUT_GIF = os.path.join(ARTIFACT_DIR, "158_hero_orbital_animation_showcase.gif")

frame_files = [
    os.path.join(ARTIFACT_DIR, "151_orbital_redesign_clean_initial.png"),
    os.path.join(ARTIFACT_DIR, "152_orbital_redesign_inner_orbit_stage1.png"),
    os.path.join(ARTIFACT_DIR, "153_orbital_redesign_inner_orbit_disappear.png"),
    os.path.join(ARTIFACT_DIR, "151_orbital_redesign_clean_initial.png"),
    os.path.join(ARTIFACT_DIR, "154_orbital_redesign_outer_orbit_stage2.png"),
    os.path.join(ARTIFACT_DIR, "155_orbital_redesign_outer_orbit_disappear.png"),
]

# Durations in milliseconds matching the storyboard:
# Initial (1200ms), Stage 1 Inner (2200ms), Disappear (800ms), Pause (1000ms), Stage 2 Outer (2400ms), Disappear (800ms)
durations = [1200, 2200, 800, 1000, 2400, 800]

frames = []
for f in frame_files:
    if os.path.exists(f):
        img = Image.open(f).convert("RGBA")
        # Resize smoothly to ~800px wide for crisp, lightweight GIF
        w, h = img.size
        new_w = 800
        new_h = int(h * (new_w / w))
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Convert to P mode with adaptive palette for crisp rendering
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
