/**
 * pacem v0.9.0-byblos (https://js.pacem.it)
 * Copyright 2020 Pacem (https://pacem.it)
 * Licensed under MIT
 */
var Pacem;
(function (Pacem) {
    const RGB_PATTERN = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
    const RGBA_PATTERN = /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,[\d\.]+\)$/;
    const HEX_PATTERN = /^#[a-f0-9]{6}$/;
    const HEX_SHORT_PATTERN = /^#[a-f0-9]{3}$/;
    ;
    ;
    class Colors {
        static _clampRGB(rgb) {
            const clmp = (n) => Math.min(1.0, Math.max(0, n));
            if (rgb[3] == null) {
                rgb[3] = 1.0;
            }
            return { r: clmp(rgb[0]), g: clmp(rgb[1]), b: clmp(rgb[2]), a: Math.min(1, Math.max(0, rgb[3])) };
        }
        static _normalize(rgb) {
            return [rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0, rgb[3]];
        }
        static parse(clr) {
            clr = (clr || '').toLowerCase();
            if (RGB_PATTERN.test(clr)) {
                let rgbArr = RGB_PATTERN.exec(clr);
                return this._clampRGB(this._normalize([parseInt(rgbArr[1]), parseInt(rgbArr[2]), parseInt(rgbArr[3]), 1]));
            }
            if (RGBA_PATTERN.test(clr)) {
                let rgbArr = RGBA_PATTERN.exec(clr);
                return this._clampRGB(this._normalize([parseInt(rgbArr[1]), parseInt(rgbArr[2]), parseInt(rgbArr[3]), parseFloat(rgbArr[4])]));
            }
            if (HEX_PATTERN.test(clr)) {
                let hex = HEX_PATTERN.exec(clr)[0];
                return this._clampRGB(this._normalize([parseInt('0x' + hex.substr(1, 2)), parseInt('0x' + hex.substr(3, 2)), parseInt('0x' + hex.substr(5, 2)), 1]));
            }
            if (HEX_SHORT_PATTERN.test(clr)) {
                let hex = HEX_SHORT_PATTERN.exec(clr)[0];
                let r = hex.substr(1, 1), g = hex.substr(2, 1), b = hex.substr(3, 1);
                return this._clampRGB(this._normalize([parseInt('0x' + r + r), parseInt('0x' + g + g), parseInt('0x' + b + b), 1]));
            }
        }
        static hue(rgb) {
            const r = rgb.r, g = rgb.g, b = rgb.b;
            return Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI);
        }
        static luminance(rgb) {
            const r = rgb.r, g = rgb.g, b = rgb.b;
            return .5 * (Math.max(r, g, b) + Math.min(r, g, b));
        }
        static saturation(rgb) {
            const l = this.luminance(rgb);
            const r = rgb.r, g = rgb.g, b = rgb.b;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            return (l === 0 || l === 1) ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
        }
        static hsl(rgb) {
            return { h: this.hue(rgb), s: this.saturation(rgb), l: this.luminance(rgb), a: rgb.a };
        }
        static rgb(hsl) {
            const h = hsl.h, s = hsl.s, l = hsl.l, h6 = h / 60.0;
            const C = (1 - Math.abs(2 * l - 1)) * s;
            const X = C * (1 - Math.abs(h6 % 2 - 1));
            const m = l - C / 2;
            const compose = (r, g, b) => this._clampRGB([r + m, g + m, b + m, hsl.a]);
            if (h6 <= 1) {
                return compose(C, X, 0);
            }
            else if (h6 <= 2) {
                return compose(X, C, 0);
            }
            else if (h6 <= 3) {
                return compose(0, C, X);
            }
            else if (h6 <= 4) {
                return compose(0, X, C);
            }
            else if (h6 <= 5) {
                return compose(X, 0, C);
            }
            else if (h6 <= 6) {
                return compose(C, 0, X);
            }
        }
    }
    Pacem.Colors = Colors;
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    const RAD2DEG = 180.0 / Math.PI;
    const RAD_ROUND = 2 * Math.PI;
    const FLOAT_PATTERN = /[-+]?[\d]+(\.[\d]+(e-[\d]+)?)?/g;
    class Geom {
        static parseRect(rect) {
            let reg = rect.match(FLOAT_PATTERN);
            if (reg && reg.length === 4) {
                return { x: parseFloat(reg[0]), y: parseFloat(reg[1]), width: parseFloat(reg[2]), height: parseFloat(reg[3]) };
            }
            throw new Error(`Cannot parse "${rect}" as a valid Rect.`);
        }
        static parsePoint(pt) {
            let reg = pt.match(FLOAT_PATTERN);
            if (reg && reg.length === 2) {
                return { x: parseFloat(reg[0]), y: parseFloat(reg[1]) };
            }
            throw new Error(`Cannot parse "${pt}" as a valid Point.`);
        }
        static distance(p1, p2) {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }
        static subtract(p, from) {
            return { x: from.x - p.x, y: from.y - p.y };
        }
        static add(...points) {
            var point = { x: 0, y: 0 };
            for (var p of points) {
                point.x += p.x;
                point.y += p.y;
            }
            return point;
        }
        static slopeRad(p1, p2) {
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        }
        static slopeRad2(p1, p2) {
            return (RAD_ROUND + Geom.slopeRad(p1, p2)) % RAD_ROUND;
        }
        static slopeDeg(p1, p2) {
            return Geom.slopeRad(p1, p2) * RAD2DEG;
        }
        static slopeDeg2(p1, p2) {
            return (360 + Geom.slopeDeg(p1, p2)) % 360;
        }
    }
    Pacem.Geom = Geom;
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    ;
    class Matrix2D {
        static isIdentity(m) {
            return m.a === 1 && m.d === 1 && m.b === 0 && m.f === 0 && m.c === 0 && m.e === 0;
        }
        static get identity() {
            return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
        }
        static copy(m) {
            return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f };
        }
        static scale(m, sx, sy = sx) {
            return { a: m.a * sx, b: m.b, c: m.c, d: m.d * sy, e: m.e, f: m.f };
        }
        static translate(m, t) {
            return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e + t.x, f: m.f + t.y };
        }
        static multiply(m1, m2) {
            if ("x" in m1 && "y" in m1) {
                if (typeof m2 === 'number') {
                    return { x: m1.x * m2, y: m1.y * m2 };
                }
                else {
                    return { x: m1.x * m2.a + m1.y * m2.c + m2.e, y: m1.x * m2.b + m1.y * m2.d + m2.f };
                }
            }
            if (typeof m2 === 'number') {
                return {
                    a: m1.a * m2, b: m1.b * m2, c: m1.c * m2, d: m1.d * m2, e: m1.e * m2, f: m1.f * m2
                };
            }
            return {
                a: m1.a * m2.a + m1.b * m2.c,
                b: m1.a * m2.b + m1.b * m2.d,
                c: m1.c * m2.a + m1.d * m2.c,
                d: m1.c * m2.b + m1.d * m2.d,
                e: m1.e * m2.a + m1.f * m2.c + m2.e,
                f: m1.e * m2.b + m1.f * m2.d + m2.f
            };
        }
        static det(m) {
            return m.a * m.d - m.c * m.b;
        }
        static invert(m) {
            const det = this.det(m);
            if (det === 0) {
                return null;
            }
            const invdet = 1 / det;
            return this.multiply({
                a: m.d,
                b: -m.c,
                c: -m.b,
                d: m.a,
                e: -m.e * m.d + m.c * m.f,
                f: -m.e * m.b + m.a * m.f
            }, invdet);
        }
    }
    Pacem.Matrix2D = Matrix2D;
})(Pacem || (Pacem = {}));
