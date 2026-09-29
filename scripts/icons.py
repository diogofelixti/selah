"""Gera os ícones do app a partir de design/logo/logo.png (quadrado, fundo cheio).

Uso: npm run icons (precisa do Pillow: pip install pillow).
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design/logo/logo.png'
OUT = ROOT / 'public'

# Centro do desenho (lamparina + livro) no logo original de 1254 px.
CENTER = (667, 617)


def crop(im: Image.Image, size: int) -> Image.Image:
    x, y = CENTER
    half = size // 2
    left = min(max(x - half, 0), im.width - size)
    top = min(max(y - half, 0), im.height - size)
    return im.crop((left, top, left + size, top + size))


def save(im: Image.Image, size: int, name: str) -> None:
    im.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)


logo = Image.open(SRC).convert('RGB')
# Ícone comum e do iPhone: recorte justo, o desenho ocupa ~85% do quadrado.
tight = crop(logo, 1000)
# Android (maskable): mais margem, o sistema corta as bordas em círculo ou gota.
loose = crop(logo, 1170)

save(tight, 64, 'pwa-64x64.png')
save(tight, 192, 'pwa-192x192.png')
save(tight, 512, 'pwa-512x512.png')
save(tight, 180, 'apple-touch-icon-180x180.png')
save(loose, 512, 'maskable-icon-512x512.png')
tight.resize((48, 48), Image.LANCZOS).save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('ícones gerados em', OUT)
