export class Noise {
  constructor(seed = 12345) {
    this.seed = seed;
    this.permutation = new Uint8Array(512);
    this._init();
  }

  _init() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    let seed = this.seed;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return (h & 1 ? -u : u) + (h & 2 ? -2 * v : 2 * v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;

    return this.lerp(
      this.lerp(
        this.grad(this.permutation[A], x, y),
        this.grad(this.permutation[B], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.permutation[A + 1], x, y - 1),
        this.grad(this.permutation[B + 1], x - 1, y - 1),
        u
      ),
      v
    );
  }

  get(x, y, options = {}) {
    const {
      octaves = 4,
      persistence = 0.5,
      frequency = 1,
    } = options;

    let total = 0;
    let amp = 1;
    let freq = frequency;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * freq, y * freq) * amp;
      amp *= persistence;
      freq *= 2;
    }

    return total;
  }
}

export default Noise;