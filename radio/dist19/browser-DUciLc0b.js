import { g as A } from "./index-DiyAX3mv.js";
const v = (t, g = 4294967295, f = 79764919) => {
  const c = new Int32Array(256);
  let o, a, e, n = g;
  for (o = 0; o < 256; o++) {
    for (e = o << 24, a = 8; a > 0; --a) e = 2147483648 & e ? e << 1 ^ f : e << 1;
    c[o] = e;
  }
  for (o = 0; o < t.length; o++) n = n << 8 ^ c[255 & (n >> 24 ^ t[o])];
  return n;
}, D = (t, g = v) => {
  const f = (r) => new Uint8Array(r.length / 2).map(((s, m) => parseInt(r.substring(2 * m, 2 * (m + 1)), 16))), c = (r) => f(r)[0], o = /* @__PURE__ */ new Map();
  [, 8364, , 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, , 381, , , 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, , 382, 376].forEach(((r, s) => o.set(r, s)));
  const a = new Uint8Array(t.length);
  let e, n, h, u = !1, d = 0, l = 42, p = t.length > 13 && t.substring(0, 9) === "dynEncode", i = 0;
  p && (i = 11, n = c(t.substring(9, i)), n <= 1 && (i += 2, l = c(t.substring(11, i))), n === 1 && (i += 8, h = ((r) => new DataView(f(r).buffer).getInt32(0, !0))(t.substring(13, i))));
  const E = 256 - l;
  for (let r = i; r < t.length; r++) if (e = t.charCodeAt(r), e !== 61 || u) {
    if (e === 92 && r < t.length - 5 && p) {
      const s = t.charCodeAt(r + 1);
      s !== 117 && s !== 85 || (e = parseInt(t.substring(r + 2, r + 6), 16), r += 5);
    }
    if (e > 255) {
      const s = o.get(e);
      s && (e = s + 127);
    }
    u && (u = !1, e -= 64), a[d++] = e < l && e > 0 ? e + E : e - l;
  } else u = !0;
  const w = a.subarray(0, d);
  if (p && n === 1) {
    const r = g(w);
    if (r !== h) {
      const s = "Decode failed crc32 validation";
      throw console.error("`simple-yenc`\n", s + `
`, "Expected: " + h + "; Got: " + r + `
`, "Visit https://github.com/eshaz/simple-yenc for more information"), Error(s);
    }
  }
  return w;
};
var b, y;
function x() {
  return y || (y = 1, b = Worker), b;
}
var I = x();
const k = /* @__PURE__ */ A(I);
export {
  k as N,
  D as e
};
