export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHue(value) {
  return ((value % 360) + 360) % 360;
}

export function hueDistance(a, b) {
  const delta = Math.abs(normalizeHue(a) - normalizeHue(b));
  return Math.min(delta, 360 - delta);
}

export function hexToRgb(hex) {
  const normalized = hex.replace("#", "").trim();
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function rgbToHex({ r, g, b }) {
  const toChannel = (channel) =>
    Math.round(channel).toString(16).padStart(2, "0").toUpperCase();

  return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
}

export function rgbToHsl(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  const lightness = (max + min) / 2;
  let saturation = 0;

  if (delta !== 0) {
    saturation =
      lightness > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);

    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }

    hue *= 60;
  }

  return {
    h: normalizeHue(hue),
    s: saturation,
    l: lightness,
  };
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToRgb(h, s, l) {
  const hue = normalizeHue(h) / 360;
  const saturation = clamp(s, 0, 1);
  const lightness = clamp(l, 0, 1);

  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return { r: channel, g: channel, b: channel };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const hueToRgb = (t) => {
    let value = t;

    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  return {
    r: Math.round(hueToRgb(hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(hue) * 255),
    b: Math.round(hueToRgb(hue - 1 / 3) * 255),
  };
}

export function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l));
}

export function mixHex(sourceHex, targetHex, amount) {
  const ratio = clamp(amount, 0, 1);
  const source = hexToRgb(sourceHex);
  const target = hexToRgb(targetHex);

  return rgbToHex({
    r: source.r + (target.r - source.r) * ratio,
    g: source.g + (target.g - source.g) * ratio,
    b: source.b + (target.b - source.b) * ratio,
  });
}

function srgbToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value) {
  const channel =
    value <= 0.0031308
      ? value * 12.92
      : 1.055 * value ** (1 / 2.4) - 0.055;

  return clamp(Math.round(channel * 255), 0, 255);
}

function rgbToXyz(r, g, b) {
  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);

  return {
    x: red * 0.4124564 + green * 0.3575761 + blue * 0.1804375,
    y: red * 0.2126729 + green * 0.7151522 + blue * 0.072175,
    z: red * 0.0193339 + green * 0.119192 + blue * 0.9503041,
  };
}

function xyzToLab(x, y, z) {
  const refX = 0.95047;
  const refY = 1;
  const refZ = 1.08883;

  const transform = (value) =>
    value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116;

  const fx = transform(x / refX);
  const fy = transform(y / refY);
  const fz = transform(z / refZ);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function labToXyz(l, a, b) {
  const refX = 0.95047;
  const refY = 1;
  const refZ = 1.08883;

  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const invert = (value) => {
    const cubed = value ** 3;
    return cubed > 0.008856 ? cubed : (value - 16 / 116) / 7.787;
  };

  return {
    x: refX * invert(fx),
    y: refY * invert(fy),
    z: refZ * invert(fz),
  };
}

function xyzToRgb(x, y, z) {
  const red = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const green = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const blue = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return {
    r: linearToSrgb(red),
    g: linearToSrgb(green),
    b: linearToSrgb(blue),
  };
}

export function hexToLab(hex) {
  const { r, g, b } = hexToRgb(hex);
  const xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

export function labToLch(lab) {
  const chroma = Math.sqrt(lab.a ** 2 + lab.b ** 2);
  const hue = chroma < 0.00001 ? 0 : normalizeHue((Math.atan2(lab.b, lab.a) * 180) / Math.PI);

  return {
    l: lab.l,
    c: chroma,
    h: hue,
  };
}

export function lchToLab(l, c, h) {
  const hue = normalizeHue(h) * (Math.PI / 180);

  return {
    l,
    a: Math.cos(hue) * c,
    b: Math.sin(hue) * c,
  };
}

export function labToHex(lab) {
  const xyz = labToXyz(lab.l, lab.a, lab.b);
  return rgbToHex(xyzToRgb(xyz.x, xyz.y, xyz.z));
}

export function lchToHex(l, c, h) {
  return labToHex(lchToLab(l, c, h));
}

export function deltaE(firstLab, secondLab) {
  const deltaL = firstLab.l - secondLab.l;
  const deltaA = firstLab.a - secondLab.a;
  const deltaB = firstLab.b - secondLab.b;
  return Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [red, green, blue] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export function getContrastingText(hex) {
  return relativeLuminance(hex) > 0.58 ? "#111111" : "#FBF7F0";
}
