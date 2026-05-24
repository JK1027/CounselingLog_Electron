import os
import sys
from PIL import Image, ImageDraw

def process_icon():
    src_path = r"C:\Users\user\.gemini\antigravity-ide\brain\88db87de-192e-497c-b3e4-fac93119b972\proposed_icon_notebook_bubbles_1779608690292.png"
    dest_png = r"c:\Coding3\CounselingLog_Electron\assets\icon.png"
    dest_ico = r"c:\Coding3\CounselingLog_Electron\assets\icon.ico"
    
    print("Loading image...")
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size # 1024x1024
    
    # Center coordinates
    center_x = 512
    center_y = 512
    
    # We shave off a few pixels to guarantee no gray background is captured at the edges.
    side = 746
    start_x = center_x - side // 2 # 512 - 373 = 139
    start_y = center_y - side // 2 # 512 - 373 = 139
    end_x = start_x + side # 885
    end_y = start_y + side # 885
    
    # Create high-resolution mask for antialiasing (4x scale)
    scale = 4
    mask_size = width * scale
    mask = Image.new("L", (mask_size, mask_size), 0)
    draw = ImageDraw.Draw(mask)
    
    # Radius of squircle corner
    r_left = start_x * scale
    r_top = start_y * scale
    r_right = end_x * scale
    r_bottom = end_y * scale
    radius = 160 * scale
    
    draw.rounded_rectangle([r_left, r_top, r_right, r_bottom], radius=radius, fill=255)
    
    # Downsample mask with LANCZOS for high quality edges
    mask = mask.resize((width, height), Image.Resampling.LANCZOS)
    
    # Apply mask
    transparent_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    transparent_img.paste(img, (0, 0), mask=mask)
    
    # Crop to the squircle area with a small padding (10 pixels)
    crop_padding = 10
    crop_left = start_x - crop_padding # 129
    crop_top = start_y - crop_padding # 129
    crop_right = end_x + crop_padding # 895
    crop_bottom = end_y + crop_padding # 895
    
    cropped_img = transparent_img.crop((crop_left, crop_top, crop_right, crop_bottom))
    
    # Resize to standard 256x256 for app icons
    final_img = cropped_img.resize((256, 256), Image.Resampling.LANCZOS)
    
    # Save PNG
    os.makedirs(os.path.dirname(dest_png), exist_ok=True)
    final_img.save(dest_png, format="PNG")
    print(f"Saved transparent PNG to: {dest_png}")
    
    # Save ICO
    final_img.save(dest_ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Saved multi-resolution ICO to: {dest_ico}")
    
    print("Done!")

if __name__ == "__main__":
    process_icon()
