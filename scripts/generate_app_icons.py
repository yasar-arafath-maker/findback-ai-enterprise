import os
from PIL import Image, ImageDraw

def create_round_icon(im):
    size = im.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    output = Image.new('RGBA', size, (0, 0, 0, 0))
    output.paste(im.convert('RGBA'), (0, 0), mask)
    return output

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_image_path = os.path.join(base_dir, 'public', 'assets', 'app_icon_v2.jpg')
    
    print(f"Loading source icon: {source_image_path}")
    source = Image.open(source_image_path).convert('RGBA')
    
    # 1. Save web / root icon replacements
    icon_512 = source.resize((512, 512), Image.Resampling.LANCZOS)
    
    web_targets = [
        os.path.join(base_dir, 'public', 'z_icon_cropped.png'),
        os.path.join(base_dir, 'public', 'assets', 'z_icon_cropped.png'),
        os.path.join(base_dir, 'public', 'favicon.png'),
        os.path.join(base_dir, 'z_icon_cropped.png'),
    ]
    
    for target in web_targets:
        icon_512.save(target, 'PNG')
        print(f"Updated web asset: {target}")
        
    # Also save favicon.ico
    icon_512.save(os.path.join(base_dir, 'public', 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
    print("Updated public/favicon.ico")

    # 2. Android Mipmap densities
    mipmaps = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    res_dir = os.path.join(base_dir, 'android', 'app', 'src', 'main', 'res')

    for folder, size in mipmaps.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Standard square launcher
        sq_img = source.resize((size, size), Image.Resampling.LANCZOS)
        sq_img.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
        sq_img.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
        
        # Round launcher
        rd_img = create_round_icon(sq_img)
        rd_img.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
        
        print(f"Generated Android icons for {folder} ({size}x{size})")

    print("All app logo icons updated successfully!")

if __name__ == '__main__':
    main()
