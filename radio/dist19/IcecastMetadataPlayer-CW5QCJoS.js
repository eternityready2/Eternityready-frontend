import { I as ca } from "./index-DiyAX3mv.js";
const yi = () => {
};
class bi {
  /**
   * @description Schedules updates up to the millisecond for Icecast Metadata from the response body of an Icecast stream mountpoint
   * @description The accuracy of metadata updates is a direct relationship of the icyMetaInt
   * @param {Object} IcecastMetadataQueue constructor parameter
   * @param {number} [IcecastMetadataQueue.icyBr] Bitrate of audio stream used to increase accuracy when to updating metadata
   * @param {onMetadataUpdate} [IcecastMetadataQueue.onMetadataUpdate] Callback executed when metadata is scheduled to update
   * @param {onMetadataEnqueue} [IcecastMetadataQueue.onMetadataEnqueue] Callback executed when metadata is enqueued
   * @param {boolean} [IcecastMetadataQueue.paused] Set to true to start the queue in a paused mode
   *
   * @callback onMetadataUpdate
   * @param {Object} metadata Object containing all metadata received.
   * @param {string} [metadata.StreamTitle] Title of the metadata update.
   * @param {string} [metadata.StreamUrl] Url (usually album art) of the metadata update.
   * @param {number} timestampOffset Total time buffered when the metadata was added
   * @param {number} timestamp Current time of the audio player when the metadata was added
   *
   * @callback onMetadataEnqueue
   * @param {Object} metadata Object containing all metadata received.
   * @param {string} [metadata.StreamTitle] Title of the metadata update.
   * @param {string} [metadata.StreamUrl] Url (usually album art) of the metadata update.
   * @param {number} timestampOffset Total time buffered when the metadata was added
   * @param {number} timestamp Current time of the audio player when the metadata was added
   *
   */
  constructor({
    icyBr: e,
    onMetadataUpdate: t = yi,
    onMetadataEnqueue: s = yi,
    paused: i = !1
  }) {
    this._icyBr = e, this._onMetadataUpdate = t, this._onMetadataEnqueue = s, this._initialPaused = i, this._paused = i, this._isInitialMetadata = !0, this._pendingMetadata = [], this._metadataQueue = [];
  }
  /**
   * @description Returns the metadata queued for updates
   * @type {{metadata: string, time: number}[]} Queued metadata
   */
  get metadataQueue() {
    return this._metadataQueue.map(({ _timeoutId: e, ...t }) => t);
  }
  /**
   *
   * @param {object} metadata Metadata object returned from IcecastMetadataReader
   * @param {number} timestampOffset Total buffered audio in seconds
   * @param {number} [timestamp] Current time in the audio player
   */
  addMetadata({ metadata: e, stats: t }, s, i = 0) {
    i += t ? this.getTimeByBytes(t.currentStreamPosition) : 0;
    const a = {
      metadata: e,
      timestampOffset: s,
      timestamp: i
    };
    this._paused ? this._pendingMetadata.push(a) : this._enqueueMetadata(a);
  }
  /**
   * @description Calculates audio stream length based on bitrate
   * @param {number} bytesRead Number of bytes
   * @type {number} Seconds
   */
  getTimeByBytes(e) {
    return this._icyBr ? e / (this._icyBr * 125) : 0;
  }
  /**
   * @description Starts the metadata queue if it was paused
   * @param {number} [timestamp] Current time of the audio player
   */
  startQueue(e) {
    this._paused && (this._pendingMetadata.forEach((t) => {
      e !== void 0 && (t.timestamp = e), (e === void 0 || t.timestampOffset >= t.timestamp) && this._enqueueMetadata(t);
    }), this._pendingMetadata = [], this._paused = !1);
  }
  /**
   * @description Clears all metadata updates and empties the queue
   */
  purgeMetadataQueue() {
    this._metadataQueue.forEach((e) => clearTimeout(e._timeoutId)), this._metadataQueue = [], this._pendingMetadata = [], this._paused = this._initialPaused, this._isInitialMetadata = !0;
  }
  _enqueueMetadata(e) {
    this._metadataQueue.push(e), this._onMetadataEnqueue(
      e.metadata,
      e.timestampOffset,
      e.timestamp
    ), this._isInitialMetadata ? (this._dequeueMetadata(), this._isInitialMetadata = !1) : e._timeoutId = setTimeout(
      () => {
        this._dequeueMetadata();
      },
      (e.timestampOffset - e.timestamp) * 1e3
    );
  }
  _dequeueMetadata() {
    if (this._metadataQueue.length) {
      const { metadata: e, timestampOffset: t, timestamp: s } = this._metadataQueue.shift();
      this._onMetadataUpdate(e, t, s);
    }
  }
}
const Q = () => {
}, h = /* @__PURE__ */ new WeakMap(), _ = {
  LOADING: "loading",
  PLAYING: "playing",
  STOPPING: "stopping",
  STOPPED: "stopped",
  RETRYING: "retrying",
  SWITCHING: "switching"
}, l = {
  BUFFER: "buffer",
  PLAY: "play",
  PLAY_READY: "playready",
  // internal
  LOAD: "load",
  STREAM_START: "streamstart",
  STREAM: "stream",
  STREAM_END: "streamend",
  METADATA: "metadata",
  METADATA_ENQUEUE: "metadataenqueue",
  CODEC_UPDATE: "codecupdate",
  STOP: "stop",
  RETRY: "retry",
  RETRY_TIMEOUT: "retrytimeout",
  SWITCH: "switch",
  WARN: "warn",
  ERROR: "error",
  PLAYBACK_ERROR: "playbackerror"
}, J = Symbol(), ts = Symbol(), xt = Symbol(), Hs = Symbol(), be = Symbol(), z = Symbol(), Gs = Symbol(), Lt = Symbol(), Ws = Symbol(), $s = Symbol(), qt = Symbol(), ss = Symbol(), is = Symbol(), as = Symbol(), pt = Symbol(), Ys = Symbol(), kt = Symbol(), gi = Symbol(), ns = Symbol(), S = Symbol(), Si = Symbol(), wi = Symbol(), rs = Symbol(), Bi = Symbol(), zs = Symbol(), Ie = Symbol(), D = Symbol(), Ee = Symbol("synced"), j = Symbol("syncing"), rt = Symbol("pcm_synced"), Pe = Symbol("not_synced"), Ve = (n) => {
  const e = new Uint8Array(
    n.reduce((t, s) => t + s.length, 0)
  );
  return n.reduce((t, s) => (e.set(s, t), t + s.length), 0), e;
};
class oa {
  constructor() {
    this._listeners = [];
  }
  hasEventListener(e, t) {
    return this._listeners.some(
      (s) => s.type === e && s.listener === t
    );
  }
  addEventListener(e, t, s = {}) {
    return this.hasEventListener(e, t) || this._listeners.push({ type: e, listener: t, options: s }), this;
  }
  removeEventListener(e, t) {
    const s = this._listeners.findIndex(
      (i) => i.type === e && i.listener === t
    );
    return s >= 0 && this._listeners.splice(s, 1), this;
  }
  removeEventListeners() {
    return this._listeners = [], this;
  }
  dispatchEvent(e) {
    return this._listeners.filter((t) => t.type === e.type).forEach((t) => {
      const {
        type: s,
        listener: i,
        options: { once: a }
      } = t;
      i.call(this, e), a === !0 && this.removeEventListener(s, i);
    }), this;
  }
}
const P = Symbol, Ui = ", ", p = (() => {
  const n = "front", e = "side", t = "rear", s = "left", i = "center", a = "right";
  return ["", n + " ", e + " ", t + " "].map(
    (r) => [
      [s, a],
      [s, a, i],
      [s, i, a],
      [i, s, a],
      [i]
    ].flatMap((o) => o.map((c) => r + c).join(Ui))
  );
})(), ae = "LFE", ut = "monophonic (mono)", Qe = "stereo", We = "surround", I = (n, ...e) => `${[
  ut,
  Qe,
  `linear ${We}`,
  "quadraphonic",
  `5.0 ${We}`,
  `5.1 ${We}`,
  `6.1 ${We}`,
  `7.1 ${We}`
][n - 1]} (${e.join(Ui)})`, Vs = [
  ut,
  I(2, p[0][0]),
  I(3, p[0][2]),
  I(4, p[1][0], p[3][0]),
  I(5, p[1][2], p[3][0]),
  I(6, p[1][2], p[3][0], ae),
  I(7, p[1][2], p[2][0], p[3][4], ae),
  I(8, p[1][2], p[2][0], p[3][0], ae)
], ua = 192e3, ha = 176400, Fi = 96e3, Ni = 88200, da = 64e3, Ht = 48e3, ei = 44100, ti = 32e3, si = 24e3, ii = 22050, ai = 16e3, Hi = 12e3, Gi = 11025, ni = 8e3, la = 7350, ge = "absoluteGranulePosition", g = "bandwidth", ce = "bitDepth", $ = "bitrate", cs = $ + "Maximum", os = $ + "Minimum", us = $ + "Nominal", ht = "buffer", hs = ht + "Fullness", v = "codec", ne = v + "Frames", ds = "coupledStreamCount", Bt = "crc", Wi = Bt + "16", $i = Bt + "32", L = "data", m = "description", qe = "duration", mt = "emphasis", ls = "hasOpusPadding", pe = "header", Je = "isContinuedPacket", _s = "isCopyrighted", Xe = "isFirstPage", ps = "isHome", Se = "isLastPage", ve = "isOriginal", Oe = "isPrivate", ms = "isVbr", Y = "layer", u = "length", f = "mode", me = f + "Extension", Yi = "mpeg", De = Yi + "Version", fs = "numberAACFrames", ys = "outputGain", It = "preSkip", bs = "profile", gs = P(), Le = "protection", _a = "rawData", fe = "segments", C = "subarray", et = "version", Gt = "vorbis", Ss = Gt + "Comments", ws = Gt + "Setup", Wt = "block", Es = Wt + "ingStrategy", Ps = P(), de = Wt + "Size", je = Wt + "size0", Ke = Wt + "size1", ft = P(), $t = "channel", le = $t + "MappingFamily", Ts = $t + "MappingTable", oe = $t + "Mode", yt = P(), b = $t + "s", zi = "copyright", Cs = zi + "Id", Rs = zi + "IdStart", Te = "frame", xe = Te + "Count", ue = Te + "Length", Yt = "Number", tt = Te + Yt, te = Te + "Padding", y = Te + "Size", Vi = "Rate", As = "inputSample" + Vi, ri = "page", Qt = ri + "Checksum", Ut = P(), Ze = ri + "SegmentTable", B = ri + "Sequence" + Yt, ci = "sample", Ms = ci + Yt, M = ci + Vi, se = P(), T = ci + "s", zt = "stream", xs = zt + "Count", ji = zt + "Info", ke = zt + "Serial" + Yt, pa = zt + "StructureVersion", oi = "total", vt = oi + "BytesOut", Ot = oi + "Duration", js = oi + "Samples", q = P(), re = P(), bt = P(), Vt = P(), Be = P(), Ki = P(), Ei = P(), jt = P(), k = P(), Fe = P(), Ce = P(), dt = P(), Kt = P(), Zi = P(), we = P(), Ue = P(), Ne = P(), Ji = P(), Z = Uint8Array, Zt = DataView, E = "reserved", N = "bad", $e = "free", ui = "none", Xi = "16bit CRC", hi = (n, e, t) => {
  for (let s = 0; s < n[u]; s++) {
    let i = e(s);
    for (let a = 8; a > 0; a--) i = t(i);
    n[s] = i;
  }
  return n;
}, ma = hi(
  new Z(256),
  (n) => n,
  (n) => n & 128 ? 7 ^ n << 1 : n << 1
), R = [
  hi(
    new Uint16Array(256),
    (n) => n << 8,
    (n) => n << 1 ^ (n & 32768 ? 32773 : 0)
  )
], A = [
  hi(
    new Uint32Array(256),
    (n) => n,
    (n) => n >>> 1 ^ (n & 1) * 3988292384
  )
];
for (let n = 0; n < 15; n++) {
  R.push(new Uint16Array(256)), A.push(new Uint32Array(256));
  for (let e = 0; e <= 255; e++)
    R[n + 1][e] = R[0][R[n][e] >>> 8] ^ R[n][e] << 8, A[n + 1][e] = A[n][e] >>> 8 ^ A[0][A[n][e] & 255];
}
const fa = (n) => {
  let e = 0;
  const t = n[u];
  for (let s = 0; s !== t; s++) e = ma[e ^ n[s]];
  return e;
}, ya = (n) => {
  const e = n[u], t = e - 16;
  let s = 0, i = 0;
  for (; i <= t; )
    s ^= n[i++] << 8 | n[i++], s = R[15][s >> 8] ^ R[14][s & 255] ^ R[13][n[i++]] ^ R[12][n[i++]] ^ R[11][n[i++]] ^ R[10][n[i++]] ^ R[9][n[i++]] ^ R[8][n[i++]] ^ R[7][n[i++]] ^ R[6][n[i++]] ^ R[5][n[i++]] ^ R[4][n[i++]] ^ R[3][n[i++]] ^ R[2][n[i++]] ^ R[1][n[i++]] ^ R[0][n[i++]];
  for (; i !== e; )
    s = (s & 255) << 8 ^ R[0][s >> 8 ^ n[i++]];
  return s;
}, ba = (n) => {
  const e = n[u], t = e - 16;
  let s = 0, i = 0;
  for (; i <= t; )
    s = A[15][(n[i++] ^ s) & 255] ^ A[14][(n[i++] ^ s >>> 8) & 255] ^ A[13][(n[i++] ^ s >>> 16) & 255] ^ A[12][n[i++] ^ s >>> 24] ^ A[11][n[i++]] ^ A[10][n[i++]] ^ A[9][n[i++]] ^ A[8][n[i++]] ^ A[7][n[i++]] ^ A[6][n[i++]] ^ A[5][n[i++]] ^ A[4][n[i++]] ^ A[3][n[i++]] ^ A[2][n[i++]] ^ A[1][n[i++]] ^ A[0][n[i++]];
  for (; i !== e; )
    s = A[0][(s ^ n[i++]) & 255] ^ s >>> 8;
  return s ^ -1;
}, Ks = (...n) => {
  const e = new Z(
    n.reduce((t, s) => t + s[u], 0)
  );
  return n.reduce((t, s) => (e.set(s, t), t + s[u]), 0), e;
}, Re = (n) => String.fromCharCode(...n), Pi = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15], Ft = (n) => Pi[n & 15] << 4 | Pi[n >> 4];
class ga {
  constructor(e) {
    this._data = e, this._pos = e[u] * 8;
  }
  set position(e) {
    this._pos = e;
  }
  get position() {
    return this._pos;
  }
  read(e) {
    const t = Math.floor(this._pos / 8), s = this._pos % 8;
    return this._pos -= e, (Ft(this._data[t - 1]) << 8) + Ft(this._data[t]) >> 7 - s & 255;
  }
}
const Sa = (n, e) => {
  try {
    return n.getBigInt64(e, !0);
  } catch {
    const t = n.getUint8(e + 7) & 128 ? -1 : 1;
    let s = n.getUint32(e, !0), i = n.getUint32(e + 4, !0);
    return t === -1 && (s = ~s + 1, i = ~i + 1), i > 1048575 && console.warn("This platform does not support BigInt"), t * (s + i * 2 ** 32);
  }
};
class wa {
  constructor(e, t) {
    this._onCodecHeader = e, this._onCodecUpdate = t, this[we]();
  }
  [Ue]() {
    this._isEnabled = !0;
  }
  [we]() {
    this._headerCache = /* @__PURE__ */ new Map(), this._codecUpdateData = /* @__PURE__ */ new WeakMap(), this._codecHeaderSent = !1, this._codecShouldUpdate = !1, this._bitrate = null, this._isEnabled = !1;
  }
  [Zi](e, t) {
    if (this._onCodecUpdate) {
      this._bitrate !== e && (this._bitrate = e, this._codecShouldUpdate = !0);
      const s = this._codecUpdateData.get(
        this._headerCache.get(this._currentHeader)
      );
      this._codecShouldUpdate && s && this._onCodecUpdate(
        {
          bitrate: e,
          ...s
        },
        t
      ), this._codecShouldUpdate = !1;
    }
  }
  [k](e) {
    const t = this._headerCache.get(e);
    return t && this._updateCurrentHeader(e), t;
  }
  [Fe](e, t, s) {
    this._isEnabled && (this._codecHeaderSent || (this._onCodecHeader({ ...t }), this._codecHeaderSent = !0), this._updateCurrentHeader(e), this._headerCache.set(e, t), this._codecUpdateData.set(t, s));
  }
  _updateCurrentHeader(e) {
    this._onCodecUpdate && e !== this._currentHeader && (this._codecShouldUpdate = !0, this._currentHeader = e);
  }
}
const V = /* @__PURE__ */ new WeakMap(), he = /* @__PURE__ */ new WeakMap();
class He {
  constructor(e, t) {
    this._codecParser = e, this._headerCache = t;
  }
  *[Ei]() {
    let e;
    do {
      if (e = yield* this.Frame[Ce](
        this._codecParser,
        this._headerCache,
        0
      ), e) return e;
      this._codecParser[re](1);
    } while (!0);
  }
  /**
   * @description Searches for Frames within bytes containing a sequence of known codec frames.
   * @param {boolean} ignoreNextFrame Set to true to return frames even if the next frame may not exist at the expected location
   * @returns {Frame}
   */
  *[jt](e) {
    let t = yield* this[Ei]();
    const s = he.get(t)[u];
    if (e || this._codecParser._flushing || // check if there is a frame right after this one
    (yield* this.Header[k](
      this._codecParser,
      this._headerCache,
      s
    )))
      return this._headerCache[Ue](), this._codecParser[re](s), this._codecParser[Vt](t), t;
    this._codecParser[Be](
      `Missing ${Te} at ${s} bytes from current position.`,
      `Dropping current ${Te} and trying again.`
    ), this._headerCache[we](), this._codecParser[re](1);
  }
}
class ea {
  constructor(e, t) {
    he.set(this, { [pe]: e }), this[L] = t;
  }
}
class lt extends ea {
  static *[Ce](e, t, s, i, a) {
    const r = yield* e[k](
      s,
      i,
      a
    );
    if (r) {
      const o = V.get(r)[ue], c = V.get(r)[T], d = (yield* s[q](
        o,
        a
      ))[C](0, o);
      return new t(r, d, c);
    } else
      return null;
  }
  constructor(e, t, s) {
    super(e, t), this[pe] = e, this[T] = s, this[qe] = s / e[M] * 1e3, this[tt] = null, this[vt] = null, this[js] = null, this[Ot] = null, he.get(this)[u] = t[u];
  }
}
const qs = "unsynchronizationFlag", Is = "extendedHeaderFlag", Qs = "experimentalFlag", vs = "footerPresent";
class di {
  static *getID3v2Header(e, t, s) {
    const a = {};
    let r = yield* e[q](3, s);
    if (r[0] !== 73 || r[1] !== 68 || r[2] !== 51 || (r = yield* e[q](10, s), a[et] = `id3v2.${r[3]}.${r[4]}`, r[5] & 15) || (a[qs] = !!(r[5] & 128), a[Is] = !!(r[5] & 64), a[Qs] = !!(r[5] & 32), a[vs] = !!(r[5] & 16), r[6] & 128 || r[7] & 128 || r[8] & 128 || r[9] & 128))
      return null;
    const o = r[6] << 21 | r[7] << 14 | r[8] << 7 | r[9];
    return a[u] = 10 + o, new di(a);
  }
  constructor(e) {
    this[et] = e[et], this[qs] = e[qs], this[Is] = e[Is], this[Qs] = e[Qs], this[vs] = e[vs], this[u] = e[u];
  }
}
class _t {
  /**
   * @private
   */
  constructor(e) {
    V.set(this, e), this[ce] = e[ce], this[$] = null, this[b] = e[b], this[oe] = e[oe], this[M] = e[M];
  }
}
const ta = {
  // bits | V1,L1 | V1,L2 | V1,L3 | V2,L1 | V2,L2 & L3
  0: [$e, $e, $e, $e, $e],
  16: [32, 32, 32, 32, 8],
  // 0b00100000: [64,   48,  40,  48,  16,],
  // 0b00110000: [96,   56,  48,  56,  24,],
  // 0b01000000: [128,  64,  56,  64,  32,],
  // 0b01010000: [160,  80,  64,  80,  40,],
  // 0b01100000: [192,  96,  80,  96,  48,],
  // 0b01110000: [224, 112,  96, 112,  56,],
  // 0b10000000: [256, 128, 112, 128,  64,],
  // 0b10010000: [288, 160, 128, 144,  80,],
  // 0b10100000: [320, 192, 160, 160,  96,],
  // 0b10110000: [352, 224, 192, 176, 112,],
  // 0b11000000: [384, 256, 224, 192, 128,],
  // 0b11010000: [416, 320, 256, 224, 144,],
  // 0b11100000: [448, 384, 320, 256, 160,],
  240: [N, N, N, N, N]
}, gt = (n, e, t) => 8 * ((n + t) % e + e) * (1 << (n + t) / e) - 8 * e * (e / 8 | 0);
for (let n = 2; n < 15; n++)
  ta[n << 4] = [
    n * 32,
    //                V1,L1
    gt(n, 4, 0),
    //  V1,L2
    gt(n, 4, -1),
    // V1,L3
    gt(n, 8, 4),
    //  V2,L1
    gt(n, 8, 0)
    //  V2,L2 & L3
  ];
const Ea = 0, Pa = 1, Ta = 2, Ca = 3, Ti = 4, St = "bands ", wt = " to 31", Ci = {
  0: St + 4 + wt,
  16: St + 8 + wt,
  32: St + 12 + wt,
  48: St + 16 + wt
}, _e = "bitrateIndex", st = "v2", Dt = "v1", Et = "Intensity stereo ", Pt = ", MS stereo ", Tt = "on", Ct = "off", Ra = {
  0: Et + Ct + Pt + Ct,
  16: Et + Tt + Pt + Ct,
  32: Et + Ct + Pt + Tt,
  48: Et + Tt + Pt + Tt
}, Os = {
  0: { [m]: E },
  2: {
    [m]: "Layer III",
    [te]: 1,
    [me]: Ra,
    [Dt]: {
      [_e]: Ta,
      [T]: 1152
    },
    [st]: {
      [_e]: Ti,
      [T]: 576
    }
  },
  4: {
    [m]: "Layer II",
    [te]: 1,
    [me]: Ci,
    [T]: 1152,
    [Dt]: {
      [_e]: Pa
    },
    [st]: {
      [_e]: Ti
    }
  },
  6: {
    [m]: "Layer I",
    [te]: 4,
    [me]: Ci,
    [T]: 384,
    [Dt]: {
      [_e]: Ea
    },
    [st]: {
      [_e]: Ca
    }
  }
}, Ds = "MPEG Version ", Ri = "ISO/IEC ", Aa = {
  0: {
    [m]: `${Ds}2.5 (later extension of MPEG 2)`,
    [Y]: st,
    [M]: {
      0: Gi,
      4: Hi,
      8: ni,
      12: E
    }
  },
  8: { [m]: E },
  16: {
    [m]: `${Ds}2 (${Ri}13818-3)`,
    [Y]: st,
    [M]: {
      0: ii,
      4: si,
      8: ai,
      12: E
    }
  },
  24: {
    [m]: `${Ds}1 (${Ri}11172-3)`,
    [Y]: Dt,
    [M]: {
      0: ei,
      4: Ht,
      8: ti,
      12: E
    }
  },
  length: u
}, Ma = {
  0: Xi,
  1: ui
}, xa = {
  0: ui,
  1: "50/15 ms",
  2: E,
  3: "CCIT J.17"
}, Ai = {
  0: { [b]: 2, [m]: Qe },
  64: { [b]: 2, [m]: "joint " + Qe },
  128: { [b]: 2, [m]: "dual channel" },
  192: { [b]: 1, [m]: ut }
};
class ct extends _t {
  static *[k](e, t, s) {
    const i = {}, a = yield* di.getID3v2Header(
      e,
      t,
      s
    );
    a && (yield* e[q](a[u], s), e[re](a[u]));
    const r = yield* e[q](4, s), o = Re(r[C](0, 4)), c = t[k](o);
    if (c) return new ct(c);
    if (r[0] !== 255 || r[1] < 224) return null;
    const d = Aa[r[1] & 24];
    if (d[m] === E) return null;
    const w = r[1] & 6;
    if (Os[w][m] === E) return null;
    const x = {
      ...Os[w],
      ...Os[w][d[Y]]
    };
    if (i[De] = d[m], i[Y] = x[m], i[T] = x[T], i[Le] = Ma[r[1] & 1], i[u] = 4, i[$] = ta[r[2] & 240][x[_e]], i[$] === N || (i[M] = d[M][r[2] & 12], i[M] === E) || (i[te] = r[2] & 2 && x[te], i[Oe] = !!(r[2] & 1), i[ue] = Math.floor(
      125 * i[$] * i[T] / i[M] + i[te]
    ), !i[ue])) return null;
    const U = r[3] & 192;
    if (i[oe] = Ai[U][m], i[b] = Ai[U][b], i[me] = x[me][r[3] & 48], i[_s] = !!(r[3] & 8), i[ve] = !!(r[3] & 4), i[mt] = xa[r[3] & 3], i[mt] === E) return null;
    i[ce] = 16;
    {
      const { length: H, frameLength: G, samples: mi, ...es } = i;
      t[Fe](o, i, es);
    }
    return new ct(i);
  }
  /**
   * @private
   * Call MPEGHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(e) {
    super(e), this[$] = e[$], this[mt] = e[mt], this[te] = e[te], this[_s] = e[_s], this[ve] = e[ve], this[Oe] = e[Oe], this[Y] = e[Y], this[me] = e[me], this[De] = e[De], this[Le] = e[Le];
  }
}
class li extends lt {
  static *[Ce](e, t, s) {
    return yield* super[Ce](
      ct,
      li,
      e,
      t,
      s
    );
  }
  constructor(e, t, s) {
    super(e, t, s);
  }
}
class qa extends He {
  constructor(e, t, s) {
    super(e, t), this.Frame = li, this.Header = ct, s(this[v]);
  }
  get [v]() {
    return Yi;
  }
  *[dt]() {
    return yield* this[jt]();
  }
}
const Ia = {
  0: "MPEG-4",
  8: "MPEG-2"
}, Qa = {
  0: "valid",
  2: N,
  4: N,
  6: N
}, va = {
  0: Xi,
  1: ui
}, Oa = {
  0: "AAC Main",
  64: "AAC LC (Low Complexity)",
  128: "AAC SSR (Scalable Sample Rate)",
  192: "AAC LTP (Long Term Prediction)"
}, Da = {
  0: Fi,
  4: Ni,
  8: da,
  12: Ht,
  16: ei,
  20: ti,
  24: si,
  28: ii,
  32: ai,
  36: Hi,
  40: Gi,
  44: ni,
  48: la,
  52: E,
  56: E,
  60: "frequency is written explicitly"
}, Mi = {
  0: { [b]: 0, [m]: "Defined in AOT Specific Config" },
  /*
  'monophonic (mono)'
  'stereo (left, right)'
  'linear surround (front center, front left, front right)'
  'quadraphonic (front center, front left, front right, rear center)'
  '5.0 surround (front center, front left, front right, rear left, rear right)'
  '5.1 surround (front center, front left, front right, rear left, rear right, LFE)'
  '7.1 surround (front center, front left, front right, side left, side right, rear left, rear right, LFE)'
  */
  64: { [b]: 1, [m]: ut },
  128: { [b]: 2, [m]: I(2, p[0][0]) },
  192: { [b]: 3, [m]: I(3, p[1][3]) },
  256: { [b]: 4, [m]: I(4, p[1][3], p[3][4]) },
  320: { [b]: 5, [m]: I(5, p[1][3], p[3][0]) },
  384: { [b]: 6, [m]: I(6, p[1][3], p[3][0], ae) },
  448: { [b]: 8, [m]: I(8, p[1][3], p[2][0], p[3][0], ae) }
};
class Jt extends _t {
  static *[k](e, t, s) {
    const i = {}, a = yield* e[q](7, s), r = Re([
      a[0],
      a[1],
      a[2],
      a[3] & 252 | a[6] & 3
      // frame length, buffer fullness varies so don't cache it
    ]), o = t[k](r);
    if (o)
      Object.assign(i, o);
    else {
      if (a[0] !== 255 || a[1] < 240 || (i[De] = Ia[a[1] & 8], i[Y] = Qa[a[1] & 6], i[Y] === N)) return null;
      const d = a[1] & 1;
      i[Le] = va[d], i[u] = d ? 7 : 9, i[gs] = a[2] & 192, i[se] = a[2] & 60;
      const w = a[2] & 2;
      if (i[bs] = Oa[i[gs]], i[M] = Da[i[se]], i[M] === E) return null;
      i[Oe] = !!w, i[yt] = (a[2] << 8 | a[3]) & 448, i[oe] = Mi[i[yt]][m], i[b] = Mi[i[yt]][b], i[ve] = !!(a[3] & 32), i[ps] = !!(a[3] & 8), i[Cs] = !!(a[3] & 8), i[Rs] = !!(a[3] & 4), i[ce] = 16, i[T] = 1024, i[fs] = a[6] & 3;
      {
        const {
          length: x,
          channelModeBits: U,
          profileBits: H,
          sampleRateBits: G,
          frameLength: mi,
          samples: es,
          numberAACFrames: fi,
          ...ra
        } = i;
        t[Fe](r, i, ra);
      }
    }
    if (i[ue] = (a[3] << 11 | a[4] << 3 | a[5] >> 5) & 8191, !i[ue]) return null;
    const c = (a[5] << 6 | a[6] >> 2) & 2047;
    return i[hs] = c === 2047 ? "VBR" : c, new Jt(i);
  }
  /**
   * @private
   * Call AACHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(e) {
    super(e), this[Cs] = e[Cs], this[Rs] = e[Rs], this[hs] = e[hs], this[ps] = e[ps], this[ve] = e[ve], this[Oe] = e[Oe], this[Y] = e[Y], this[u] = e[u], this[De] = e[De], this[fs] = e[fs], this[bs] = e[bs], this[Le] = e[Le];
  }
  get audioSpecificConfig() {
    const e = V.get(this), t = e[gs] + 64 << 5 | e[se] << 5 | e[yt] >> 3, s = new Z(2);
    return new Zt(s[ht]).setUint16(0, t, !1), s;
  }
}
class _i extends lt {
  static *[Ce](e, t, s) {
    return yield* super[Ce](
      Jt,
      _i,
      e,
      t,
      s
    );
  }
  constructor(e, t, s) {
    super(e, t, s);
  }
}
class La extends He {
  constructor(e, t, s) {
    super(e, t), this.Frame = _i, this.Header = Jt, s(this[v]);
  }
  get [v]() {
    return "aac";
  }
  *[dt]() {
    return yield* this[jt]();
  }
}
class ye extends lt {
  static _getFrameFooterCrc16(e) {
    return (e[e[u] - 2] << 8) + e[e[u] - 1];
  }
  // check frame footer crc
  // https://xiph.org/flac/format.html#frame_footer
  static [Ji](e) {
    const t = ye._getFrameFooterCrc16(e), s = ya(e[C](0, -2));
    return t === s;
  }
  constructor(e, t, s) {
    t[ji] = s, t[Wi] = ye._getFrameFooterCrc16(e), super(t, e, V.get(t)[T]);
  }
}
const sa = "get from STREAMINFO metadata block", ka = {
  0: "Fixed",
  1: "Variable"
}, ia = {
  0: E,
  16: 192
  // 0b00100000: 576,
  // 0b00110000: 1152,
  // 0b01000000: 2304,
  // 0b01010000: 4608,
  // 0b01100000: "8-bit (blocksize-1) from end of header",
  // 0b01110000: "16-bit (blocksize-1) from end of header",
  // 0b10000000: 256,
  // 0b10010000: 512,
  // 0b10100000: 1024,
  // 0b10110000: 2048,
  // 0b11000000: 4096,
  // 0b11010000: 8192,
  // 0b11100000: 16384,
  // 0b11110000: 32768,
};
for (let n = 2; n < 16; n++)
  ia[n << 4] = n < 6 ? 576 * 2 ** (n - 2) : 2 ** n;
const Ba = {
  0: sa,
  1: Ni,
  2: ha,
  3: ua,
  4: ni,
  5: ai,
  6: ii,
  7: si,
  8: ti,
  9: ei,
  10: Ht,
  11: Fi,
  // 0b00001100: "8-bit sample rate (in kHz) from end of header",
  // 0b00001101: "16-bit sample rate (in Hz) from end of header",
  // 0b00001110: "16-bit sample rate (in tens of Hz) from end of header",
  15: N
}, Ua = {
  /*'
  'monophonic (mono)'
  'stereo (left, right)'
  'linear surround (left, right, center)'
  'quadraphonic (front left, front right, rear left, rear right)'
  '5.0 surround (front left, front right, front center, rear left, rear right)'
  '5.1 surround (front left, front right, front center, LFE, rear left, rear right)'
  '6.1 surround (front left, front right, front center, LFE, rear center, side left, side right)'
  '7.1 surround (front left, front right, front center, LFE, rear left, rear right, side left, side right)'
  */
  0: { [b]: 1, [m]: ut },
  16: { [b]: 2, [m]: I(2, p[0][0]) },
  32: { [b]: 3, [m]: I(3, p[0][1]) },
  48: { [b]: 4, [m]: I(4, p[1][0], p[3][0]) },
  64: { [b]: 5, [m]: I(5, p[1][1], p[3][0]) },
  80: { [b]: 6, [m]: I(6, p[1][1], ae, p[3][0]) },
  96: { [b]: 7, [m]: I(7, p[1][1], ae, p[3][4], p[2][0]) },
  112: { [b]: 8, [m]: I(8, p[1][1], ae, p[3][0], p[2][0]) },
  128: { [b]: 2, [m]: `${Qe} (left, diff)` },
  144: { [b]: 2, [m]: `${Qe} (diff, right)` },
  160: { [b]: 2, [m]: `${Qe} (avg, diff)` },
  176: E,
  192: E,
  208: E,
  224: E,
  240: E
}, Fa = {
  0: sa,
  2: 8,
  4: 12,
  6: E,
  8: 16,
  10: 20,
  12: 24,
  14: E
};
class ie extends _t {
  // https://datatracker.ietf.org/doc/html/rfc3629#section-3
  //    Char. number range  |        UTF-8 octet sequence
  //    (hexadecimal)    |              (binary)
  // --------------------+---------------------------------------------
  // 0000 0000-0000 007F | 0xxxxxxx
  // 0000 0080-0000 07FF | 110xxxxx 10xxxxxx
  // 0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
  // 0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
  static _decodeUTF8Int(e) {
    if (e[0] > 254)
      return null;
    if (e[0] < 128) return { value: e[0], length: 1 };
    let t = 1;
    for (let r = 64; r & e[0]; r >>= 1) t++;
    let s = t - 1, i = 0, a = 0;
    for (; s > 0; a += 6, s--) {
      if ((e[s] & 192) !== 128)
        return null;
      i |= (e[s] & 63) << a;
    }
    return i |= (e[s] & 127 >> t) << a, { value: i, length: t };
  }
  static [Ne](e, t) {
    const s = {
      [q]: function* () {
        return e;
      }
    };
    return ie[k](s, t, 0).next().value;
  }
  static *[k](e, t, s) {
    let i = yield* e[q](6, s);
    if (i[0] !== 255 || !(i[1] === 248 || i[1] === 249))
      return null;
    const a = {}, r = Re(i[C](0, 4)), o = t[k](r);
    if (o)
      Object.assign(a, o);
    else {
      if (a[Ps] = i[1] & 1, a[Es] = ka[a[Ps]], a[ft] = i[2] & 240, a[se] = i[2] & 15, a[de] = ia[a[ft]], a[de] === E || (a[M] = Ba[a[se]], a[M] === N) || i[3] & 1)
        return null;
      const d = Ua[i[3] & 240];
      if (d === E || (a[b] = d[b], a[oe] = d[m], a[ce] = Fa[i[3] & 14], a[ce] === E))
        return null;
    }
    a[u] = 5, i = yield* e[q](a[u] + 8, s);
    const c = ie._decodeUTF8Int(i[C](4));
    if (!c || (a[Ps] ? a[Ms] = c.value : a[tt] = c.value, a[u] += c[u], a[ft] === 96 ? (i[u] < a[u] && (i = yield* e[q](a[u], s)), a[de] = i[a[u] - 1] + 1, a[u] += 1) : a[ft] === 112 && (i[u] < a[u] && (i = yield* e[q](a[u], s)), a[de] = (i[a[u] - 1] << 8) + i[a[u]] + 1, a[u] += 2), a[T] = a[de], a[se] === 12 ? (i[u] < a[u] && (i = yield* e[q](a[u], s)), a[M] = i[a[u] - 1] * 1e3, a[u] += 1) : a[se] === 13 ? (i[u] < a[u] && (i = yield* e[q](a[u], s)), a[M] = (i[a[u] - 1] << 8) + i[a[u]], a[u] += 2) : a[se] === 14 && (i[u] < a[u] && (i = yield* e[q](a[u], s)), a[M] = ((i[a[u] - 1] << 8) + i[a[u]]) * 10, a[u] += 2), i[u] < a[u] && (i = yield* e[q](a[u], s)), a[Bt] = i[a[u] - 1], a[Bt] !== fa(i[C](0, a[u] - 1))))
      return null;
    if (!o) {
      const {
        blockingStrategyBits: d,
        frameNumber: w,
        sampleNumber: x,
        samples: U,
        sampleRateBits: H,
        blockSizeBits: G,
        crc: mi,
        length: es,
        ...fi
      } = a;
      t[Fe](r, a, fi);
    }
    return new ie(a);
  }
  /**
   * @private
   * Call FLACHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(e) {
    super(e), this[Wi] = null, this[Es] = e[Es], this[de] = e[de], this[tt] = e[tt], this[Ms] = e[Ms], this[ji] = null;
  }
}
const Na = 2, Ha = 512 * 1024;
class aa extends He {
  constructor(e, t, s) {
    super(e, t), this.Frame = ye, this.Header = ie, s(this[v]);
  }
  get [v]() {
    return "flac";
  }
  *_getNextFrameSyncOffset(e) {
    const t = yield* this._codecParser[q](2, 0), s = t[u] - 2;
    for (; e < s; ) {
      if (t[e] === 255) {
        const a = t[e + 1];
        if (a === 248 || a === 249) break;
        a !== 255 && e++;
      }
      e++;
    }
    return e;
  }
  *[dt]() {
    do {
      const e = yield* ie[k](
        this._codecParser,
        this._headerCache,
        0
      );
      if (e) {
        let t = V.get(e)[u] + Na;
        for (; t <= Ha; ) {
          if (this._codecParser._flushing || (yield* ie[k](
            this._codecParser,
            this._headerCache,
            t
          ))) {
            let s = yield* this._codecParser[q](t);
            if (this._codecParser._flushing || (s = s[C](0, t)), ye[Ji](s)) {
              const i = new ye(s, e);
              return this._headerCache[Ue](), this._codecParser[re](t), this._codecParser[Vt](i), i;
            }
          }
          t = yield* this._getNextFrameSyncOffset(
            t + 1
          );
        }
        this._codecParser[Be](
          `Unable to sync FLAC frame after searching ${t} bytes.`
        ), this._codecParser[re](t);
      } else
        this._codecParser[re](
          yield* this._getNextFrameSyncOffset(1)
        );
    } while (!0);
  }
  [Kt](e) {
    return e[B] === 0 ? (this._headerCache[Ue](), this._streamInfo = e[L][C](13)) : e[B] === 1 || (e[ne] = he.get(e)[fe].map((t) => {
      const s = ie[Ne](
        t,
        this._headerCache
      );
      if (s)
        return new ye(t, s, this._streamInfo);
      this._codecParser[Be](
        "Failed to parse Ogg FLAC frame",
        "Skipping invalid FLAC frame"
      );
    }).filter((t) => !!t)), e;
  }
}
class Xt {
  static *[k](e, t, s) {
    const i = {};
    let a = yield* e[q](28, s);
    if (a[0] !== 79 || // O
    a[1] !== 103 || // g
    a[2] !== 103 || // g
    a[3] !== 83 || (i[pa] = a[4], a[5] & 248)) return null;
    i[Se] = !!(a[5] & 4), i[Xe] = !!(a[5] & 2), i[Je] = !!(a[5] & 1);
    const o = new Zt(Z.from(a[C](0, 28))[ht]);
    i[ge] = Sa(o, 6), i[ke] = o.getInt32(14, !0), i[B] = o.getInt32(18, !0), i[Qt] = o.getInt32(22, !0);
    const c = a[26];
    i[u] = c + 27, a = yield* e[q](i[u], s), i[ue] = 0, i[Ze] = [], i[Ut] = Z.from(
      a[C](27, i[u])
    );
    for (let d = 0, w = 0; d < c; d++) {
      const x = i[Ut][d];
      i[ue] += x, w += x, (x !== 255 || d === c - 1) && (i[Ze].push(w), w = 0);
    }
    return new Xt(i);
  }
  /**
   * @private
   * Call OggPageHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(e) {
    V.set(this, e), this[ge] = e[ge], this[Je] = e[Je], this[Xe] = e[Xe], this[Se] = e[Se], this[Ze] = e[Ze], this[B] = e[B], this[Qt] = e[Qt], this[ke] = e[ke];
  }
}
class pi extends ea {
  static *[Ce](e, t, s) {
    const i = yield* Xt[k](
      e,
      t,
      s
    );
    if (i) {
      const a = V.get(i)[ue], r = V.get(i)[u], o = r + a, c = (yield* e[q](o, 0))[C](0, o), d = c[C](r, o);
      return new pi(i, d, c);
    } else
      return null;
  }
  constructor(e, t, s) {
    super(e, t), he.get(this)[u] = s[u], this[ne] = [], this[_a] = s, this[ge] = e[ge], this[$i] = e[Qt], this[qe] = 0, this[Je] = e[Je], this[Xe] = e[Xe], this[Se] = e[Se], this[B] = e[B], this[T] = 0, this[ke] = e[ke];
  }
}
class xi extends lt {
  constructor(e, t, s) {
    super(t, e, s);
  }
}
const qi = {
  0: Vs.slice(0, 2),
  /*
  0: "monophonic (mono)"
  1: "stereo (left, right)"
  */
  1: Vs
  /*
  0: "monophonic (mono)"
  1: "stereo (left, right)"
  2: "linear surround (left, center, right)"
  3: "quadraphonic (front left, front right, rear left, rear right)"
  4: "5.0 surround (front left, front center, front right, rear left, rear right)"
  5: "5.1 surround (front left, front center, front right, rear left, rear right, LFE)"
  6: "6.1 surround (front left, front center, front right, side left, side right, rear center, LFE)"
  7: "7.1 surround (front left, front center, front right, side left, side right, rear left, rear right, LFE)"
  */
  // additional channel mappings are user defined
}, F = "SILK-only", O = "CELT-only", Rt = "Hybrid", X = "narrowband", At = "medium-band", ee = "wideband", Ae = "super-wideband", Me = "fullband", Ga = {
  0: { [f]: F, [g]: X, [y]: 10 },
  8: { [f]: F, [g]: X, [y]: 20 },
  16: { [f]: F, [g]: X, [y]: 40 },
  24: { [f]: F, [g]: X, [y]: 60 },
  32: { [f]: F, [g]: At, [y]: 10 },
  40: { [f]: F, [g]: At, [y]: 20 },
  48: { [f]: F, [g]: At, [y]: 40 },
  56: { [f]: F, [g]: At, [y]: 60 },
  64: { [f]: F, [g]: ee, [y]: 10 },
  72: { [f]: F, [g]: ee, [y]: 20 },
  80: { [f]: F, [g]: ee, [y]: 40 },
  88: { [f]: F, [g]: ee, [y]: 60 },
  96: { [f]: Rt, [g]: Ae, [y]: 10 },
  104: { [f]: Rt, [g]: Ae, [y]: 20 },
  112: { [f]: Rt, [g]: Me, [y]: 10 },
  120: { [f]: Rt, [g]: Me, [y]: 20 },
  128: { [f]: O, [g]: X, [y]: 2.5 },
  136: { [f]: O, [g]: X, [y]: 5 },
  144: { [f]: O, [g]: X, [y]: 10 },
  152: { [f]: O, [g]: X, [y]: 20 },
  160: { [f]: O, [g]: ee, [y]: 2.5 },
  168: { [f]: O, [g]: ee, [y]: 5 },
  176: { [f]: O, [g]: ee, [y]: 10 },
  184: { [f]: O, [g]: ee, [y]: 20 },
  192: { [f]: O, [g]: Ae, [y]: 2.5 },
  200: { [f]: O, [g]: Ae, [y]: 5 },
  208: { [f]: O, [g]: Ae, [y]: 10 },
  216: { [f]: O, [g]: Ae, [y]: 20 },
  224: { [f]: O, [g]: Me, [y]: 2.5 },
  232: { [f]: O, [g]: Me, [y]: 5 },
  240: { [f]: O, [g]: Me, [y]: 10 },
  248: { [f]: O, [g]: Me, [y]: 20 }
};
class ot extends _t {
  static [Ne](e, t, s) {
    const i = {};
    if (i[b] = e[9], i[le] = e[18], i[u] = i[le] !== 0 ? 21 + i[b] : 19, e[u] < i[u])
      throw new Error("Out of data while inside an Ogg Page");
    const a = t[0] & 3, r = a === 3 ? 2 : 1, o = Re(e[C](0, i[u])) + Re(t[C](0, r)), c = s[k](o);
    if (c) return new ot(c);
    if (o.substr(0, 8) !== "OpusHead" || e[8] !== 1) return null;
    i[L] = Z.from(e[C](0, i[u]));
    const d = new Zt(i[L][ht]);
    if (i[ce] = 16, i[It] = d.getUint16(10, !0), i[As] = d.getUint32(12, !0), i[M] = Ht, i[ys] = d.getInt16(16, !0), i[le] in qi && (i[oe] = qi[i[le]][i[b] - 1], !i[oe]))
      return null;
    i[le] !== 0 && (i[xs] = e[19], i[ds] = e[20], i[Ts] = [
      ...e[C](21, i[b] + 21)
    ]);
    const w = Ga[248 & t[0]];
    switch (i[f] = w[f], i[g] = w[g], i[y] = w[y], a) {
      case 0:
        i[xe] = 1;
        break;
      case 1:
      // 1: 2 frames in the packet, each with equal compressed size
      case 2:
        i[xe] = 2;
        break;
      case 3:
        i[ms] = !!(128 & t[1]), i[ls] = !!(64 & t[1]), i[xe] = 63 & t[1];
        break;
      default:
        return null;
    }
    {
      const {
        length: x,
        data: U,
        channelMappingFamily: H,
        ...G
      } = i;
      s[Fe](o, i, G);
    }
    return new ot(i);
  }
  /**
   * @private
   * Call OpusHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(e) {
    super(e), this[L] = e[L], this[g] = e[g], this[le] = e[le], this[Ts] = e[Ts], this[ds] = e[ds], this[xe] = e[xe], this[y] = e[y], this[ls] = e[ls], this[As] = e[As], this[ms] = e[ms], this[f] = e[f], this[ys] = e[ys], this[It] = e[It], this[xs] = e[xs];
  }
}
class Wa extends He {
  constructor(e, t, s) {
    super(e, t), this.Frame = xi, this.Header = ot, s(this[v]), this._identificationHeader = null, this._preSkipRemaining = null;
  }
  get [v]() {
    return "opus";
  }
  /**
   * @todo implement continued page support
   */
  [Kt](e) {
    return e[B] === 0 ? (this._headerCache[Ue](), this._identificationHeader = e[L]) : e[B] === 1 || (e[ne] = he.get(e)[fe].map((t) => {
      const s = ot[Ne](
        this._identificationHeader,
        t,
        this._headerCache
      );
      if (s) {
        this._preSkipRemaining === null && (this._preSkipRemaining = s[It]);
        let i = s[y] * s[xe] / 1e3 * s[M];
        return this._preSkipRemaining > 0 && (this._preSkipRemaining -= i, i = this._preSkipRemaining < 0 ? -this._preSkipRemaining : 0), new xi(t, s, i);
      }
      this._codecParser[Ki](
        "Failed to parse Ogg Opus Header",
        "Not a valid Ogg Opus file"
      );
    })), e;
  }
}
class Ii extends lt {
  constructor(e, t, s) {
    super(t, e, s);
  }
}
const Zs = {
  // 0b0110: 64,
  // 0b0111: 128,
  // 0b1000: 256,
  // 0b1001: 512,
  // 0b1010: 1024,
  // 0b1011: 2048,
  // 0b1100: 4096,
  // 0b1101: 8192
};
for (let n = 0; n < 8; n++) Zs[n + 6] = 2 ** (6 + n);
class Nt extends _t {
  static [Ne](e, t, s, i) {
    if (e[u] < 30)
      throw new Error("Out of data while inside an Ogg Page");
    const a = Re(e[C](0, 30)), r = t[k](a);
    if (r) return new Nt(r);
    const o = { [u]: 30 };
    if (a.substr(0, 7) !== "vorbis")
      return null;
    o[L] = Z.from(e[C](0, 30));
    const c = new Zt(o[L][ht]);
    if (o[et] = c.getUint32(7, !0), o[et] !== 0 || (o[b] = e[11], o[oe] = Vs[o[b] - 1] || "application defined", o[M] = c.getUint32(12, !0), o[cs] = c.getInt32(16, !0), o[us] = c.getInt32(20, !0), o[os] = c.getInt32(24, !0), o[Ke] = Zs[(e[28] & 240) >> 4], o[je] = Zs[e[28] & 15], o[je] > o[Ke]) || e[29] !== 1) return null;
    o[ce] = 32, o[ws] = i, o[Ss] = s;
    {
      const {
        length: d,
        data: w,
        version: x,
        vorbisSetup: U,
        vorbisComments: H,
        ...G
      } = o;
      t[Fe](a, o, G);
    }
    return new Nt(o);
  }
  /**
   * @private
   * Call VorbisHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(e) {
    super(e), this[cs] = e[cs], this[os] = e[os], this[us] = e[us], this[je] = e[je], this[Ke] = e[Ke], this[L] = e[L], this[Ss] = e[Ss], this[ws] = e[ws];
  }
}
class $a extends He {
  constructor(e, t, s) {
    super(e, t), this.Frame = Ii, s(this[v]), this._identificationHeader = null, this._setupComplete = !1, this._prevBlockSize = null;
  }
  get [v]() {
    return Gt;
  }
  [Kt](e) {
    e[ne] = [];
    for (const t of he.get(e)[fe])
      if (t[0] === 1)
        this._headerCache[Ue](), this._identificationHeader = e[L], this._setupComplete = !1;
      else if (t[0] === 3)
        this._vorbisComments = t;
      else if (t[0] === 5)
        this._vorbisSetup = t, this._mode = this._parseSetupHeader(t), this._setupComplete = !0;
      else if (this._setupComplete) {
        const s = Nt[Ne](
          this._identificationHeader,
          this._headerCache,
          this._vorbisComments,
          this._vorbisSetup
        );
        s ? e[ne].push(
          new Ii(
            t,
            s,
            this._getSamples(t, s)
          )
        ) : this._codecParser[logError](
          "Failed to parse Ogg Vorbis Header",
          "Not a valid Ogg Vorbis file"
        );
      }
    return e;
  }
  _getSamples(e, t) {
    const i = this._mode.blockFlags[e[0] >> 1 & this._mode.mask] ? t[Ke] : t[je], a = this._prevBlockSize === null ? 0 : (this._prevBlockSize + i) / 4;
    return this._prevBlockSize = i, a;
  }
  // https://gitlab.xiph.org/xiph/liboggz/-/blob/master/src/liboggz/oggz_auto.c#L911
  // https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/vorbis_parser.c
  /*
   * This is the format of the mode data at the end of the packet for all
   * Vorbis Version 1 :
   *
   * [ 6:number_of_modes ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:framing(1) ]
   *
   * e.g.:
   *
   * MsB         LsB
   *              <-
   * 0 0 0 0 0 1 0 0
   * 0 0 1 0 0 0 0 0
   * 0 0 1 0 0 0 0 0
   * 0 0 1|0 0 0 0 0
   * 0 0 0 0|0|0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 0 0|0 0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 0 0|0 0 0 0
   * 0 0 0|1|0 0 0 0 |
   * 0 0 0 0 0 0 0 0 V
   * 0 0 0|0 0 0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0|1 0 0 0 0 0
   *
   * The simplest way to approach this is to start at the end
   * and read backwards to determine the mode configuration.
   *
   * liboggz and ffmpeg both use this method.
   */
  _parseSetupHeader(e) {
    const t = new ga(e), s = {
      count: 0,
      blockFlags: []
    };
    for (; (t.read(1) & 1) !== 1; )
      ;
    let i;
    for (; s.count < 64 && t.position > 0; ) {
      Ft(t.read(8));
      let a = 0;
      for (; t.read(8) === 0 && a++ < 3; )
        ;
      if (a === 4)
        i = t.read(7), s.blockFlags.unshift(i & 1), t.position += 6, s.count++;
      else {
        ((Ft(i) & 126) >> 1) + 1 !== s.count && this._codecParser[Be](
          "vorbis derived mode count did not match actual mode count"
        );
        break;
      }
    }
    return s.mask = (1 << Math.log2(s.count)) - 1, s;
  }
}
class Ya {
  constructor(e, t, s) {
    this._codecParser = e, this._headerCache = t, this._onCodec = s, this._continuedPacket = new Z(), this._codec = null, this._isSupported = null, this._previousAbsoluteGranulePosition = null;
  }
  get [v]() {
    return this._codec || "";
  }
  _updateCodec(e, t) {
    this._codec !== e && (this._headerCache[we](), this._parser = new t(
      this._codecParser,
      this._headerCache,
      this._onCodec
    ), this._codec = e);
  }
  _checkCodecSupport({ data: e }) {
    const t = Re(e[C](0, 8));
    switch (t) {
      case "fishead\0":
        return !1;
      // ignore ogg skeleton packets
      case "OpusHead":
        return this._updateCodec("opus", Wa), !0;
      case (/^\x7fFLAC/.test(t) && t):
        return this._updateCodec("flac", aa), !0;
      case (/^\x01vorbis/.test(t) && t):
        return this._updateCodec(Gt, $a), !0;
      default:
        return !1;
    }
  }
  _checkPageSequenceNumber(e) {
    e[B] !== this._pageSequenceNumber + 1 && this._pageSequenceNumber > 1 && e[B] > 1 && this._codecParser[Be](
      "Unexpected gap in Ogg Page Sequence Number.",
      `Expected: ${this._pageSequenceNumber + 1}, Got: ${e[B]}`
    ), this._pageSequenceNumber = e[B];
  }
  _parsePage(e) {
    this._isSupported === null && (this._pageSequenceNumber = e[B], this._isSupported = this._checkCodecSupport(e)), this._checkPageSequenceNumber(e);
    const t = he.get(e), s = V.get(t[pe]);
    let i = 0;
    if (t[fe] = s[Ze].map(
      (a) => e[L][C](i, i += a)
    ), this._continuedPacket[u] && (t[fe][0] = Ks(
      this._continuedPacket,
      t[fe][0]
    ), this._continuedPacket = new Z()), s[Ut][s[Ut][u] - 1] === 255 && (this._continuedPacket = Ks(
      this._continuedPacket,
      t[fe].pop()
    )), this._previousAbsoluteGranulePosition !== null && (e[T] = Number(
      e[ge] - this._previousAbsoluteGranulePosition
    )), this._previousAbsoluteGranulePosition = e[ge], this._isSupported) {
      const a = this._parser[Kt](e);
      return this._codecParser[Vt](a), a;
    } else
      return e;
  }
}
class za extends He {
  constructor(e, t, s) {
    super(e, t), this._onCodec = s, this.Frame = pi, this.Header = Xt, this._streams = /* @__PURE__ */ new Map(), this._currentSerialNumber = null;
  }
  get [v]() {
    const e = this._streams.get(this._currentSerialNumber);
    return e ? e.codec : "";
  }
  *[dt]() {
    const e = yield* this[jt](!0);
    this._currentSerialNumber = e[ke];
    let t = this._streams.get(this._currentSerialNumber);
    return t || (t = new Ya(
      this._codecParser,
      this._headerCache,
      this._onCodec
    ), this._streams.set(this._currentSerialNumber, t)), e[Se] && this._streams.delete(this._currentSerialNumber), t._parsePage(e);
  }
}
const Ls = () => {
};
class Va {
  constructor(e, {
    onCodec: t,
    onCodecHeader: s,
    onCodecUpdate: i,
    enableLogging: a = !1,
    enableFrameCRC32: r = !0
  } = {}) {
    this._inputMimeType = e, this._onCodec = t || Ls, this._onCodecHeader = s || Ls, this._onCodecUpdate = i, this._enableLogging = a, this._crc32 = r ? ba : Ls, this[we]();
  }
  /**
   * @public
   * @returns The detected codec
   */
  get [v]() {
    return this._parser ? this._parser[v] : "";
  }
  [we]() {
    this._headerCache = new wa(
      this._onCodecHeader,
      this._onCodecUpdate
    ), this._generator = this._getGenerator(), this._generator.next();
  }
  /**
   * @public
   * @description Generator function that yields any buffered CodecFrames and resets the CodecParser
   * @returns {Iterable<CodecFrame|OggPage>} Iterator that operates over the codec data.
   * @yields {CodecFrame|OggPage} Parsed codec or ogg page data
   */
  *flush() {
    this._flushing = !0;
    for (let e = this._generator.next(); e.value; e = this._generator.next())
      yield e.value;
    this._flushing = !1, this[we]();
  }
  /**
   * @public
   * @description Generator function takes in a Uint8Array of data and returns a CodecFrame from the data for each iteration
   * @param {Uint8Array} chunk Next chunk of codec data to read
   * @returns {Iterable<CodecFrame|OggPage>} Iterator that operates over the codec data.
   * @yields {CodecFrame|OggPage} Parsed codec or ogg page data
   */
  *parseChunk(e) {
    for (let t = this._generator.next(e); t.value; t = this._generator.next())
      yield t.value;
  }
  /**
   * @public
   * @description Parses an entire file and returns all of the contained frames.
   * @param {Uint8Array} fileData Coded data to read
   * @returns {Array<CodecFrame|OggPage>} CodecFrames
   */
  parseAll(e) {
    return [...this.parseChunk(e), ...this.flush()];
  }
  /**
   * @private
   */
  *_getGenerator() {
    if (this._inputMimeType.match(/aac/))
      this._parser = new La(this, this._headerCache, this._onCodec);
    else if (this._inputMimeType.match(/mpeg/))
      this._parser = new qa(this, this._headerCache, this._onCodec);
    else if (this._inputMimeType.match(/flac/))
      this._parser = new aa(this, this._headerCache, this._onCodec);
    else if (this._inputMimeType.match(/ogg/))
      this._parser = new za(this, this._headerCache, this._onCodec);
    else
      throw new Error(`Unsupported Codec ${mimeType}`);
    for (this._frameNumber = 0, this._currentReadPosition = 0, this._totalBytesIn = 0, this._totalBytesOut = 0, this._totalSamples = 0, this._sampleRate = void 0, this._rawData = new Uint8Array(0); ; ) {
      const e = yield* this._parser[dt]();
      e && (yield e);
    }
  }
  /**
   * @protected
   * @param {number} minSize Minimum bytes to have present in buffer
   * @returns {Uint8Array} rawData
   */
  *[q](e = 0, t = 0) {
    let s;
    for (; this._rawData[u] <= e + t; ) {
      if (s = yield, this._flushing) return this._rawData[C](t);
      s && (this._totalBytesIn += s[u], this._rawData = Ks(this._rawData, s));
    }
    return this._rawData[C](t);
  }
  /**
   * @protected
   * @param {number} increment Bytes to increment codec data
   */
  [re](e) {
    this._currentReadPosition += e, this._rawData = this._rawData[C](e);
  }
  /**
   * @protected
   */
  [bt](e) {
    this._sampleRate = e[pe][M], e[pe][$] = e[qe] > 0 ? Math.round(e[L][u] / e[qe]) * 8 : 0, e[tt] = this._frameNumber++, e[vt] = this._totalBytesOut, e[js] = this._totalSamples, e[Ot] = this._totalSamples / this._sampleRate * 1e3, e[$i] = this._crc32(e[L]), this._headerCache[Zi](
      e[pe][$],
      e[Ot]
    ), this._totalBytesOut += e[L][u], this._totalSamples += e[T];
  }
  /**
   * @protected
   */
  [Vt](e) {
    if (e[ne]) {
      if (e[Se]) {
        let t = e[T];
        e[ne].forEach((s) => {
          const i = s[T];
          t < i && (s[T] = t > 0 ? t : 0, s[qe] = s[T] / s[pe][M] * 1e3), t -= i, this[bt](s);
        });
      } else
        e[T] = 0, e[ne].forEach((t) => {
          e[T] += t[T], this[bt](t);
        });
      e[qe] = e[T] / this._sampleRate * 1e3 || 0, e[js] = this._totalSamples, e[Ot] = this._totalSamples / this._sampleRate * 1e3 || 0, e[vt] = this._totalBytesOut;
    } else
      this[bt](e);
  }
  /**
   * @private
   */
  _log(e, t) {
    if (this._enableLogging) {
      const s = [
        `${v}:         ${this[v]}`,
        `inputMimeType: ${this._inputMimeType}`,
        `readPosition:  ${this._currentReadPosition}`,
        `totalBytesIn:  ${this._totalBytesIn}`,
        `${vt}: ${this._totalBytesOut}`
      ], i = Math.max(...s.map((a) => a[u]));
      t.push(
        `--stats--${"-".repeat(i - 9)}`,
        ...s,
        "-".repeat(i)
      ), e(
        "codec-parser",
        t.reduce((a, r) => a + `
  ` + r, "")
      );
    }
  }
  /**
   * @protected
   */
  [Be](...e) {
    this._log(console.warn, e);
  }
  /**
   * @protected
   */
  [Ki](...e) {
    this._log(console.error, e);
  }
}
let na;
const Js = new Worker(
  URL.createObjectURL(
    new Blob(["self.onmessage = () => self.postMessage(!!self.Worker)"], {
      type: "text/javascript"
    })
  )
);
Js.onmessage = (n) => {
  na = n.data, Js.terminate();
};
Js.postMessage(null);
class ja {
  constructor(e, t) {
    this.CRC_DURATION = 3e5, this.PCM_DURATION = 6e4, this._icecast = e, this._player = t, this.initSync(), this.initQueue();
  }
  initSync() {
    clearTimeout(this._syncTimeout), this._syncTimeout = null, this._syncTimeoutReason = null, this._crcSyncPending = !0, this._syncQueue = [], this._syncQueueDuration = 0, this._synAudioResult = null, this._a = null, this._b = null;
  }
  initQueue() {
    this._queueIndex = 0, this._queueSamples = 0, this._queueSampleRate = 0, this._crcQueue = [], this._crcQueueDuration = 0, this._crcQueueIndexes = {}, this._pcmQueue = [], this._pcmQueueDuration = 0;
  }
  get buffered() {
    return this._queueSamples / this._queueSampleRate - this._player.currentTime || 0;
  }
  add(e) {
    const { crc32: t, duration: s, samples: i } = e;
    this._queueSamples += i, this._queueSampleRate = e.header.sampleRate, this._crcQueue.push({ crc32: t, duration: s }), this._crcQueueDuration += s;
    let a = this._crcQueueIndexes[t];
    if (a || (a = [], this._crcQueueIndexes[t] = a), a.push(this._queueIndex++), this._crcQueueDuration >= this.CRC_DURATION) {
      const { crc32: r, duration: o } = this._crcQueue.shift();
      this._crcQueueDuration -= o;
      const c = this._crcQueueIndexes[r];
      c.shift(), c.length || delete this._crcQueueIndexes[r];
    }
    this._pcmQueue.push(e), this._pcmQueueDuration += s, this._pcmQueueDuration >= this.PCM_DURATION && (this._pcmQueueDuration -= this._pcmQueue.shift().duration);
  }
  addAll(e) {
    e.forEach((t) => this.add(t));
  }
  _addAllSyncQueue(e) {
    for (const t of e)
      this._syncQueueDuration += t.duration, this._syncQueue.push(t);
  }
  /**
   *
   * @param {Array<CodecFrame|OggPage>} frames
   */
  async sync(e) {
    if (this._syncTimeout === null) {
      const t = this.buffered;
      this._syncReject = Q, this._syncTimeout = setTimeout(() => {
        this._syncTimeoutReason = `Buffer underrun after syncing for ${t.toFixed(
          2
        )} seconds.`, this._syncReject(this._syncTimeoutReason);
      }, t * 1e3);
    }
    return this._addAllSyncQueue(e), new Promise(async (t, s) => {
      this._syncTimeoutReason !== null ? s(this._syncTimeoutReason) : this._syncReject = s;
      let i;
      this._crcSyncPending && (i = this._crcSync()), i || (this._crcSyncPending = !1, i = await this._pcmSync()), i ? t(i) : s("Old and new request do not match.");
    }).catch((t) => {
      this._icecast.state !== _.STOPPING && this._icecast.state !== _.STOPPED && this._icecast[S](
        l.WARN,
        `Reconnected successfully after ${this._icecast.state}.`,
        "Unable to sync old and new request.",
        t
      );
      const s = this._syncQueue;
      return this.initSync(), this.initQueue(), [s, Pe];
    }).then((t) => ([Ee, rt].includes(t[1]) && this.initSync(), t));
  }
  /*
  Aligns the queue with a new incoming data by aligning the crc32 hashes 
  and then returning only the frames that do not existing on the queue.
  
                   old data | common data  | new data
  (old connection) ------------------------|
  (new connection)          |------------------>
                             ^^^^^^^^^^^^^^ ^^^^
                              (sync)         (frames to return)
  */
  _crcSync() {
    if (!this._syncQueue.length) return [[], j];
    const e = 0, t = this._syncQueue[e].crc32, s = this._crcQueueIndexes[t];
    let i, a, r;
    if (s) {
      e: for (const o of s) {
        r = o - (this._queueIndex - this._crcQueue.length);
        for (let c = e; c < this._syncQueue.length && r + c < this._crcQueue.length; c++)
          if (this._crcQueue[r + c].crc32 !== this._syncQueue[c].crc32)
            continue e;
        a = r + this._syncQueue.length <= this._crcQueue.length, i = !0;
        break;
      }
      if (a) return [[], j];
      if (i) {
        const o = this._crcQueue.length - r;
        return this._icecast[S](
          l.WARN,
          `Reconnected successfully after ${this._icecast.state}.`,
          `Found ${o} frames (${(this._crcQueue.slice(r).reduce((c, { duration: d }) => c + d, 0) / 1e3).toFixed(3)} seconds) of overlapping audio data in new request.`,
          "Synchronized old and new request."
        ), [this._syncQueue.slice(o), Ee];
      }
    }
  }
  /*
    Syncs the old and new data using correlation between decoded audio.
    A new player will be constructed after this sync is completed.
  
                             old data  | common data | new data
      
      (time scale)     -2 -1 0 +1 +2
      (old connection)  -----------------------------|
                        ^^^^^|^^^^^^^^^|             |
                             |         sampleOffsetFromEnd    buffered (metadataTimestamp)
    
      (time scale)               -2 -1 0 +1 +2
      (new connection)                 |-----------|--->
                               |       ^^^^^^^^^^^^|^^^^
                               delay               syncLength
    */
  async _pcmSync() {
    try {
      const s = (c, d) => c / d;
      if (!this._synAudioResult) {
        let c;
        try {
          c = (await import(
            /* webpackChunkName: "synaudio", webpackPrefetch: true */
            "./index-BfhlErQs.js"
          )).default;
        } catch {
          this._icecast[S](
            l.WARN,
            "Failed to synchronize old and new stream",
            "Missing `synaudio` dependency."
          );
          return;
        }
        const [d, w, x] = await this._decodeQueues(), U = x * 1;
        if (w.samplesDecoded <= U)
          return [[], j];
        const H = new c({
          correlationSampleSize: U,
          initialGranularity: 16
        });
        this._synAudioResult = await (na ? H.syncWorkerConcurrent(
          d,
          w,
          Math.max(navigator.hardwareConcurrency - 1, 1)
        ) : H.syncWorker(d, w)), this._synAudioResult.offsetFromEnd = s(
          d.samplesDecoded - this._synAudioResult.sampleOffset,
          x
        );
      }
      const { correlation: i, offsetFromEnd: a } = this._synAudioResult;
      let r = (this.buffered - a) * 1e3;
      if (-r > this._syncQueueDuration) return [[], j];
      const o = 0;
      if (r < 0) {
        let c = 0;
        for (let d = 0; c < this._syncQueue.length - o && d > r; c++)
          d -= this._syncQueue[c].duration;
        this._syncQueue = this._syncQueue.slice(c - o);
      } else
        for (let c = 0; c < o && c < this._syncQueue.length; c++)
          r -= this._syncQueue[c].duration;
      return this._icecast[S](
        l.WARN,
        `Reconnected successfully after ${this._icecast.state}.`,
        `Synchronized old and new request with ${(Math.round(i * 1e4) / 100).toFixed(2)}% confidence.`
      ), this.initQueue(), [this._syncQueue, rt, r];
    } catch {
    }
  }
  async _decodeQueues() {
    const e = (s, i) => {
      let a = s.length - 1;
      for (let r = 0; r < i && a > 0; a--)
        r += s[a].duration;
      return this._icecast[be].decodeAudioData(
        Ve(s.slice(a).map(({ data: r }) => r)).buffer
      );
    };
    [this._a, this._b] = await Promise.all([
      // decode the pcm queue only once, decode only up to twice the amount of buffered audio
      this._a ? this._a : e(this._pcmQueue, this.buffered * 2e3),
      e(this._syncQueue, 1 / 0)
    ]);
    const t = (s) => {
      const i = {
        channelData: [],
        samplesDecoded: s.length
      };
      for (let a = 0; a < s.numberOfChannels; a++)
        i.channelData.push(
          Float32Array.from(s.getChannelData(a))
        );
      return i;
    };
    return [
      t(this._a),
      t(this._b),
      this._a.sampleRate
    ];
  }
}
class Ge {
  constructor(e, t, s, i, a) {
    this._icecast = e, this._endpoint = t, this._inputMimeType = s, this._codec = i, this._codecHeader = a;
    const r = h.get(this._icecast);
    this._audioElement = r[z], this._bufferLength = r[Gs], this._codecUpdateTimestamp = 0, this._codecUpdateOffset = 0, this._notSyncedHandler = () => {
      this.syncState = Pe;
    };
  }
  static parseMimeType(e) {
    return e.match(
      /^(?:application\/|audio\/|)(?<mime>[a-zA-Z]+)(?:$|;[ ]*codecs=(?:\'|\")(?<codecs>[a-zA-Z,]+)(?:\'|\"))/
    );
  }
  static canPlayType(e, t, s) {
    const i = Ge.parseMimeType(t), a = (r) => r.reduce((o, c) => {
      if (o === "") return "";
      const d = e(c);
      if (!d) return "";
      if (d === "maybe" || o === "maybe") return "maybe";
      if (d === !0 || d === "probably") return "probably";
    }, null);
    if (i) {
      const { mime: r, codecs: o } = i.groups, c = s && s[r];
      if (!c || Array.isArray(c))
        return a(c || [t]) || // check with the codec
        a([`audio/${r}`]);
      if (typeof c == "object") {
        if (o) {
          const d = o.split(",");
          return d.length > 1 || !c[d[0]] ? "" : a(c[d[0]]);
        }
        return "maybe";
      }
    }
    return "";
  }
  enablePlayButton() {
    this._audioElement.removeAttribute("src"), this._audioElement.src = null, this._audioElement.srcObject = null, this._audioElement.src = "data:audio/mpeg;base64,//sQxAAABFgC/SCEYACCgB9AAAAAppppVCAHBAEIgBByw9WD5+J8ufwxiDEDsMfE+D4fwG/RUGCx6VO4awVxV3qDtQNPiXKnZUNSwKuUDR6IgaeoGg7Fg6pMQU1FMy4xMDCqqqqqqqr/+xLEB4PAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=", this._audioElement.loop = !0;
  }
  get syncStateUpdate() {
    return this._syncStatePromise;
  }
  get syncState() {
    return this._syncState;
  }
  set syncState(e) {
    this._syncState = e, this._syncStateResolve && this._syncStateResolve(e), this._syncStatePromise = new Promise((t) => {
      this._syncStateResolve = t;
    });
  }
  /**
   * @abstract
   */
  get isSupported() {
    return !1;
  }
  /**
   * @abstract
   */
  get isAudioPlayer() {
    return !1;
  }
  /**
   * @interface
   */
  get metadataTimestamp() {
    return 0;
  }
  /**
   * @interface
   */
  get currentTime() {
    return 0;
  }
  get waiting() {
    return Promise.resolve();
  }
  get icecastMetadataQueue() {
    return this._icecastMetadataQueue;
  }
  set icecastMetadataQueue(e) {
    this._icecastMetadataQueue = e;
  }
  get codecUpdateQueue() {
    return this._codecUpdateQueue;
  }
  set codecUpdateQueue(e) {
    this._codecUpdateQueue = e;
  }
  get metadataQueue() {
    return this._icecastMetadataQueue ? this._icecastMetadataQueue.metadataQueue : [];
  }
  _startMetadataQueues() {
    this._icecastMetadataQueue.startQueue(this._metadataOffset), this._codecUpdateQueue.startQueue(this._metadataOffset);
  }
  /**
   * @abstract
   */
  async _init() {
    this.syncState = Ee, this.syncFrames = [], this.syncDelay = null, this._frameQueue = new ja(this._icecast, this);
  }
  /**
   * @abstract
   */
  async start(e) {
    this._metadataOffset = e, [l.RETRY, l.SWITCH].forEach(
      (i) => this._icecast.addEventListener(i, this._notSyncedHandler)
    );
    let t;
    await new Promise((i) => {
      t = i, [_.PLAYING, _.STOPPING].forEach(
        (a) => this._icecast.addEventListener(a, t, { once: !0 })
      );
    }).finally(() => {
      [_.PLAYING, _.STOPPING].forEach(
        (i) => this._icecast.removeEventListener(i, t)
      );
    });
  }
  /**
   * @abstract
   */
  async end() {
    [l.RETRY, l.SWITCH].forEach(
      (e) => this._icecast.removeEventListener(e, this._notSyncedHandler)
    ), this._icecastMetadataQueue.purgeMetadataQueue(), this._codecUpdateQueue.purgeMetadataQueue();
  }
  /**
   * @abstract
   */
  onStream(e) {
    return e;
  }
  /**
   * @abstract
   */
  onMetadata(e) {
    this._icecastMetadataQueue.addMetadata(
      e,
      this.metadataTimestamp,
      this.currentTime
    );
  }
  /**
   * @abstract
   */
  onCodecUpdate(e, t) {
    const s = this.currentTime;
    t < s && (this._codecUpdateOffset += this._codecUpdateTimestamp), this._codecUpdateTimestamp = t, this._codecUpdateQueue.addMetadata(
      { metadata: e },
      (t + this._codecUpdateOffset) / 1e3,
      s
    );
  }
}
class it extends Ge {
  constructor(e, t) {
    super(e, t), this._audioElement.crossOrigin = "anonymous", this._audioElement.preload = "none", this._icecast.addEventListener(l.STREAM_START, () => {
      this._playReady || this.end();
    }), this._init();
  }
  static canPlayType(e) {
    return it.isSupported ? super.canPlayType((t) => new Audio().canPlayType(t), e) : "";
  }
  static get isSupported() {
    return !!window.Audio;
  }
  static get name() {
    return "html5";
  }
  get isAudioPlayer() {
    return !0;
  }
  get metadataTimestamp() {
    return this._frame ? (this._frame.totalDuration + this._metadataTimestampOffset) / 1e3 : 0;
  }
  get currentTime() {
    return this._audioLoadedTimestamp && (performance.now() - this._audioLoadedTimestamp) / 1e3;
  }
  get waiting() {
    return new Promise((e) => {
      this._audioElement.addEventListener("waiting", e, { once: !0 });
    });
  }
  async _init() {
    super._init(), this._frame = null, this._audioLoadedTimestamp = 0, this._metadataTimestampOffset = 0, this._playReady = !1;
  }
  async start(e) {
    const t = super.start(e);
    this._metadataLoadedTimestamp = performance.now(), this._audioElement.loop = !1, this._audioElement.src = null, this._audioElement.srcObject = null, this._audioElement.src = this._endpoint, this._icecast.state !== _.STOPPING && this._icecast.state !== _.STOPPED && (this._audioElement.addEventListener(
      "playing",
      () => {
        this._audioLoadedTimestamp = performance.now(), this._metadataTimestampOffset = performance.now() - this._metadataLoadedTimestamp, this._startMetadataQueues(), this._icecast[S](l.PLAY);
      },
      { once: !0 }
    ), this._icecast[S](l.PLAY_READY), this._playReady = !0), await t;
  }
  async end() {
    super.end(), this._audioElement.src = null, this._audioElement.srcObject = null, this._init();
  }
  onStream(e) {
    this._frame = e[e.length - 1] || this._frame, this.syncState === Pe && (this.syncState = Pe);
  }
}
const Qi = 5, Ka = 5;
class at extends Ge {
  constructor(e, t, s, i, a) {
    super(e, t, s, i, a), this._MSEAudioWrapper = import(
      /* webpackChunkName: "mediasource", webpackPrefetch: true */
      "./MSEAudioWrapper-D33IJKA2.js"
    ), this._initSupportedContainers(), this._init();
  }
  static canPlayType(e) {
    const t = {
      mpeg: ['audio/mp4;codecs="mp3"'],
      aac: ['audio/mp4;codecs="mp4a.40.2"'],
      aacp: ['audio/mp4;codecs="mp4a.40.2"'],
      flac: ['audio/mp4;codecs="flac"'],
      ogg: {
        flac: ['audio/mp4;codecs="flac"'],
        //opus: ['audio/mp4;codecs="opus"', 'audio/webm;codecs="opus"'],
        vorbis: ['audio/webm;codecs="vorbis"']
      }
    };
    return at.isSupported ? MediaSource.isTypeSupported(e) ? "probably" : super.canPlayType(MediaSource.isTypeSupported, e, t) : "";
  }
  static get isSupported() {
    return !!window.MediaSource;
  }
  static get name() {
    return "mediasource";
  }
  get isAudioPlayer() {
    return !0;
  }
  get metadataTimestamp() {
    return this._mediaSource && this._mediaSource.sourceBuffers.length && Math.max(
      // work-around for WEBM reporting a negative timestampOffset
      this._mediaSource.sourceBuffers[0].timestampOffset,
      this._mediaSource.sourceBuffers[0].buffered.length ? this._mediaSource.sourceBuffers[0].buffered.end(0) : 0
    ) || 0;
  }
  get currentTime() {
    return this._audioElement.currentTime;
  }
  get waiting() {
    return new Promise((e) => {
      this._audioElement.addEventListener("waiting", e, { once: !0 });
    });
  }
  get changingContainer() {
    return this._changingContainer;
  }
  useNextContainer() {
    const e = this._supportedContainers.indexOf(this._container) + 1;
    this._container = this._supportedContainers[e], this._changingContainer = !0, this.enablePlayButton(), this._init(), this.start().then(() => this._changingContainer = !1);
  }
  async _initSupportedContainers() {
    const e = /* @__PURE__ */ new Set();
    this._supportedContainers = [], this._changingContainer = !1;
    let t;
    this._container = new Promise((i) => {
      t = i;
    });
    const s = [
      [() => this._inputMimeType, "raw"],
      [
        async () => (await this._MSEAudioWrapper).getWrappedMimeType(this._codec, "fmp4"),
        "fmp4"
      ],
      [
        async () => (await this._MSEAudioWrapper).getWrappedMimeType(this._codec, "webm"),
        "webm"
      ]
    ];
    for await (const i of s) {
      const a = await i[0](), r = i[1];
      MediaSource.isTypeSupported(a) && !e.has(a) && (t && (t(r), t = null), e.add(a), this._supportedContainers.push(r));
    }
  }
  async _init() {
    super._init(), this._sourceBufferQueue = [], this._playReady = !1, this._processingLastPage = !1, this._mediaSourceCreated = new Promise((t) => {
      this._mediaSourceCreatedNotify = t;
    }), this._mediaSourceOpen = new Promise((t) => {
      this._mediaSourceOpenNotify = t;
    });
    const e = await this._container;
    this._container = e, this._addFrames = this._prepareMediaSource(
      this._inputMimeType,
      this._codec
    ), await this._mediaSourceOpen;
  }
  async start(e) {
    const t = super.start(e);
    await this._mediaSourceCreated, await this._attachMediaSource(), await t;
  }
  async end() {
    super.end(), await this._init();
  }
  async onStream(e) {
    if (e = e.flatMap(
      (t) => t.codecFrames ? t.codecFrames.map((s) => (s.isLastPage = t.isLastPage, s)) : t
    ), e.length) {
      switch (this.syncState) {
        case Pe:
          this._frameQueue.initSync(), this.syncState = j;
        case j:
          [this.syncFrames, this.syncState, this.syncDelay] = await this._frameQueue.sync(e), e = this.syncFrames;
      }
      switch (this.syncState) {
        case rt:
          break;
        case Ee:
          await this._mediaSourceOpen, await this._addFrames(e), this._frameQueue.addAll(e);
          break;
      }
    }
  }
  _prepareMediaSource(e, t) {
    if (!this._container)
      this._icecast[S](
        l.PLAYBACK_ERROR,
        `Media Source Extensions API in your browser does not support ${e} or ${this._wrapper.mimeType}.See: https://caniuse.com/mediasource and https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API`
      );
    else return this._container === "raw" ? (this._createMediaSource(e), async (s) => this._appendSourceBuffer(Ve(s.map((i) => i.data)))) : (this._createMSEWrapper(e, t, this._container).then(
      () => this._createMediaSource(this._wrapper.mimeType)
    ), e.match(/ogg/) ? async (s) => {
      let i = [];
      for await (const a of s)
        this._processingLastPage !== a.isLastPage && (a.isLastPage ? this._processingLastPage = !0 : (await this._appendSourceBuffer(Ve(i)), i = [], await this._codecHeader, await this._createMSEWrapper(
          e,
          t,
          this._container
        ), this._processingLastPage = !1)), i.push(...this._wrapper.iterator([a]));
      await this._appendSourceBuffer(Ve(i));
    } : async (s) => this._appendSourceBuffer(
      Ve([...this._wrapper.iterator(s)])
    ));
  }
  async _createMSEWrapper(e, t, s) {
    this._wrapper = new (await this._MSEAudioWrapper).default(e, {
      codec: t,
      preferredContainer: s
    });
  }
  _createMediaSource(e) {
    this._mediaSource = new MediaSource(), this._mediaSourceCreatedNotify(), this._mediaSource.addEventListener(
      "sourceopen",
      () => {
        this._icecast.state !== _.STOPPED && this._icecast.state !== _.STOPPING && (this._mediaSource.addSourceBuffer(e).mode = "sequence"), this._sourceBufferRemoved = 0, this._mediaSourceOpenNotify();
      },
      {
        once: !0
      }
    );
  }
  async _attachMediaSource() {
    this._audioElement.loop = !1, this._audioElement.src = URL.createObjectURL(this._mediaSource), await this._mediaSourceOpen;
  }
  async _waitForSourceBuffer() {
    return new Promise((e) => {
      const t = this._mediaSource.sourceBuffers[0];
      t.updating ? t.addEventListener("updateend", e, {
        once: !0
      }) : e();
    });
  }
  async _appendSourceBuffer(e) {
    if (this._icecast[S](l.STREAM, e), this._mediaSource.sourceBuffers.length || this._icecast[S](
      l.WARN,
      "Attempting to append audio, but MediaSource has not been or is no longer initialized",
      "Please be sure that `detachAudioElement()` was called and awaited before reusing the element with a new IcecastMetadataPlayer instance"
    ), this._icecast.state !== _.STOPPING && this._mediaSource.sourceBuffers.length) {
      this._sourceBufferQueue.push(e);
      try {
        for (; this._sourceBufferQueue.length; )
          this._mediaSource.sourceBuffers[0].appendBuffer(
            this._sourceBufferQueue.shift()
          ), await this._waitForSourceBuffer();
      } catch (t) {
        if (t.name !== "QuotaExceededError") throw t;
      }
      this._playReady || (this._bufferLength <= this.metadataTimestamp ? (this._audioElement.addEventListener(
        "playing",
        () => {
          this._startMetadataQueues(), this._icecast[S](l.PLAY);
        },
        { once: !0 }
      ), this._icecast[S](l.PLAY_READY), this._playReady = !0) : this._icecast[S](l.BUFFER, this.metadataTimestamp)), this._audioElement.currentTime > Qi + this._bufferLength && this._sourceBufferRemoved + Ka * 1e3 < performance.now() && (this._sourceBufferRemoved = performance.now(), this._mediaSource.sourceBuffers[0].remove(
        0,
        this._audioElement.currentTime - Qi + this._bufferLength
      ), await this._waitForSourceBuffer());
    }
  }
}
class nt extends Ge {
  constructor(e, t, s, i, a) {
    super(e, t, s, i, a), this._audioContext = e[be], this._init();
  }
  static canPlayType(e) {
    const t = {
      flac: ["audio/flac"],
      mpeg: ["audio/mpeg"],
      ogg: {
        flac: ['audio/ogg;codecs="flac"'],
        opus: ['audio/ogg;codecs="opus"'],
        vorbis: ['audio/ogg;codecs="vorbis"']
      }
    };
    return nt.isSupported ? super.canPlayType(
      (s) => s === 'audio/ogg;codecs="opus"' || s === 'audio/ogg;codecs="flac"' || s === 'audio/ogg;codecs="vorbis"' || s === "audio/mpeg" || s === "audio/flac",
      e,
      t
    ) : "";
  }
  static get isSupported() {
    return !!(window.WebAssembly && (window.AudioContext || window.webkitAudioContext) && window.MediaStream);
  }
  static get name() {
    return "webaudio";
  }
  get isAudioPlayer() {
    return !0;
  }
  get metadataTimestamp() {
    return this._currentTime / 1e3;
  }
  get currentTime() {
    return (performance.now() - this._playbackStartTime) / 1e3 || 0;
  }
  get waiting() {
    return this._waitingPromise;
  }
  _updateWaiting(e) {
    this._bufferedDuration += e;
    let t;
    t = setTimeout(() => {
      this._bufferedDuration -= e, this._durationTimeouts.delete(t), this._durationTimeouts.size || this._notifyWaiting();
    }, this._bufferedDuration), this._durationTimeouts.add(t);
  }
  _notifyWaiting() {
    this._waitingResolve && this._waitingResolve(), this._waitingPromise = new Promise((e) => {
      this._waitingResolve = e;
    });
  }
  _resetWaiting() {
    this._durationTimeouts && this._durationTimeouts.forEach((e) => clearTimeout(e)), this._durationTimeouts = /* @__PURE__ */ new Set(), this._bufferedDuration = 0, this._notifyWaiting();
  }
  async _createDecoder() {
    let e;
    this._loadingDecoder = new Promise((t) => {
      this._decoderLoaded = t;
    });
    try {
      switch (this._codec) {
        case "mpeg":
          const { MPEGDecoderWebWorker: t } = await import(
            /* webpackChunkName: "mpeg" */
            "./index-Bj8CQ1a2.js"
          );
          e = t;
          break;
        case "opus":
          const { OpusDecoderWebWorker: s } = await import(
            /* webpackChunkName: "opus" */
            "./index-DbZbDG-Q.js"
          );
          e = s;
          break;
        case "flac":
          const { FLACDecoderWebWorker: i } = await import(
            /* webpackChunkName: "flac" */
            "./index-D4QKhgjm.js"
          );
          e = i;
          break;
        case "vorbis":
          const { OggVorbisDecoderWebWorker: a } = await import(
            /* webpackChunkName: "vorbis" */
            "./index-DvVOAMsK.js"
          );
          e = a;
          break;
      }
    } catch {
      this._icecast[S](
        l.PLAYBACK_ERROR,
        `Missing \`webaudio-${this._codec}\` dependency.`,
        `Unable to playback playback \`${this._codec}\` audio.`
      );
      return;
    }
    if (e) {
      const t = await this._codecHeader;
      this._decoderLoaded(), this._wasmDecoder = new e(t);
    } else
      this._icecast[S](
        l.PLAYBACK_ERROR,
        "Unsupported `webaudio` playback codec: " + this._codec
      );
  }
  async _init() {
    super._init(), this._currentTime = 0, this._decodedSample = 0, this._startSampleOffset = 0, this._sampleRate = 0, this._playbackStartTime = void 0, this._playReady = !1, this._resetWaiting(), this._playPromise = new Promise((e) => {
      this._playStart = e;
    });
  }
  async start(e) {
    this._wasmDecoder || await this._createDecoder();
    const t = super.start(e);
    this._playStart(), await t;
  }
  async end() {
    super.end(), this._wasmDecoder && (this._wasmDecoder.terminate(), this._wasmDecoder = null), this._mediaStream && this._mediaStream.stream.getTracks().forEach((e) => this._mediaStream.stream.removeTrack(e)), this._init();
  }
  async onStream(e) {
    if (this._codec !== "vorbis")
      switch (e = e.flatMap((t) => t.codecFrames || t), this.syncState) {
        case Pe:
          this._frameQueue.initSync(), this.syncState = j;
        case j:
          [this.syncFrames, this.syncState, this.syncDelay] = await this._frameQueue.sync(e), e = this.syncFrames;
      }
    switch (this.syncState) {
      case rt:
        break;
      case Ee:
        e.length && (this._currentTime = e[e.length - 1].totalDuration, this._decodeAndPlay(e));
    }
  }
  async _decodeAndPlay(e) {
    if (await this._loadingDecoder, this._wasmDecoder) {
      await this._wasmDecoder.ready;
      let t;
      this._codec === "vorbis" ? t = this._wasmDecoder.decodeOggPages(e) : (t = this._wasmDecoder.decodeFrames(
        e.map((s) => s.data)
      ), this._frameQueue.addAll(e)), t.then((s) => this._play(s));
    }
  }
  async _play({ channelData: e, samplesDecoded: t, sampleRate: s }) {
    if (await this._playPromise, this._icecast.state !== _.STOPPING && this._icecast.state !== _.STOPPED && t) {
      this._icecast[S](l.STREAM, {
        channelData: e,
        samplesDecoded: t,
        sampleRate: s
      }), this._sampleRate || (this._sampleRate = s, this._mediaStream = this._audioContext.createMediaStreamDestination(), this._mediaStream.channelCount = this._audioContext.destination.maxChannelCount, this._audioElement.loop = !1, this._audioElement.srcObject = this._mediaStream.stream);
      const i = this._audioContext.createBuffer(
        e.length,
        t,
        this._sampleRate
      );
      e.forEach(
        (d, w) => i.getChannelData(w).set(d)
      );
      const a = this._audioContext.createBufferSource();
      a.buffer = i, a.connect(this._mediaStream);
      const r = 100, o = this._decodedSample * r + this._startSampleOffset, c = Math.round(
        this._audioContext.currentTime * this._sampleRate * r
      );
      o < c && (this._startSampleOffset += c - o), a.start(o / this._sampleRate / r), this._updateWaiting(t / this._sampleRate * 1e3), this._playReady || (this._bufferLength <= this.metadataTimestamp ? (this._icecast[S](l.PLAY_READY), this._playbackStartTime = performance.now(), this._startMetadataQueues(), this._icecast[S](l.PLAY), this._playReady = !0) : this._icecast[S](l.BUFFER, this.metadataTimestamp)), this._decodedSample += t;
    }
  }
}
class vi {
  constructor(e) {
    const t = h.get(e);
    this._icecast = e, this._audioElement = t[z], this._enableLogging = t[qt], this._enableCodecUpdate = t[Ys], this._playbackMethod = "", this._newMetadataQueues(), this._player = new Ge(this._icecast), this._player.icecastMetadataQueue = this._icecastMetadataQueue, this._player.codecUpdateQueue = this._codecUpdateQueue, this._player.enablePlayButton(), this._unprocessedFrames = [], this._codecParser = void 0, this._inputMimeType = "", this._codec = "", this._syncPromise = Promise.resolve(), this._syncCancel = Q;
  }
  static get supportedPlaybackMethods() {
    return [at, nt, it].map(
      (e) => e.isSupported ? e.name : ""
    );
  }
  static canPlayType(e) {
    return {
      mediasource: at.canPlayType(e),
      html5: it.canPlayType(e),
      webaudio: nt.canPlayType(e)
    };
  }
  get endpoint() {
    return this._endpoint;
  }
  get player() {
    return this._player;
  }
  get playbackMethod() {
    return this._playbackMethod;
  }
  get icyMetaInt() {
    return this._icecastReadableStream && this._icecastReadableStream.icyMetaInt;
  }
  async playStream() {
    return this.fetchStream().then(async (e) => (this._icecast[S](l.STREAM_START), this.readIcecastResponse(e).finally(() => {
      this._icecast[S](l.STREAM_END);
    }))).catch((e) => {
      if (this._icecast.state !== _.SWITCHING) throw e;
    });
  }
  async switchStream() {
    this._icecast.state !== _.PLAYING && (this._syncCancel(), await this._syncPromise);
    const e = h.get(this._icecast);
    e[D] = _.SWITCHING, e[Ie].abort(), e[Ie] = new AbortController();
  }
  async fetchStream() {
    const e = h.get(this._icecast);
    this._endpoint = e[Bi].next().value;
    const t = e[zs] ? { "Icy-MetaData": 1 } : {};
    if (t.Range = "bytes=0-", e[kt]) {
      const a = e[kt];
      t.Authorization = "Basic " + btoa(a.user + ":" + a.password);
    }
    const s = () => fetch(this._endpoint, {
      method: "GET",
      headers: t,
      signal: e[Ie].signal
    }), i = await s().catch((a) => {
      if (a.name === "TypeError" && (a.message === "Load failed" || a.message === "Request header field Range is not allowed by Access-Control-Allow-Headers."))
        return delete t.Range, s();
      throw a;
    });
    if (!i.ok) {
      const a = new Error(`${i.status} received from ${i.url}`);
      throw a.name = "HTTP Response Error", a;
    }
    return i;
  }
  async readIcecastResponse(e) {
    const t = e.headers.get("content-type"), s = h.get(this._icecast);
    let i;
    const a = new Promise((d) => {
      i = d;
    }), r = new Promise((d) => {
      this._codecParser = new Va(t, {
        onCodec: d,
        onCodecHeader: i,
        onCodecUpdate: this._enableCodecUpdate && ((...w) => this._player.onCodecUpdate(...w)),
        enableLogging: this._enableLogging
      });
    });
    this._icecastReadableStream = new ca(e, {
      onMetadata: async (d) => {
        this._player.onMetadata(d);
      },
      onStream: async ({ stream: d }) => {
        this._icecast[S](l.STREAM, d);
        const w = [...this._codecParser.parseChunk(d)];
        if (this._player.isAudioPlayer) {
          const x = [...this._unprocessedFrames, ...w];
          this._unprocessedFrames = [], await this._player.onStream(x);
        } else
          this._unprocessedFrames.push(...w);
      },
      onError: (...d) => this._icecast[S](l.WARN, ...d),
      metadataTypes: s[xt],
      icyCharacterEncoding: s[Ws],
      icyDetectionTimeout: s[$s],
      ...s[Lt] ? { icyMetaInt: s[Lt] } : {}
    });
    const o = this._icecastReadableStream.startReading(), c = await r;
    this._player.isAudioPlayer || ([this._player, this._playbackMethod] = this._buildPlayer(
      t,
      c,
      a
    )), this._player.syncState === Ee ? this._player.start() : await this._syncPlayer(t, c, a), await o;
  }
  async _syncPlayer(e, t, s) {
    let i, a = !1, r = !1, o;
    const c = this._player, d = this._player.icecastMetadataQueue, w = this._player.codecUpdateQueue;
    this._newMetadataQueues(), c.icecastMetadataQueue = this._icecastMetadataQueue, c.codecUpdateQueue = this._codecUpdateQueue;
    const x = () => {
      r = !0, (this._icecast.state !== _.STOPPING || this._icecast.state !== _.STOPPED) && (c.icecastMetadataQueue.purgeMetadataQueue(), c.codecUpdateQueue.purgeMetadataQueue(), this._player.start(Math.max(0, c.syncDelay / 1e3)).then(() => c.end()).then(o));
    };
    this._syncCancel = () => {
      a = !0, this._icecastMetadataQueue.purgeMetadataQueue(), this._codecUpdateQueue.purgeMetadataQueue(), this._player.icecastMetadataQueue = d, this._player.codecUpdateQueue = w, i !== void 0 && !r && (clearTimeout(i), x());
    };
    const U = () => this._player.syncStateUpdate.then((G) => {
      if (a) o();
      else
        switch (G) {
          case j:
            return U();
          case Ee:
            this._icecastMetadataQueue.purgeMetadataQueue(), this._codecUpdateQueue.purgeMetadataQueue(), this._player.icecastMetadataQueue = d, this._player.codecUpdateQueue = w, (this._icecast.state !== _.STOPPING || this._icecast.state !== _.STOPPED) && (this._icecast[D] = _.PLAYING), o();
            break;
          case rt:
          case Pe:
            c.icecastMetadataQueue = d, c.codecUpdateQueue = w, [this._player, this._playbackMethod] = this._buildPlayer(
              e,
              t,
              s
            ), this._unprocessedFrames.push(...c.syncFrames), i = setTimeout(
              x,
              Math.max(c.syncDelay, 0)
            );
        }
    });
    let H;
    this._syncPromise = new Promise((G) => {
      o = G, H = () => {
        this._syncCancel(), o();
      }, this._icecast.addEventListener(_.STOPPING, H, {
        once: !0
      }), U();
    }).finally(() => {
      this._icecast.removeEventListener(_.STOPPING, H);
    });
  }
  _newMetadataQueues() {
    this._icecastMetadataQueue = new bi({
      onMetadataUpdate: (...e) => this._icecast[S](l.METADATA, ...e),
      onMetadataEnqueue: (...e) => this._icecast[S](l.METADATA_ENQUEUE, ...e),
      paused: !0
    }), this._codecUpdateQueue = new bi({
      onMetadataUpdate: (...e) => this._icecast[S](l.CODEC_UPDATE, ...e),
      paused: !0
    });
  }
  _buildPlayer(e, t, s) {
    const { [h.get(this._icecast)[Hs]]: i, ...a } = {
      mediasource: at,
      webaudio: nt,
      html5: it
    };
    let r, o;
    for (const c of Object.values({ firstMethod: i, ...a })) {
      const d = c.canPlayType(`${e};codecs="${t}"`);
      if (d === "probably" || d === "maybe") {
        o = c.name, r = new c(
          this._icecast,
          this._endpoint,
          e,
          t,
          s
        ), r.icecastMetadataQueue = this._icecastMetadataQueue, r.codecUpdateQueue = this._codecUpdateQueue;
        break;
      }
    }
    if (!r)
      throw new Error(
        `Your browser does not support this audio codec ${e}${t && `;codecs="${t}"`}`
      );
    return [r, o];
  }
}
/**
 * @license
 * @see https://github.com/eshaz/icecast-metadata-js
 * @copyright 2021-2024 Ethan Halsall
 *  This file is part of icecast-metadata-player.
 *
 *  icecast-metadata-player free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  icecast-metadata-player distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>
 */
let Xs;
try {
  new window.EventTarget(), Xs = window.EventTarget;
} catch {
  Xs = oa;
}
const W = Symbol(), Za = Symbol(), Oi = Symbol(), ks = Symbol(), Ye = Symbol(), Bs = Symbol(), ze = Symbol(), Us = Symbol(), Fs = Symbol(), Mt = Symbol(), Di = Symbol(), Li = Symbol(), Ns = Symbol();
class K extends Xs {
  static *[gi](e) {
    for (; ; ) {
      const t = h.get(e)[J];
      for (const s of t)
        if (yield s, h.get(e)[J] !== t) break;
    }
  }
  static [ns](e, t, s = {}) {
    const i = {
      [J]: (e && (Array.isArray(e) ? e : [e])) ?? s[J],
      [Gs]: t.bufferLength ?? s[Gs] ?? 1,
      [Lt]: t.icyMetaInt ?? s[Lt],
      [Ws]: t.icyCharacterEncoding ?? s[Ws],
      [$s]: t.icyDetectionTimeout ?? s[$s],
      [xt]: (t.metadataTypes ?? s[xt]) || [
        "icy"
      ],
      [zs]: ((t.metadataTypes ?? s[xt]) || ["icy"]).includes("icy"),
      [qt]: t.enableLogging ?? s[qt] ?? !1,
      [Ys]: !!(t.enableCodecUpdate ?? s[Ys] ?? t.onCodecUpdate),
      [ts]: t.endpointOrder ?? s[ts] ?? "ordered",
      [ss]: t.retryDelayRate ?? s[ss] ?? 0.1,
      [is]: t.retryDelayMin ?? s[is] ?? 0.5,
      [as]: t.retryDelayMax ?? s[as] ?? 2,
      [pt]: t.retryTimeout ?? s[pt] ?? 30,
      [Hs]: (t.playbackMethod ?? s[Hs]) || "mediasource",
      [kt]: t.authentication ?? s[kt]
    };
    return i[J] !== s[J] && i[ts] === "random" && (i[J] = i[J].sort(
      () => 0.5 - Math.random()
    )), i;
  }
  /**
   * @constructor
   * @param {string|string[]} endpoint Endpoint(s) of the Icecast compatible stream
   * @param {object} options Options object
   * @param {HTMLAudioElement} options.audioElement Audio element to play the stream
   * @param {Array} options.metadataTypes Array of metadata types to parse
   * @param {number} options.bufferLength Seconds of audio to buffer before starting playback
   * @param {number} options.icyMetaInt ICY metadata interval
   * @param {string} options.icyCharacterEncoding Character encoding to use for ICY metadata (defaults to "utf-8")
   * @param {number} options.icyDetectionTimeout ICY metadata detection timeout
   * @param {string} options.endpointOrder Order that a stream endpoint will be chosen when multiple endpoints are passed in.
   * @param {number} options.retryTimeout Number of seconds to wait before giving up on retries
   * @param {number} options.retryDelayRate Percentage of seconds to increment after each retry (how quickly to increase the back-off)
   * @param {number} options.retryDelayMin Minimum number of seconds between retries (start of the exponential back-off curve)
   * @param {number} options.retryDelayMax Maximum number of seconds between retries (end of the exponential back-off curve)
   * @param {boolean} options.enableLogging Set to `true` to enable warning and error logging to the console
   * @param {string} options.playbackMethod Sets the preferred playback method (mediasource (default), html5, webaudio)
   *
   * @callback options.onMetadata Called with metadata when synchronized with the audio
   * @callback options.onMetadataEnqueue Called with metadata when discovered on the response
   * @callback options.onError Called with message(s) when a fallback or error condition is met
   * @callback options.onWarn Called with message(s) when a warning condition is met
   * @callback options.onPlay Called when the audio element begins playing
   * @callback options.onLoad Called when stream request is started
   * @callback options.onStreamStart Called when stream requests begins to return data
   * @callback options.onBuffer Called when the audio buffer is being filled
   * @callback options.onStream Called when stream data is sent to the audio element
   * @callback options.onStreamEnd Called when the stream request completes
   * @callback options.onStop Called when the stream is completely stopped and all cleanup operations are complete
   * @callback options.onRetry Called when a connection retry is attempted
   * @callback options.onRetryTimeout Called when connections attempts have timed out
   * @callback options.onSwitch Called when a switch event is triggered
   * @callback options.onCodecUpdate Called when the audio codec information has changed
   */
  constructor(e, t = {}) {
    super(), h.set(this, {
      // options
      [Bi]: K[gi](this),
      [z]: t.audioElement || new Audio(),
      ...K[ns](e, t),
      // callbacks
      [Oi]: {
        [l.PLAY]: t.onPlay || Q,
        [l.PLAY_READY]: Q,
        [l.LOAD]: t.onLoad || Q,
        [l.STREAM_START]: t.onStreamStart || Q,
        [l.BUFFER]: t.onBuffer || Q,
        [l.STREAM]: t.onStream || Q,
        [l.STREAM_END]: t.onStreamEnd || Q,
        [l.METADATA]: t.onMetadata || Q,
        [l.METADATA_ENQUEUE]: t.onMetadataEnqueue || Q,
        [l.CODEC_UPDATE]: t.onCodecUpdate || Q,
        [l.STOP]: t.onStop || Q,
        [l.RETRY]: t.onRetry || Q,
        [l.RETRY_TIMEOUT]: t.onRetryTimeout || Q,
        [l.SWITCH]: t.onSwitch || Q,
        [l.WARN]: (...s) => {
          this[rs](console.warn, t.onWarn, s);
        },
        [l.ERROR]: (...s) => {
          this[rs](console.error, t.onError, s);
        },
        [l.PLAYBACK_ERROR]: (...s) => {
          this.state !== _.RETRYING ? (this[S](l.ERROR, ...s), this.stop()) : h.get(this)[Mt]();
        }
      },
      // variables
      [Mt]: () => {
        clearTimeout(h.get(this)[Li]), this.removeEventListener(l.STREAM_START, h.get(this)[Mt]), h.get(this)[z].removeEventListener(
          "waiting",
          h.get(this)[Us]
        );
        try {
          h.get(this)[z].pause();
        } catch (s) {
          h.get(this)[ze](s);
        }
        try {
          h.get(this)[Za] = h.get(this)[W].player.end();
        } catch {
        }
      },
      // audio element event handlers
      [Ye]: () => {
        this[Ns](Ye);
      },
      [ks]: () => {
        this.stop();
      },
      [ze]: (s) => {
        const i = {
          1: " MEDIA_ERR_ABORTED The fetching of the associated resource was aborted by the user's request.",
          2: " MEDIA_ERR_NETWORK Some kind of network error occurred which prevented the media from being successfully fetched, despite having previously been available.",
          3: " MEDIA_ERR_DECODE Despite having previously been determined to be usable, an error occurred while trying to decode the media resource, resulting in an error.",
          4: " MEDIA_ERR_SRC_NOT_SUPPORTED The associated resource or media provider object (such as a MediaStream) has been found to be unsuitable.",
          5: " MEDIA_ERR_ENCRYPTED"
        }, a = s?.target?.error || s, r = h.get(this)[W].player;
        r?.useNextContainer && !r?.changingContainer && a?.code > 2 && this.state !== _.STOPPING && this.state !== _.STOPPED && r.useNextContainer(), this.state !== _.STOPPED && !r?.changingContainer && this[S](
          l.PLAYBACK_ERROR,
          "The audio element encountered an error.",
          i[a?.code] || s
        );
      },
      [Bs]: () => {
        const s = h.get(this)[z];
        (this.state === _.LOADING || !s.loop && this.state !== _.STOPPING && this.state !== _.STOPPED) && s.play().then(() => {
          this[D] = _.PLAYING;
        }).catch((i) => {
          h.get(this)[ze](i);
        });
      },
      [Fs]: Q
    }), this[Si](), this[D] = _.STOPPED, h.get(this)[W] = new vi(this);
  }
  /**
   * @description Checks for MediaSource, WebAudio, and HTML5 support for a given codec
   * @param {string} type Codec / mime-type to check
   * @returns {mediasource: string, webaudio: string, html5: string} Object indicating if the codec is supported by the playback method
   */
  static canPlayType(e) {
    return vi.canPlayType(e);
  }
  /**
   * @returns {HTMLAudioElement} The audio element associated with this instance
   */
  get audioElement() {
    return h.get(this)[z];
  }
  /**
   * @returns {AudioContext} Statically initialized internal AudioContext
   */
  get [be]() {
    return K.constructor[be];
  }
  /**
   * @returns {string} Current endpoint that is being played
   */
  get endpoint() {
    return h.get(this)[W].endpoint;
  }
  /**
   * @returns {number} The ICY metadata interval in number of bytes for this instance
   */
  get icyMetaInt() {
    return h.get(this)[W].icyMetaInt;
  }
  /**
   * @returns {Array<Metadata>} Array of enqueued metadata objects in FILO order
   */
  get metadataQueue() {
    return h.get(this)[W].player.metadataQueue;
  }
  /**
   * @returns {string} The current state ("loading", "playing", "stopping", "stopped", "retrying", "switching")
   */
  get state() {
    return h.get(this)[D];
  }
  /**
   * @returns {string} The playback method ("mediasource", "webaudio", "html5")
   */
  get playbackMethod() {
    return h.get(this)[W].playbackMethod;
  }
  set [D](e) {
    this.dispatchEvent(new CustomEvent(e)), h.get(this)[D] = e;
  }
  [Si]() {
    const e = h.get(this)[z];
    e.addEventListener("pause", h.get(this)[ks]), e.addEventListener("play", h.get(this)[Ye]), e.addEventListener("error", h.get(this)[ze]), this.addEventListener(l.PLAY_READY, h.get(this)[Bs]);
  }
  /**
   * @description Remove event listeners from the audio element and this instance and stops playback
   */
  async detachAudioElement() {
    const e = h.get(this)[z];
    e.removeEventListener("pause", h.get(this)[ks]), e.removeEventListener("play", h.get(this)[Ye]), e.removeEventListener("error", h.get(this)[ze]), this.removeEventListener(l.PLAY_READY, h.get(this)[Bs]), await this.stop();
  }
  /**
   * @description Plays the Icecast stream
   * @async Resolves when the audio element is playing
   */
  async play() {
    return this[Ns]();
  }
  async [Ns](e) {
    if (this.state === _.STOPPED) {
      e !== Ye && this.audioElement.paused && this.audioElement.play();
      const t = new Promise((a) => {
        this.addEventListener(l.PLAY, a, { once: !0 });
      }), s = new Promise((a) => {
        this.addEventListener(l.STREAM_END, a, { once: !0 });
      });
      h.get(this)[Ie] = new AbortController(), this[D] = _.LOADING, this[S](l.LOAD);
      const i = async () => h.get(this)[W].playStream().then(async () => {
        if (this.state === _.SWITCHING)
          return this[S](l.SWITCH), i();
        this.state !== _.STOPPING && this.state !== _.STOPPED && (await t, await s, await h.get(this)[W].player.waiting);
      }).catch(async (a) => {
        if (a && a.name !== "AbortError") {
          if (await this[wi](a))
            return this[S](l.RETRY), i();
          h.get(this)[Ie].abort(), this.state !== _.STOPPING && this.state !== _.STOPPED && this[S](
            l.ERROR,
            a.message.match(/network|fetch|offline|codec/i) ? a : a.stack,
            a
          );
        }
      });
      new Promise((a, r) => {
        h.get(this)[Fs] = r, i().then(a);
      }).catch((a) => {
        if (this.state !== _.STOPPING) throw a;
      }).finally(() => {
        h.get(this)[Mt](), this[S](l.STOP), this[D] = _.STOPPED;
      }), await t;
    }
  }
  /**
   * @description Stops playing the Icecast stream
   * @async Resolves when the icecast stream has stopped
   */
  async stop() {
    this.state !== _.STOPPED && this.state !== _.STOPPING && (this[D] = _.STOPPING, h.get(this)[Ie].abort(), h.get(this)[Fs](), await new Promise((e) => {
      this.addEventListener(l.STOP, e, { once: !0 });
    }), h.get(this)[W].player.enablePlayButton());
  }
  /**
   * @description Switches the Icecast stream endpoint during playback
   * @async Resolves when playback begins from the new source
   */
  async switchEndpoint(e, t) {
    if (this.state !== _.STOPPED && this.state !== _.STOPPING) {
      const s = h.get(this);
      return Object.assign(
        s,
        K[ns](e, t, s)
      ), s[W].switchStream();
    }
  }
  async [wi](e) {
    if (h.get(this)[pt] === 0) return !1;
    if (h.get(this)[D] === _.RETRYING)
      return await new Promise((t) => {
        this.addEventListener(_.STOPPING, t, { once: !0 });
        const s = Math.min(
          h.get(this)[is] * 1e3 * (h.get(this)[ss] + 1) ** h.get(this)[Di]++,
          h.get(this)[as] * 1e3
        );
        setTimeout(
          () => {
            this.removeEventListener(_.STOPPING, t), t();
          },
          s + s * 0.3 * Math.random()
        );
      }), h.get(this)[D] === _.RETRYING;
    if (h.get(this)[D] !== _.STOPPING && h.get(this)[D] !== _.STOPPED && (e.message.match(/network|fetch|offline|Error in body stream/i) || e.name === "HTTP Response Error")) {
      this[S](l.ERROR, e.name, e), this[D] = _.RETRYING, h.get(this)[zs] && this[S](
        l.WARN,
        "This stream was requested with ICY metadata.",
        'If there is a CORS preflight failure, try removing "icy" from the metadataTypes option.',
        "See https://github.com/eshaz/icecast-metadata-js#cors for more details."
      );
      const t = new Promise((s) => {
        h.get(this)[Us] = s, h.get(this)[z].addEventListener(
          "waiting",
          h.get(this)[Us],
          {
            once: !0
          }
        );
      });
      return h.get(this)[Li] = setTimeout(
        () => {
          t.then(() => {
            h.get(this)[D] === _.RETRYING && (this[S](l.RETRY_TIMEOUT), this.stop());
          });
        },
        h.get(this)[pt] * 1e3
      ), h.get(this)[Di] = 0, !0;
    }
    return !1;
  }
  [S](e, ...t) {
    this.dispatchEvent(new CustomEvent(e, { detail: t })), h.get(this)[Oi][e](...t);
  }
  [rs](e, t, s) {
    h.get(this)[qt] && e(
      "icecast-metadata-js",
      s.reduce((i, a) => i + `
  ` + a, "")
    ), t && t(...s);
  }
}
const ki = window.AudioContext || window.webkitAudioContext;
if (ki && !K.constructor[be]) {
  K.constructor[be] = "audio context pending";
  const n = (s) => {
    console.error(
      "icecast-metadata-js",
      "Failed to start the AudioContext. WebAudio playback will not be possible.",
      s
    );
  }, e = ["touchstart", "touchend", "mousedown", "keydown"], t = () => {
    e.forEach((i) => document.removeEventListener(i, t));
    const s = new ki({
      latencyHint: "interactive"
    });
    s.destination.channelCount = s.destination.maxChannelCount, s.resume().then(() => {
      s.createScriptProcessor(2 ** 14, 2, 2).connect(s.destination), s.onstatechange = () => {
        s.state !== "running" && s.resume().catch(n);
      };
    }).catch(n), K.constructor[be] = s;
  };
  e.forEach((s) => document.addEventListener(s, t));
}
const Xa = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: K
}, Symbol.toStringTag, { value: "Module" }));
export {
  Va as C,
  Xa as I,
  ws as a,
  ne as c,
  L as d,
  pe as h,
  Se as i,
  js as t,
  Ss as v
};
