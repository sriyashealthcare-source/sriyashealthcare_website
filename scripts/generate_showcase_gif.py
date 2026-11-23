import os
from PIL import Image

artifact_dir = r'C:\Users\surya\.gemini\antigravity\brain\12cb1919-e846-449e-ac74-8ab8159fca5b'
frame_files = [
    '134_slow_stage1_clean_logo.png',
    '135_slow_stage2_inner_appear.png',
    '136_slow_stage3_inner_travelling.png',
    '137_slow_stage3_inner_completed.png',
    '138_slow_stage4_inner_disappear.png',
    '139_slow_stage5_outer_appear.png',
    '140_slow_stage6_outer_travelling.png',
    '141_slow_stage6_outer_completed.png',
    '142_slow_stage7_outer_disappear.png',
    '143_slow_stage2_sequence_repeated.png'
]

# Durations in ms corresponding to the refined storyboard pace
durations = [1500, 800, 3500, 3500, 800, 800, 4500, 4500, 800, 2000]

frames = []
for f in frame_files:
    p = os.path.join(artifact_dir, f)
    if os.path.exists(p):
        img = Image.open(p).convert('RGBA')
        # Create RGB with ivory background for clean gif
        bg = Image.new('RGB', img.size, (251, 249, 244))
        bg.paste(img, mask=img.split()[3])
        # Resize to 75% for crisp display and efficient loading
        w, h = bg.size
        small = bg.resize((int(w * 0.75), int(h * 0.75)), Image.Resampling.LANCZOS)
        frames.append(small)

if frames:
    gif_path = os.path.join(artifact_dir, '145_sriyas_gold_orbital_animation_showcase.gif')
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=[int(d * 0.75) for d in durations],
        loop=0
    )
    print(f'Animated GIF created successfully: {gif_path} (Frames: {len(frames)})')
else:
    print('No frames found to generate GIF.')
