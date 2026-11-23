"""
Compiles the Sriyas Healthcare Premium Two-Stage Alternating Orbital Animation Showcase GIF
demonstrating the sequential alternation between Stage 1 (Inner Ring) and Stage 2 (Outer Ring).
"""

from PIL import Image
import os

ARTIFACT_DIR = r"C:\Users\surya\.gemini\antigravity\brain\12cb1919-e846-449e-ac74-8ab8159fca5b"
OUT_GIF = os.path.join(ARTIFACT_DIR, "168_two_stage_alternating_showcase.gif")

frame_files = [
    os.path.join(ARTIFACT_DIR, "164_two_stage_inner_active.png"),
    os.path.join(ARTIFACT_DIR, "165_two_stage_outer_active.png"),
    os.path.join(ARTIFACT_DIR, "166_two_stage_typography_mask_closeup.png"),
    os.path.join(ARTIFACT_DIR, "167_two_stage_mobile_390.png"),
]

durations = [2800, 2800, 2400, 2000]

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
