#!/usr/bin/env python3
"""
Generate RenovApp's icon set — no third-party dependencies.

Draws a house with two bunk beds (it is a dorm, not a generic property app)
and writes the PNG sizes the web manifest needs plus a Windows .ico for the
desktop shortcut. Re-run after changing BG/FG if the brand colours move:

    python3 scripts/generate-icons.py
"""

import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public'

BG = (79, 70, 229)        # brand indigo, matches themeColor
FG = (255, 255, 255)
ACCENT = (199, 210, 254)

SS = 3  # supersampling factor for smooth edges


def rounded_rect(x, y, w, h, r):
    """Return a predicate telling whether (px, py) is inside a rounded rect."""
    def inside(px, py):
        if not (x <= px <= x + w and y <= py <= y + h):
            return False
        cx = min(max(px, x + r), x + w - r)
        cy = min(max(py, y + r), y + h - r)
        dx, dy = px - cx, py - cy
        return dx * dx + dy * dy <= r * r or (x + r <= px <= x + w - r) or (y + r <= py <= y + h - r)
    return inside


def triangle(ax, ay, bx, by, cx, cy):
    """Predicate for a filled triangle, via consistent edge signs."""
    def sign(px, py, x1, y1, x2, y2):
        return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)

    def inside(px, py):
        d1 = sign(px, py, ax, ay, bx, by)
        d2 = sign(px, py, bx, by, cx, cy)
        d3 = sign(px, py, cx, cy, ax, ay)
        has_neg = d1 < 0 or d2 < 0 or d3 < 0
        has_pos = d1 > 0 or d2 > 0 or d3 > 0
        return not (has_neg and has_pos)
    return inside


def build_shapes(size, maskable):
    """Layered shapes, painted back to front, in pixel coordinates."""
    scale = 0.66 if maskable else 0.80
    span = size * scale
    ox = oy = (size - span) / 2

    def X(f):
        return ox + f * span

    def Y(f):
        return oy + f * span

    shapes = [
        (triangle(X(0.5), Y(0.02), X(1.0), Y(0.40), X(0.0), Y(0.40)), FG),
        (rounded_rect(X(0.10), Y(0.40), span * 0.80, span * 0.58, span * 0.06), FG),
    ]
    for row in (0.53, 0.76):
        shapes.append(
            (rounded_rect(X(0.20), Y(row), span * 0.60, span * 0.15, span * 0.025), BG)
        )
        shapes.append(
            (rounded_rect(X(0.24), Y(row + 0.035), span * 0.14, span * 0.08, span * 0.02), ACCENT)
        )
    return shapes


def render(size, maskable=False, rounded=True):
    """Render RGBA pixel rows with SSxSS supersampling."""
    big = size * SS
    shapes = build_shapes(big, maskable)
    corner = big * 0.22
    clip = rounded_rect(0, 0, big - 1, big - 1, corner) if (rounded and not maskable) else None

    # Supersampled buffer: colour index per pixel, -1 = transparent.
    buf = bytearray(big * big * 4)
    for py in range(big):
        base = py * big * 4
        for px in range(big):
            if clip and not clip(px, py):
                continue  # stays transparent
            colour = BG
            for predicate, shape_colour in shapes:
                if predicate(px, py):
                    colour = shape_colour
            i = base + px * 4
            buf[i] = colour[0]
            buf[i + 1] = colour[1]
            buf[i + 2] = colour[2]
            buf[i + 3] = 255

    # Box-downsample to the target size.
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            r = g = b = a = 0
            for dy in range(SS):
                for dx in range(SS):
                    i = ((y * SS + dy) * big + (x * SS + dx)) * 4
                    r += buf[i]
                    g += buf[i + 1]
                    b += buf[i + 2]
                    a += buf[i + 3]
            n = SS * SS
            row += bytes((r // n, g // n, b // n, a // n))
        rows.append(bytes(row))
    return rows


def png_bytes(rows, size):
    raw = b''.join(b'\x00' + row for row in rows)

    def chunk(tag, data):
        payload = tag + data
        return struct.pack('>I', len(data)) + payload + struct.pack('>I', zlib.crc32(payload))

    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )


def ico_bytes(png, size):
    """A Vista-era .ico may embed a PNG payload verbatim."""
    dim = 0 if size >= 256 else size
    header = struct.pack('<HHH', 0, 1, 1)
    entry = struct.pack('<BBBBHHII', dim, dim, 0, 0, 1, 32, len(png), 22)
    return header + entry + png


def write(name, size, maskable=False):
    rows = render(size, maskable=maskable)
    data = png_bytes(rows, size)
    (OUT / name).write_bytes(data)
    print(f'  {name}  ({len(data):,} bytes)')
    return data


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    print('Génération des icônes dans public/ :')
    write('icon-192.png', 192)
    write('icon-512.png', 512)
    write('icon-512-maskable.png', 512, maskable=True)
    write('apple-touch-icon.png', 180)
    ico_png = png_bytes(render(256), 256)
    (OUT / 'favicon.ico').write_bytes(ico_bytes(ico_png, 256))
    print(f'  favicon.ico  ({len(ico_png) + 22:,} bytes)')
    print('Terminé.')
