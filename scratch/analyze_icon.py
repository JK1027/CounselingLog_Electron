import os
from PIL import Image, ImageDraw

def analyze_image():
    img_path = r"C:\Users\user\.gemini\antigravity-ide\brain\88db87de-192e-497c-b3e4-fac93119b972\proposed_icon_notebook_bubbles_1779608690292.png"
    img = Image.open(img_path)
    img = img.convert("RGBA")
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # Check some pixel values in corners (e.g., top-left, top-right, bottom-left, bottom-right)
    corners = [(10, 10), (width - 10, 10), (10, height - 10), (width - 10, height - 10), (50, 50), (width - 50, 50)]
    for x, y in corners:
        print(f"Pixel at ({x}, {y}): {img.getpixel((x, y))}")

if __name__ == "__main__":
    analyze_image()
