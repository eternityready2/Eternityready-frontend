import { C as T } from "./IcecastMetadataPlayer-CW5QCJoS.js";
const A = "mp4", l = "webm", d = "mp3", g = "mp4a.40.2", m = "flac", w = "vorbis", h = "opus", b = "audio/", S = ";codecs=", f = b + A + S, y = b + l + S, u = "mse-audio-wrapper";
class r {
  /**
   * @abstract
   * @description Container Object structure Abstract Class
   * @param {any} name Name of the object
   * @param {Array<Uint8>} [contents] Array of arrays or typed arrays, or a single number or typed array
   * @param {Array<ContainerElement>} [objects] Array of objects to insert into this object
   */
  constructor({ name: t, contents: e = [], children: s = [] }) {
    this._name = t, this._contents = e, this._children = s;
  }
  /**
   * @description Converts a string to a byte array
   * @param {string} name String to convert
   * @returns {Uint8Array}
   */
  static stringToByteArray(t) {
    return [...t].map((e) => e.charCodeAt(0));
  }
  /**
   * @description Converts a JavaScript number to Uint32
   * @param {number} number Number to convert
   * @returns {Uint32}
   */
  static getFloat64(t) {
    const e = new Uint8Array(8);
    return new DataView(e.buffer).setFloat64(0, t), e;
  }
  /**
   * @description Converts a JavaScript number to Uint32
   * @param {number} number Number to convert
   * @returns {Uint32}
   */
  static getUint64(t) {
    const e = new Uint8Array(8);
    return new DataView(e.buffer).setBigUint64(0, BigInt(t)), e;
  }
  /**
   * @description Converts a JavaScript number to Uint32
   * @param {number} number Number to convert
   * @returns {Uint32}
   */
  static getUint32(t) {
    const e = new Uint8Array(4);
    return new DataView(e.buffer).setUint32(0, t), e;
  }
  /**
   * @description Converts a JavaScript number to Uint16
   * @param {number} number Number to convert
   * @returns {Uint32}
   */
  static getUint16(t) {
    const e = new Uint8Array(2);
    return new DataView(e.buffer).setUint16(0, t), e;
  }
  /**
   * @description Converts a JavaScript number to Int16
   * @param {number} number Number to convert
   * @returns {Uint32}
   */
  static getInt16(t) {
    const e = new Uint8Array(2);
    return new DataView(e.buffer).setInt16(0, t), e;
  }
  static *flatten(t) {
    for (const e of t)
      Array.isArray(e) ? yield* r.flatten(e) : yield e;
  }
  /**
   * @returns {Uint8Array} Contents of this container element
   */
  get contents() {
    const t = new Uint8Array(this.length), e = this._buildContents();
    let s = 0;
    for (const c of r.flatten(e))
      typeof c != "object" ? (t[s] = c, s++) : (t.set(c, s), s += c.length);
    return t;
  }
  /**
   * @returns {number} Length of this container element
   */
  get length() {
    return this._buildLength();
  }
  _buildContents() {
    return [
      this._contents,
      ...this._children.map((t) => t._buildContents())
    ];
  }
  _buildLength() {
    let t;
    return Array.isArray(this._contents) ? t = this._contents.reduce(
      (e, s) => e + (s.length === void 0 ? 1 : s.length),
      0
    ) : t = this._contents.length === void 0 ? 1 : this._contents.length, t + this._children.reduce((e, s) => e + s.length, 0);
  }
  addChild(t) {
    this._children.push(t);
  }
}
class n extends r {
  /**
   * @description ISO/IEC 14496-12 Part 12 ISO Base Media File Format Box
   * @param {string} name Name of the box (i.e. 'moov', 'moof', 'traf')
   * @param {object} params Object containing contents or child boxes
   * @param {Array<Uint8>} [params.contents] Array of bytes to insert into this box
   * @param {Array<Box>} [params.children] Array of child boxes to insert into this box
   */
  constructor(t, { contents: e, children: s } = {}) {
    super({ name: t, contents: e, children: s });
  }
  _buildContents() {
    return [
      ...this._lengthBytes,
      ...r.stringToByteArray(this._name),
      ...super._buildContents()
    ];
  }
  _buildLength() {
    return this._length || (this._length = 4 + this._name.length + super._buildLength(), this._lengthBytes = r.getUint32(this._length)), this._length;
  }
}
class o extends r {
  constructor(t, { contents: e, tags: s } = {}) {
    super({ name: t, contents: e, children: s });
  }
  static getLength(t) {
    const e = r.getUint32(t);
    return e.every((s, c, _) => s === 0 ? (_[c] = 128, !0) : !1), e;
  }
  /**
   * @returns {Uint8Array} Contents of this stream descriptor tag
   */
  _buildContents() {
    return [this._name, ...this._lengthBytes, ...super._buildContents()];
  }
  _buildLength() {
    if (!this._length) {
      const t = super._buildLength();
      this._lengthBytes = o.getLength(t), this._length = 1 + t + this._lengthBytes.length;
    }
    return this._length;
  }
  addTag(t) {
    this.addChild(t);
  }
}
class p {
  constructor(t) {
    this._codec = t;
  }
  getCodecBox(t) {
    switch (this._codec) {
      case d:
        return this.getMp4a(t, 107);
      case g:
        return this.getMp4a(t, 64);
      case h:
        return this.getOpus(t);
      case m:
        return this.getFlaC(t);
    }
  }
  getOpus(t) {
    return new n("Opus", {
      /* prettier-ignore */
      contents: [
        0,
        0,
        0,
        0,
        0,
        0,
        // reserved
        0,
        1,
        // data reference index
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        // reserved
        0,
        t.channels,
        // channel count
        0,
        t.bitDepth,
        // PCM bitrate (16bit)
        0,
        0,
        // predefined
        0,
        0,
        // reserved
        n.getUint16(t.sampleRate),
        0,
        0
        // sample rate 16.16 fixed-point
      ],
      children: [
        new n("dOps", {
          /* prettier-ignore */
          contents: [
            0,
            // version
            t.channels,
            // output channel count
            n.getUint16(t.preSkip),
            // pre skip
            n.getUint32(t.inputSampleRate),
            // input sample rate
            n.getInt16(t.outputGain),
            // output gain
            t.channelMappingFamily,
            // channel mapping family int(8)
            t.channelMappingFamily !== 0 ? [
              t.streamCount,
              t.coupledStreamCount,
              t.channelMappingTable
              // channel mapping table
            ] : []
          ]
        })
      ]
    });
  }
  getFlaC(t) {
    return new n("fLaC", {
      /* prettier-ignore */
      contents: [
        0,
        0,
        0,
        0,
        0,
        0,
        // reserved
        0,
        1,
        // data reference index
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        // reserved
        0,
        t.channels,
        // channel count
        0,
        t.bitDepth,
        // PCM bitrate (16bit)
        0,
        0,
        // predefined
        0,
        0,
        // reserved
        n.getUint16(t.sampleRate),
        0,
        0
        // sample rate 16.16 fixed-point
        /*
        When the bitstream's native sample rate is greater
        than the maximum expressible value of 65535 Hz,
        the samplerate field shall hold the greatest
        expressible regular division of that rate. I.e.
        the samplerate field shall hold 48000.0 for
        native sample rates of 96 and 192 kHz. In the
        case of unusual sample rates which do not have
        an expressible regular division, the maximum value
        of 65535.0 Hz should be used.
        */
      ],
      children: [
        new n("dfLa", {
          /* prettier-ignore */
          contents: [
            0,
            // version
            0,
            0,
            0,
            // flags
            ...t.streamInfo || [
              // * `A........` Last metadata block flag
              // * `.BBBBBBBB` BlockType
              128,
              // last metadata block, stream info
              0,
              0,
              34,
              // Length
              n.getUint16(t.blockSize),
              // maximum block size
              n.getUint16(t.blockSize),
              // minimum block size
              0,
              0,
              0,
              // maximum frame size
              0,
              0,
              0,
              // minimum frame size
              n.getUint32(t.sampleRate << 12 | t.channels << 8 | t.bitDepth - 1 << 4),
              // 20bits sample rate, 3bits channels, 5bits bitDepth - 1
              0,
              0,
              0,
              0,
              // total samples
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
              // md5 of stream
            ]
          ]
        })
      ]
    });
  }
  getMp4a(t, e) {
    const s = new o(4, {
      /* prettier-ignore */
      contents: [
        e,
        21,
        // stream type(6bits)=5 audio, flags(2bits)=1
        0,
        0,
        0,
        // 24bit buffer size
        0,
        0,
        0,
        0,
        // max bitrate
        0,
        0,
        0,
        0
        // avg bitrate
      ]
    });
    return e === 64 && s.addTag(
      new o(5, {
        contents: t.audioSpecificConfig
      })
    ), new n("mp4a", {
      /* prettier-ignore */
      contents: [
        0,
        0,
        0,
        0,
        0,
        0,
        // reserved
        0,
        1,
        // data reference index
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        // reserved
        0,
        t.channels,
        // channel count
        0,
        16,
        // PCM bitrate (16bit)
        0,
        0,
        // Compression ID
        0,
        0,
        // Packet size
        n.getUint16(t.sampleRate),
        0,
        0
      ],
      // sample rate unsigned floating point
      children: [
        new n("esds", {
          contents: [0, 0, 0, 0],
          children: [
            new o(3, {
              contents: [
                0,
                1,
                // ES_ID = 1
                0
                // flags etc = 0
              ],
              tags: [
                s,
                new o(6, {
                  contents: 2
                })
              ]
            })
          ]
        })
      ]
    });
  }
  /**
   * @param {Header} header Codec frame
   * @returns {Uint8Array} Filetype and Movie Box information for the codec
   */
  getInitializationSegment({ header: t, samples: e }) {
    return new r({
      children: [
        new n("ftyp", {
          /* prettier-ignore */
          contents: [
            n.stringToByteArray("iso5"),
            // major brand
            0,
            0,
            2,
            0,
            // minor version
            n.stringToByteArray("iso6mp41")
          ]
          // compatible brands
        }),
        new n("moov", {
          children: [
            new n("mvhd", {
              /* prettier-ignore */
              contents: [
                0,
                // version
                0,
                0,
                0,
                // flags
                0,
                0,
                0,
                0,
                // creation time
                0,
                0,
                0,
                0,
                // modification time
                0,
                0,
                3,
                232,
                // timescale
                0,
                0,
                0,
                0,
                // duration
                0,
                1,
                0,
                0,
                // rate
                1,
                0,
                // volume
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                // reserved
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                // a b u (matrix structure)
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
                // c d v
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                64,
                0,
                0,
                0,
                // x y w
                0,
                0,
                0,
                0,
                // preview time
                0,
                0,
                0,
                0,
                // preview duration
                0,
                0,
                0,
                0,
                // poster time
                0,
                0,
                0,
                0,
                // selection time
                0,
                0,
                0,
                0,
                // selection duration
                0,
                0,
                0,
                0,
                // current time
                0,
                0,
                0,
                2
              ]
              // next track
            }),
            new n("trak", {
              children: [
                new n("tkhd", {
                  /* prettier-ignore */
                  contents: [
                    0,
                    // version
                    0,
                    0,
                    3,
                    // flags (0x01 - track enabled, 0x02 - track in movie, 0x04 - track in preview, 0x08 - track in poster)
                    0,
                    0,
                    0,
                    0,
                    // creation time
                    0,
                    0,
                    0,
                    0,
                    // modification time
                    0,
                    0,
                    0,
                    1,
                    // track id
                    0,
                    0,
                    0,
                    0,
                    // reserved
                    0,
                    0,
                    0,
                    0,
                    // duration
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    // reserved
                    0,
                    0,
                    // layer
                    0,
                    1,
                    // alternate group
                    1,
                    0,
                    // volume
                    0,
                    0,
                    // reserved
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    // a b u (matrix structure)
                    0,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    // c d v 
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    64,
                    0,
                    0,
                    0,
                    // x y w
                    0,
                    0,
                    0,
                    0,
                    // track width
                    0,
                    0,
                    0,
                    0
                  ]
                  // track height
                }),
                new n("mdia", {
                  children: [
                    new n("mdhd", {
                      /* prettier-ignore */
                      contents: [
                        0,
                        // version
                        0,
                        0,
                        0,
                        // flags
                        0,
                        0,
                        0,
                        0,
                        // creation time (in seconds since midnight, January 1, 1904)
                        0,
                        0,
                        0,
                        0,
                        // modification time
                        n.getUint32(t.sampleRate),
                        // time scale
                        0,
                        0,
                        0,
                        0,
                        // duration
                        85,
                        196,
                        // language
                        0,
                        0
                      ]
                      // quality
                    }),
                    new n("hdlr", {
                      /* prettier-ignore */
                      contents: [
                        0,
                        // version
                        0,
                        0,
                        0,
                        // flags
                        n.stringToByteArray("mhlr"),
                        // component type (mhlr, dhlr)
                        n.stringToByteArray("soun"),
                        // component subtype (vide' for video data, 'soun' for sound data or ‘subt’ for subtitles)
                        0,
                        0,
                        0,
                        0,
                        // component manufacturer
                        0,
                        0,
                        0,
                        0,
                        // component flags
                        0,
                        0,
                        0,
                        0,
                        // component flags mask
                        0
                      ]
                      // String that specifies the name of the component, terminated by a null character
                    }),
                    new n("minf", {
                      children: [
                        new n("stbl", {
                          children: [
                            new n("stsd", {
                              // Sample description atom
                              /* prettier-ignore */
                              contents: [
                                0,
                                // version
                                0,
                                0,
                                0,
                                // flags
                                0,
                                0,
                                0,
                                1
                              ],
                              // entry count
                              children: [this.getCodecBox(t)]
                            }),
                            new n("stts", {
                              // Time-to-sample atom
                              /* prettier-ignore */
                              contents: [0, 0, 0, 0, 0, 0, 0, 0]
                            }),
                            new n("stsc", {
                              // Sample-to-chunk atom
                              /* prettier-ignore */
                              contents: [0, 0, 0, 0, 0, 0, 0, 0]
                            }),
                            new n("stsz", {
                              // Sample Size atom
                              /* prettier-ignore */
                              contents: [
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0
                              ]
                            }),
                            new n("stco", {
                              // Chunk Offset atom
                              /* prettier-ignore */
                              contents: [0, 0, 0, 0, 0, 0, 0, 0]
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            new n("mvex", {
              children: [
                new n("trex", {
                  /* prettier-ignore */
                  contents: [
                    0,
                    0,
                    0,
                    0,
                    // flags
                    0,
                    0,
                    0,
                    1,
                    // track id
                    0,
                    0,
                    0,
                    1,
                    // default_sample_description_index
                    n.getUint32(e),
                    // default_sample_duration
                    0,
                    0,
                    0,
                    0,
                    // default_sample_size;
                    0,
                    0,
                    0,
                    0
                  ]
                  // default_sample_flags;
                })
              ]
            })
          ]
        })
      ]
    }).contents;
  }
  getSamplesPerFrame(t) {
    return this._codec === g ? t.map(
      ({ data: e, header: s }) => n.getUint32(e.length - s.length)
    ) : t.map(({ data: e }) => n.getUint32(e.length));
  }
  getFrameData(t) {
    return this._codec === g ? t.map(({ data: e, header: s }) => e.subarray(s.length)) : t.map(({ data: e }) => e);
  }
  /**
   * @description Wraps codec frames into a Movie Fragment
   * @param {Array<Frame>} frames Frames to contain in this Movie Fragment
   * @returns {Uint8Array} Movie Fragment containing the frames
   */
  getMediaSegment(t) {
    return new r({
      children: [
        new n("moof", {
          children: [
            new n("mfhd", {
              /* prettier-ignore */
              contents: [0, 0, 0, 0, 0, 0, 0, 0]
              // sequence number
            }),
            new n("traf", {
              children: [
                new n("tfhd", {
                  /* prettier-ignore */
                  contents: [
                    0,
                    // version
                    2,
                    0,
                    0,
                    // flags
                    // * `AB|00000000|00CDE0FG`
                    // * `A.|........|........` default-base-is-moof
                    // * `.B|........|........` duration-is-empty
                    // * `..|........|..C.....` default-sample-flags-present
                    // * `..|........|...D....` default-sample-size-present
                    // * `..|........|....E...` default-sample-duration-present
                    // * `..|........|......F.` sample-description-index-present
                    // * `..|........|.......G` base-data-offset-present
                    0,
                    0,
                    0,
                    1
                  ]
                  // track id
                }),
                new n("tfdt", {
                  /* prettier-ignore */
                  contents: [
                    0,
                    // version
                    0,
                    0,
                    0,
                    // flags
                    0,
                    0,
                    0,
                    0
                  ]
                  // base media decode time
                }),
                new n("trun", {
                  /* prettier-ignore */
                  contents: [
                    0,
                    // version
                    0,
                    2,
                    1,
                    // flags
                    // * `ABCD|00000E0F`
                    // * `A...|........` sample‐composition‐time‐offsets‐present
                    // * `.B..|........` sample‐flags‐present
                    // * `..C.|........` sample‐size‐present
                    // * `...D|........` sample‐duration‐present
                    // * `....|.....E..` first‐sample‐flags‐present
                    // * `....|.......G` data-offset-present
                    n.getUint32(t.length),
                    // number of samples
                    n.getUint32(92 + t.length * 4),
                    // data offset
                    ...this.getSamplesPerFrame(t)
                  ]
                  // samples size per frame
                })
              ]
            })
          ]
        }),
        new n("mdat", {
          contents: this.getFrameData(t)
        })
      ]
    }).contents;
  }
}
const E = (...a) => a.flatMap((t) => {
  const e = [];
  for (let s = t.length; s >= 0; s -= 255)
    e.push(s >= 255 ? 255 : s);
  return e;
}), U = (...a) => {
  console.error(
    u,
    a.reduce((t, e) => t + `
  ` + e, "")
  );
};
class x extends r {
  /**
   * @description Extensible Binary Meta Language element
   * @param {name} name ID of the EBML element
   * @param {object} params Object containing contents or children
   * @param {boolean} [isUnknownLength] Set to true to use the unknown length constant for EBML
   * @param {Array<Uint8>} [params.contents] Array of bytes to insert into this box
   * @param {Array<Box>} [params.children] Array of children to insert into this box
   */
  constructor(t, { contents: e, children: s, isUnknownLength: c = !1 } = {}) {
    super({ name: t, contents: e, children: s }), this._isUnknownLength = c;
  }
  /**
   * @description Converts a JavaScript number into a variable length EBML integer
   * @param {number} number Number to convert
   */
  static getUintVariable(t) {
    let e;
    if (t < 127)
      e = [128 | t];
    else if (t < 16383)
      e = r.getUint16(t), e[0] |= 64;
    else if (t < 2097151)
      e = r.getUint32(t).subarray(1), e[0] |= 32;
    else if (t < 268435455)
      e = r.getUint32(t), e[0] |= 16;
    else if (t < 34359738367)
      e = r.getUint64(t).subarray(3), e[0] |= 8;
    else if (t < 4398046511103)
      e = r.getUint64(t).subarray(2), e[0] |= 4;
    else if (t < 562949953421311)
      e = r.getUint64(t).subarray(1), e[0] |= 2;
    else if (t < 72057594037927940)
      e = r.getUint64(t), e[0] |= 1;
    else if (typeof t != "number" || isNaN(t))
      throw U(
        `EBML Variable integer must be a number, instead received ${t}`
      ), new Error(u + ": Unable to encode WEBM");
    return e;
  }
  _buildContents() {
    return [...this._name, ...this._lengthBytes, ...super._buildContents()];
  }
  _buildLength() {
    return this._length || (this._contentLength = super._buildLength(), this._lengthBytes = this._isUnknownLength ? [1, 255, 255, 255, 255, 255, 255, 255] : x.getUintVariable(this._contentLength), this._length = this._name.length + this._lengthBytes.length + this._contentLength), this._length;
  }
}
const i = {
  Audio: [225],
  BitDepth: [98, 100],
  Channels: [159],
  Cluster: [31, 67, 182, 117],
  CodecDelay: [86, 170],
  CodecID: [134],
  CodecPrivate: [99, 162],
  DocType: [66, 130],
  DocTypeReadVersion: [66, 133],
  DocTypeVersion: [66, 135],
  EBML: [26, 69, 223, 163],
  EBMLMaxIDLength: [66, 242],
  EBMLMaxSizeLength: [66, 243],
  EBMLReadVersion: [66, 247],
  EBMLVersion: [66, 134],
  FlagLacing: [156],
  Info: [21, 73, 169, 102],
  MuxingApp: [77, 128],
  SamplingFrequency: [181],
  SeekPreRoll: [86, 187],
  Segment: [24, 83, 128, 103],
  SimpleBlock: [163],
  Timestamp: [231],
  TimestampScale: [42, 215, 177],
  TrackEntry: [174],
  TrackNumber: [215],
  Tracks: [22, 84, 174, 107],
  TrackType: [131],
  TrackUID: [115, 197],
  WritingApp: [87, 65]
};
class M {
  constructor(t) {
    switch (t) {
      case h: {
        this._codecId = "A_OPUS", this._getCodecSpecificTrack = (e) => [
          new x(i.CodecDelay, {
            contents: x.getUint32(
              Math.round(e.preSkip * this._timestampScale)
            )
          }),
          // OPUS codec delay
          new x(i.SeekPreRoll, {
            contents: x.getUint32(Math.round(3840 * this._timestampScale))
          }),
          // OPUS seek preroll 80ms
          new x(i.CodecPrivate, { contents: e.data })
          // OpusHead bytes
        ];
        break;
      }
      case w: {
        this._codecId = "A_VORBIS", this._getCodecSpecificTrack = (e) => [
          new x(i.CodecPrivate, {
            contents: [
              2,
              // number of packets
              E(e.data, e.vorbisComments),
              e.data,
              e.vorbisComments,
              e.vorbisSetup
            ]
          })
        ];
        break;
      }
    }
  }
  getInitializationSegment({ header: t }) {
    return this._timestampScale = 1e9 / t.sampleRate, new r({
      children: [
        new x(i.EBML, {
          children: [
            new x(i.EBMLVersion, { contents: 1 }),
            new x(i.EBMLReadVersion, { contents: 1 }),
            new x(i.EBMLMaxIDLength, { contents: 4 }),
            new x(i.EBMLMaxSizeLength, { contents: 8 }),
            new x(i.DocType, { contents: x.stringToByteArray(l) }),
            new x(i.DocTypeVersion, { contents: 4 }),
            new x(i.DocTypeReadVersion, { contents: 2 })
          ]
        }),
        new x(i.Segment, {
          isUnknownLength: !0,
          children: [
            new x(i.Info, {
              children: [
                new x(i.TimestampScale, {
                  contents: x.getUint32(
                    Math.floor(this._timestampScale)
                    // Base timestamps on sample rate vs. milliseconds https://www.matroska.org/technical/notes.html#timestamps
                  )
                }),
                new x(i.MuxingApp, {
                  contents: x.stringToByteArray(u)
                }),
                new x(i.WritingApp, {
                  contents: x.stringToByteArray(u)
                })
              ]
            }),
            new x(i.Tracks, {
              children: [
                new x(i.TrackEntry, {
                  children: [
                    new x(i.TrackNumber, { contents: 1 }),
                    new x(i.TrackUID, { contents: 1 }),
                    new x(i.FlagLacing, { contents: 0 }),
                    new x(i.CodecID, {
                      contents: x.stringToByteArray(this._codecId)
                    }),
                    new x(i.TrackType, { contents: 2 }),
                    // audio
                    new x(i.Audio, {
                      children: [
                        new x(i.Channels, { contents: t.channels }),
                        new x(i.SamplingFrequency, {
                          contents: x.getFloat64(t.sampleRate)
                        }),
                        new x(i.BitDepth, { contents: t.bitDepth })
                      ]
                    }),
                    ...this._getCodecSpecificTrack(t)
                  ]
                })
              ]
            })
          ]
        })
      ]
    }).contents;
  }
  getMediaSegment(t) {
    const e = t[0].totalSamples;
    return new x(i.Cluster, {
      children: [
        new x(i.Timestamp, {
          contents: x.getUintVariable(e)
          // Absolute timecode of the cluster
        }),
        ...t.map(
          ({ data: s, totalSamples: c }) => new x(i.SimpleBlock, {
            contents: [
              129,
              // track number
              x.getInt16(c - e),
              // timestamp relative to cluster Int16
              128,
              // No lacing
              s
              // ogg page contents
            ]
          })
        )
      ]
    }).contents;
  }
}
const C = () => {
}, B = (a, t = l) => {
  switch (a) {
    case "mpeg":
      return `${f}"${d}"`;
    case "aac":
      return `${f}"${g}"`;
    case "flac":
      return `${f}"${m}"`;
    case "vorbis":
      return `${y}"${w}"`;
    case "opus":
      return t === l ? `${y}"${h}"` : `${f}"${h}"`;
  }
};
class R {
  /**
   * @description Wraps audio data into media source API compatible containers
   * @param {string} mimeType Mimetype of the audio data to wrap
   * @param {string} options.codec Codec of the audio data to wrap
   * @param {object} options.preferredContainer Preferred audio container to output if multiple containers are available
   * @param {number} options.minBytesPerSegment Minimum number of bytes to process before returning a media segment
   * @param {number} options.minFramesPerSegment Minimum number of frames to process before returning a media segment
   * @param {number} options.minBytesPerSegment Minimum number of bytes to process before returning a media segment
   * @param {boolean} options.enableLogging Set to true to enable debug logging
   */
  constructor(t, e = {}) {
    this._inputMimeType = t, this.PREFERRED_CONTAINER = e.preferredContainer || l, this.MIN_FRAMES = e.minFramesPerSegment || 4, this.MAX_FRAMES = e.maxFramesPerSegment || 50, this.MIN_FRAMES_LENGTH = e.minBytesPerSegment || 1022, this.MAX_SAMPLES_PER_SEGMENT = 1 / 0, this._onMimeType = e.onMimeType || C, e.codec && (this._container = this._getContainer(e.codec), this._onMimeType(this._mimeType)), this._frames = [], this._codecParser = new T(t, {
      onCodec: (s) => {
        this._container = this._getContainer(s), this._onMimeType(this._mimeType);
      },
      onCodecUpdate: e.onCodecUpdate,
      enableLogging: e.enableLogging,
      enableFrameCRC32: !1
    });
  }
  /**
   * @public
   * @returns The mimetype being returned from MSEAudioWrapper
   */
  get mimeType() {
    return this._mimeType;
  }
  /**
   * @public
   * @returns The mimetype of the incoming audio data
   */
  get inputMimeType() {
    return this._inputMimeType;
  }
  /**
   * @public
   * @description Returns an iterator for the passed in codec data.
   * @param {Uint8Array | Array<Frame>} chunk Next chunk of codec data to read
   * @returns {Iterator} Iterator that operates over the codec data.
   * @yields {Uint8Array} Movie Fragments containing codec frames
   */
  *iterator(t) {
    t.constructor === Uint8Array ? yield* this._processFrames(
      [...this._codecParser.parseChunk(t)].flatMap(
        (e) => e.codecFrames || e
      )
    ) : Array.isArray(t) && (yield* this._processFrames(t));
  }
  /**
   * @private
   */
  *_processFrames(t) {
    if (this._frames.push(...t), this._frames.length) {
      const e = this._groupFrames();
      if (e.length) {
        this._sentInitialSegment || (this._sentInitialSegment = !0, yield this._container.getInitializationSegment(e[0][0]));
        for (const s of e)
          yield this._container.getMediaSegment(s);
      }
    }
  }
  /**
   * @private
   */
  _groupFrames() {
    const t = [[]];
    let e = t[0], s = 0;
    for (const c of this._frames)
      (e.length === this.MAX_FRAMES || s >= this.MAX_SAMPLES_PER_SEGMENT) && (s = 0, t.push(e = [])), e.push(c), s += c.samples;
    return this._frames = e.length < this.MIN_FRAMES || e.reduce((c, _) => c + _.data.length, 0) < this.MIN_FRAMES_LENGTH ? t.pop() : [], t;
  }
  /**
   * @private
   */
  _getContainer(t) {
    switch (this._mimeType = B(t, this.PREFERRED_CONTAINER), t) {
      case "mpeg":
        return new p(d);
      case "aac":
        return new p(g);
      case "flac":
        return new p(m);
      case "vorbis":
        return this.MAX_SAMPLES_PER_SEGMENT = 32767, new M(w);
      case "opus":
        return this.PREFERRED_CONTAINER === l ? (this.MAX_SAMPLES_PER_SEGMENT = 32767, new M(h)) : new p(h);
    }
  }
}
export {
  R as default,
  B as getWrappedMimeType
};
