#!/usr/bin/env python3
"""Prepare approved ImageGen renders using Pillow and NumPy.

Run from any directory with: python3 tools/prepare_sprites.py --references ~/Desktop
The script reads originals and intermediate inputs from this handoff package.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / "原图"
CHECKS = ROOT / "检查"
BODIES = ROOT / "成品" / "全身"
AVATARS = ROOT / "成品" / "头像"
CANVAS = (1024, 1536)
FOOT_Y = 1500
CENTER_X = 512
RESAMPLE = Image.Resampling.LANCZOS
BG = "#f3f6fb"
# Height, target crown, crown search box, body center x, eye midpoint, portrait crop side.
PEOPLE = {
    "natsumi": (168, 139, (422, 53, 483, 90), 505, (487, 200), 610),
    "shizuka": (165, 164, (465, 7, 550, 34), 514, (512, 176), 596),
    "miu": (160, 204, (448, 5, 555, 33), 504, (511, 169), 612),
    "akari": (157, 228, (462, 40, 559, 64), 511, (524, 230), 684),
    "shiori": (154, 253, (446, 5, 545, 32), 502, (501, 211), 652),
}
REFERENCES = {
    "natsumi": "image4.jpeg",
    "shizuka": "image.jpeg",
    "miu": "image3.jpeg",
    "akari": "image1.jpeg",
    "shiori": "image2.jpeg",
}
EXPRESSIONS = ("平静", "笑", "困惑", "惊讶", "着急")
SILHOUETTES = ("shiori", "miu", "akari", "natsumi", "shizuka")
ROUND_AVATARS = ("akari", "shizuka", "natsumi", "shiori", "miu")
HAIR_SAMPLES = {
    "natsumi": ((417, 79, 470, 116), (483, 76, 521, 102), (604, 118, 636, 157)),
    "shizuka": ((442, 68, 581, 115), (411, 270, 429, 328), (574, 241, 589, 296)),
    "miu": ((425, 48, 485, 77), (540, 53, 573, 83), (607, 204, 626, 246)),
    "akari": ((471, 83, 557, 132), (342, 157, 381, 196), (632, 146, 677, 181)),
    "shiori": ((378, 117, 405, 171), (440, 76, 480, 141), (552, 71, 578, 120)),
}

FACE = ((415, 159), (449, 148), (475, 157), (505, 136), (541, 149),
        (557, 165), (560, 225), (552, 252), (532, 275), (496, 284),
        (461, 273), (439, 253), (417, 234), (408, 205))
CHEEK_ARM = ((310, 244), (371, 232), (410, 254), (447, 232), (465, 258),
             (454, 310), (433, 348), (416, 408), (398, 475), (344, 528),
             (269, 550), (232, 516), (233, 435), (266, 365))
LEFT_ARM = ((306, 234), (384, 236), (406, 268), (439, 304), (461, 331),
            (463, 372), (450, 407), (429, 450), (406, 502), (377, 535),
            (312, 549), (247, 551), (225, 511), (233, 437), (269, 362))
RIGHT_ARM = ((607, 302), (649, 296), (696, 346), (709, 447), (759, 574),
             (808, 678), (819, 741), (782, 768), (724, 761), (713, 698),
             (666, 633), (626, 565), (603, 517), (611, 466), (614, 421),
             (587, 391), (584, 333))
TAIL_TIPS = ((629, 37), (768, 39), (771, 280), (651, 321), (595, 303),
             (615, 274), (616, 232), (617, 173), (616, 116))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized_alpha(image):
    data = np.array(image.convert("RGBA"))
    alpha = np.clip((data[:, :, 3].astype(np.float32) - 12) / 233, 0, 1)
    data[:, :, 3] = np.rint(alpha * 255).astype(np.uint8)
    data[alpha == 0] = 0
    return Image.fromarray(data)


def green_to_alpha(image):
    rgb = np.array(image.convert("RGB"), dtype=np.float32)
    red, green, blue = np.moveaxis(rgb, -1, 0)
    spill = green - np.maximum(red, blue)
    alpha = np.clip((239 - spill) / 224, 0, 1)
    # Undo the green key's contribution to mixed edge pixels, keeping opaque colors intact.
    alpha_safe = np.maximum(alpha, 1 / 255)
    corrected = rgb / alpha_safe[:, :, None]
    corrected[:, :, 1] = (green - (1 - alpha) * 249) / alpha_safe
    result = np.dstack((np.clip(corrected, 0, 255), alpha * 255))
    result[alpha == 0] = 0
    return Image.fromarray(np.rint(result).astype(np.uint8))


def local_edit(base, rendered, polygons, feather=4):
    mask = Image.new("L", CANVAS)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon(polygon, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    # Use premultiplied color at semi-transparent edges.
    result = Image.composite(rendered.convert("RGBa"), base.convert("RGBa"), mask).convert("RGBA")
    # Avoid rounding or changing any pixel outside the support of the edit.
    result.paste(base, mask=mask.point(lambda value: 255 if value == 0 else 0))
    return result, mask


def load_base(person):
    source = Image.open(ORIGINALS / f"{person}-平静.png")
    if person == "akari":
        # The mouth edit has an unusable alpha channel. Retain the clean original
        # sprite and use the generated pixels only in the opaque mouth area.
        clean = normalized_alpha(Image.open(ROOT / "tools" / "黑羽灯-初稿-alpha来源.png"))
        local = source.convert("RGB").convert("RGBA")
        local.putalpha(clean.getchannel("A"))
        mouth = ((490, 259), (557, 259), (557, 302), (491, 302))
        source, _ = local_edit(clean, local, (mouth,), feather=5)
        return source
    assert source.mode == "RGBA" and source.getpixel((5, 5))[3] < 10, person
    return normalized_alpha(source)


def raw_expression(label, base):
    regions = (FACE,)
    if label == "困惑":
        regions += (CHEEK_ARM,)
    if label == "着急":
        regions += (LEFT_ARM, RIGHT_ARM)
    if label == "惊讶":
        regions += (TAIL_TIPS,)
    edited = green_to_alpha(Image.open(ORIGINALS / f"natsumi-{label}.png"))
    return local_edit(base, edited, regions)


def alpha_bbox(image, threshold=128):
    return image.getchannel("A").point(lambda value: 255 if value >= threshold else 0).getbbox()


def measure_crown(image, rect):
    bbox = alpha_bbox(image.crop(rect))
    assert bbox is not None, rect
    return rect[1] + bbox[1]


def key_color_fringe(data):
    red, green, blue, alpha = np.moveaxis(data.astype(np.int16), -1, 0)
    semi = (alpha > 0) & (alpha < 255)
    green_fringe = (green > 140) & (green - np.maximum(red, blue) > 55)
    magenta_fringe = (np.minimum(red, blue) > 140) & (np.minimum(red, blue) - green > 80)
    return semi & (green_fringe | magenta_fringe)


def clean_resampled_edges(image):
    data = np.array(image)
    alpha = data[:, :, 3]
    data[(alpha <= 32) & key_color_fringe(data)] = 0
    data[alpha == 0] = 0
    return Image.fromarray(data)


def scale_body(image, scale, origin):
    sized = tuple(round(length * scale) for length in CANVAS)
    result = Image.new("RGBA", CANVAS)
    result.paste(image.resize(sized, RESAMPLE), origin)
    return clean_resampled_edges(result)


def avatar(image, eye, side):
    x, y = eye
    left = round(x - side / 2)
    top = round(y - 0.42 * side)
    cropped = image.crop((left, top, left + side, top + side))
    return clean_resampled_edges(cropped.resize((512, 512), RESAMPLE))


def round_avatar(image):
    big = image.copy()
    circle = Image.new("L", big.size)
    ImageDraw.Draw(circle).ellipse((0, 0, 511, 511), fill=255)
    alpha = np.minimum(np.asarray(big.getchannel("A")), np.asarray(circle))
    big.putalpha(Image.fromarray(alpha))
    return big.resize((96, 96), RESAMPLE)


def opaque_panel(size):
    return Image.new("RGBA", size, BG)


def paste(target, sprite, position):
    target.alpha_composite(sprite.convert("RGBA"), position)


def label(image, x, y, text):
    font = ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", 17)
    ImageDraw.Draw(image).text((x, y), text, font=font, fill="#172235", anchor="mm")


def make_check_images(bodies, avatars, refs):
    row = Image.new("RGBA", (1280, 384))
    for index, person in enumerate(PEOPLE):
        paste(row, bodies[person, "平静"].resize((256, 384), RESAMPLE), (256 * index, 0))
    row.save(CHECKS / "阵容.png")
    gray = ImageOps.grayscale(row).convert("RGBA")
    gray.putalpha(row.getchannel("A"))
    gray.save(CHECKS / "阵容-灰度.png")

    silhouettes = opaque_panel((1280, 422))
    for index, person in enumerate(SILHOUETTES):
        art = bodies[person, "平静"].resize((256, 384), RESAMPLE)
        silhouette = Image.new("RGBA", art.size, "black")
        silhouette.putalpha(art.getchannel("A"))
        paste(silhouettes, silhouette, (256 * index, 0))
        label(silhouettes, 256 * index + 128, 405, str(index + 1))
    silhouettes.save(CHECKS / "剪影-盲测.png")

    circles = opaque_panel((616, 148))
    for index, person in enumerate(ROUND_AVATARS):
        paste(circles, round_avatar(avatars[person, "平静"]), (20 + 120 * index, 12))
        label(circles, 68 + 120 * index, 127, "ABCDE"[index])
    circles.save(CHECKS / "头像-盲测.png")

    comparisons = opaque_panel((1280, 768))
    for index, person in enumerate(PEOPLE):
        reference = Image.open(refs / REFERENCES[person]).convert("RGB")
        thumb = ImageOps.contain(reference, (256, 384), RESAMPLE)
        paste(comparisons, thumb, (256 * index + (256 - thumb.width) // 2, (384 - thumb.height) // 2))
        paste(comparisons, bodies[person, "平静"].resize((256, 384), RESAMPLE), (256 * index, 384))
    comparisons.save(CHECKS / "和Gemini对照.png")

    expressions = opaque_panel((1280, 546))
    for index, expression in enumerate(EXPRESSIONS):
        x = 256 * index
        paste(expressions, bodies["natsumi", expression].resize((256, 384), RESAMPLE), (x, 0))
        paste(expressions, avatars["natsumi", expression].resize((128, 128), RESAMPLE), (x + 64, 378))
        label(expressions, x + 128, 527, expression)
    expressions.save(CHECKS / "夏海表情.png")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--references", required=True, type=Path)
    args = parser.parse_args()
    bodies, avatars, metrics = {}, {}, {}
    for person, (height, goal_y, crown_box, center_x, eye, side) in PEOPLE.items():
        base = load_base(person)
        assert base.size == CANVAS
        crown_y = measure_crown(base, crown_box)
        raw_foot = alpha_bbox(base)[3] - 1
        scale = (FOOT_Y - goal_y) / (raw_foot - crown_y)
        assert scale <= 1.5
        origin = (CENTER_X - round(scale * center_x), FOOT_Y - round(scale * raw_foot))
        foot_shift = FOOT_Y - (alpha_bbox(scale_body(base, scale, origin))[3] - 1)
        origin = (origin[0], origin[1] + foot_shift)
        gray = ImageOps.grayscale(base)
        hair_lumas = [np.ravel(np.asarray(gray.crop(rect))) for rect in HAIR_SAMPLES[person]]
        metrics[person] = {
            "height_cm": height, "raw_crown_y": crown_y, "raw_sole_y": raw_foot,
            "scale": round(scale, 6), "x_offset": origin[0], "y_offset": origin[1],
            "target_crown_y": goal_y, "hair_sample_median_gray": int(np.median(np.concatenate(hair_lumas))),
            "eye_line_avatar_y": round((eye[1] - round(eye[1] - 0.42 * side)) * 512 / side),
        }
        labels = EXPRESSIONS if person == "natsumi" else ("平静",)
        base_body = scale_body(base, scale, origin)
        scaled_rect = tuple(round(value * scale) + origin[index % 2] for index, value in enumerate(crown_box))
        metrics[person]["final_crown_y"] = measure_crown(base_body, scaled_rect)
        metrics[person]["final_sole_y"] = alpha_bbox(base_body)[3] - 1
        assert abs(metrics[person]["final_crown_y"] - goal_y) <= 10
        assert metrics[person]["final_sole_y"] == FOOT_Y
        metrics[person]["expressions"] = {}
        for expression in labels:
            raw = base
            if expression != "平静":
                raw, mask = raw_expression(expression, base)
            body = scale_body(raw, scale, origin)
            portrait = avatar(raw, eye, side)
            if expression != "平静":
                affected = mask.getbbox()
                # Lanczos resampling can affect a few pixels outside the mask's source bounds.
                x1, y1, x2, y2 = [round(value * scale) + origin[index % 2] for index, value in enumerate(affected)]
                changed = np.any(np.array(body) != np.array(base_body), axis=2)
                assert np.any(changed), expression
                changed[max(y1 - 4, 0): y2 + 4, max(x1 - 4, 0): x2 + 4] = False
                assert not np.any(changed), expression
                assert np.array_equal(np.asarray(raw)[np.asarray(mask) == 0], np.asarray(base)[np.asarray(mask) == 0])
            key = f"{person}-{expression}"
            body_path = BODIES / f"{key}.png"
            avatar_path = AVATARS / f"{key}.png"
            body.save(body_path)
            portrait.save(avatar_path)
            bodies[person, expression] = body
            avatars[person, expression] = portrait
            metrics[person]["expressions"][expression] = {
                "source_sha256": sha256(ORIGINALS / f"{key}.png"),
                "full_sha256": sha256(body_path), "avatar_sha256": sha256(avatar_path),
            }

    make_check_images(bodies, avatars, args.references)
    for file in (*BODIES.glob("*.png"), *AVATARS.glob("*.png")):
        assert not np.any(key_color_fringe(np.array(Image.open(file)))), file
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
