"""Generate the small, self-contained social preview (Pillow, development only)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
image = Image.new('RGB', (1200, 630), '#f8f7f2')
draw = ImageDraw.Draw(image)
fonts = Path('C:/Windows/Fonts')
serif = ImageFont.truetype(str(fonts / 'georgia.ttf'), 69)
sans = ImageFont.truetype(str(fonts / 'segoeui.ttf'), 28)
small = ImageFont.truetype(str(fonts / 'segoeui.ttf'), 21)
draw.rounded_rectangle((838, 48, 1140, 578), radius=151, fill='#e8eddf')
draw.ellipse((927, 131, 1039, 243), fill='#f8f7f2')
draw.rounded_rectangle((876, 315, 1113, 513), radius=70, fill='#b4c2a7')
draw.line((992, 476, 992, 321), fill='#4b654d', width=5)
draw.ellipse((930, 335, 992, 398), fill='#718168')
draw.ellipse((991, 306, 1056, 369), fill='#718168')
draw.text((66, 58), 'СОБРАНИЯ И ПОДДЕРЖКА · ОМСК', font=small, fill='#4b654d')
draw.text((61, 133), 'Собрания', font=serif, fill='#303d32')
draw.text((61, 218), 'созависимых', font=serif, fill='#303d32')
draw.text((61, 303), 'в Омске', font=serif, fill='#718168')
draw.text((66, 414), 'Нефтезаводская, 10 · студия подкастов', font=small, fill='#647064')
draw.rounded_rectangle((64, 477, 670, 557), radius=12, fill='#4b654d')
draw.text((92, 495), '+7 983 621-21-48', font=sans, fill='#ffffff')
image.save(ROOT / 'src/assets/social.png', optimize=True)
print('Social image generated: 1200 x 630')
