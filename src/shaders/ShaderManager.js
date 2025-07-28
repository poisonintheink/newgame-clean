import { Filter, GlProgram, Texture } from 'pixi.js';

export class ShaderManager {
  constructor() {
    this.shaders = new Map();
    this._defaultFilterVertex = `
      in vec2 aPosition;
      out vec2 vTextureCoord;

      uniform vec4 uInputSize;
      uniform vec4 uOutputFrame;
      uniform vec4 uOutputTexture;

      vec4 filterVertexPosition(void)
      {
          vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
          position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
          position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
          return vec4(position, 0.0, 1.0);
      }

      vec2 filterTextureCoord(void)
      {
          return aPosition * (uOutputFrame.zw * uInputSize.zw);
      }

      void main(void)
      {
          gl_Position = filterVertexPosition();
          vTextureCoord = filterTextureCoord();
      }
    `;

    this.initializeShaders();
  }

  initializeShaders() {
    this.createGlowShader();
    this.createWaveShader();
    this.createDissolveShader();
    this.createPoisonShader();
  }

  // ------- Glow -------
  createGlowShader() {
    const vertex = this._defaultFilterVertex;

    const fragment = `
      in vec2 vTextureCoord;

      uniform sampler2D uTexture;
      uniform float uTime;
      uniform vec3 uGlowColor;
      uniform float uGlowIntensity;

      void main(void)
      {
          vec4 color = texture2D(uTexture, vTextureCoord);

          // pulsing glow
          float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
          float glow = pulse * uGlowIntensity;

          // add glow scaled by alpha
          vec3 glowEffect = uGlowColor * glow * color.a;
          gl_FragColor = vec4(color.rgb + glowEffect, color.a);
      }
    `;

    const program = new GlProgram({ vertex, fragment });

    class GlowFilter extends Filter {
      constructor() {
        super({
          glProgram: program,
          resources: {
            glowUniforms: {
              uTime: { value: 0.0, type: 'f32' },
              uGlowColor: { value: [1.0, 0.5, 0.0], type: 'vec3<f32>' },
              uGlowIntensity: { value: 0.5, type: 'f32' }
            }
          }
        });
      }

      // convenience accessors (so EffectSystem can do shader.time += dt)
      get time() { return this.resources.glowUniforms.uniforms.uTime; }
      set time(v) { this.resources.glowUniforms.uniforms.uTime = v; }

      get glowColor() { return this.resources.glowUniforms.uniforms.uGlowColor; }
      set glowColor(v) { this.resources.glowUniforms.uniforms.uGlowColor = v; }

      get glowIntensity() { return this.resources.glowUniforms.uniforms.uGlowIntensity; }
      set glowIntensity(v) { this.resources.glowUniforms.uniforms.uGlowIntensity = v; }
    }

    this.shaders.set('glow', GlowFilter);
  }

  // ------- Wave -------
  createWaveShader() {
    const vertex = this._defaultFilterVertex;

    const fragment = `
      in vec2 vTextureCoord;

      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uAmplitude;
      uniform float uFrequency;

      void main(void)
      {
          vec2 uv = vTextureCoord;
          uv.x += sin(uv.y * uFrequency + uTime) * uAmplitude;
          gl_FragColor = texture2D(uTexture, uv);
      }
    `;

    const program = new GlProgram({ vertex, fragment });

    class WaveFilter extends Filter {
      constructor() {
        super({
          glProgram: program,
          resources: {
            waveUniforms: {
              uTime: { value: 0.0, type: 'f32' },
              uAmplitude: { value: 0.01, type: 'f32' },
              uFrequency: { value: 10.0, type: 'f32' }
            }
          }
        });
      }

      get time() { return this.resources.waveUniforms.uniforms.uTime; }
      set time(v) { this.resources.waveUniforms.uniforms.uTime = v; }

      get amplitude() { return this.resources.waveUniforms.uniforms.uAmplitude; }
      set amplitude(v) { this.resources.waveUniforms.uniforms.uAmplitude = v; }

      get frequency() { return this.resources.waveUniforms.uniforms.uFrequency; }
      set frequency(v) { this.resources.waveUniforms.uniforms.uFrequency = v; }
    }

    this.shaders.set('wave', WaveFilter);
  }

  // ------- Dissolve (needs a noise texture) -------
  createDissolveShader() {
    const vertex = this._defaultFilterVertex;

    const fragment = `
      in vec2 vTextureCoord;

      uniform sampler2D uTexture;
      uniform sampler2D uNoiseTexture;
      uniform float uProgress;
      uniform vec3 uEdgeColor;
      uniform float uEdgeWidth;

      void main(void)
      {
          vec4 base = texture2D(uTexture, vTextureCoord);
          float noise = texture2D(uNoiseTexture, vTextureCoord).r;

          float threshold = uProgress;
          float edge = smoothstep(threshold - uEdgeWidth, threshold, noise);
          float dissolve = smoothstep(threshold, threshold + uEdgeWidth, noise);

          vec3 finalColor = mix(uEdgeColor, base.rgb, edge);
          float alpha = base.a * dissolve;

          gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const program = new GlProgram({ vertex, fragment });

    class DissolveFilter extends Filter {
      constructor({ noiseTexture = null } = {}) {
        super({
          glProgram: program,
          resources: {
            // typed scalar/vector uniforms
            dissolveUniforms: {
              uProgress: { value: 0.0, type: 'f32' },
              uEdgeColor: { value: [1.0, 0.6, 0.2], type: 'vec3<f32>' },
              uEdgeWidth: { value: 0.05, type: 'f32' },
            },
            // sampler: set TextureSource on this key
            uNoiseTexture: noiseTexture ? Texture.from(noiseTexture).source : null,
          },
        });
      }

      // convenience props
      get progress() { return this.resources.dissolveUniforms.uniforms.uProgress; }
      set progress(v) { this.resources.dissolveUniforms.uniforms.uProgress = v; }

      get edgeColor() { return this.resources.dissolveUniforms.uniforms.uEdgeColor; }
      set edgeColor(v) { this.resources.dissolveUniforms.uniforms.uEdgeColor = v; }

      get edgeWidth() { return this.resources.dissolveUniforms.uniforms.uEdgeWidth; }
      set edgeWidth(v) { this.resources.dissolveUniforms.uniforms.uEdgeWidth = v; }

      // allow late-binding of the noise texture
      set noiseTexture(tex) {
        const t = typeof tex === 'string' ? Texture.from(tex) : tex;
        this.resources.uNoiseTexture = t ? t.source : null;
      }
    }

    this.shaders.set('dissolve', DissolveFilter);
  }

  // ------- Poison -------
  createPoisonShader() {
    const vertex = this._defaultFilterVertex;

    const fragment = `
      in vec2 vTextureCoord;

      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uIntensity;

      void main(void)
      {
          vec4 color = texture2D(uTexture, vTextureCoord);

          // green / purple push with wobble
          vec3 poisoned = color.rgb;
          poisoned.r *= 0.5;
          poisoned.g *= 1.2 + sin(uTime * 4.0) * 0.2;
          poisoned.b *= 0.7;

          float bubble = sin(vTextureCoord.y * 20.0 + uTime * 3.0) * 0.1;
          poisoned.g += bubble * uIntensity;

          gl_FragColor = vec4(mix(color.rgb, poisoned, uIntensity), color.a);
      }
    `;

    const program = new GlProgram({ vertex, fragment });

    class PoisonFilter extends Filter {
      constructor() {
        super({
          glProgram: program,
          resources: {
            poisonUniforms: {
              uTime: { value: 0.0, type: 'f32' },
              uIntensity: { value: 0.75, type: 'f32' },
            }
          }
        });
      }

      get time() { return this.resources.poisonUniforms.uniforms.uTime; }
      set time(v) { this.resources.poisonUniforms.uniforms.uTime = v; }

      get intensity() { return this.resources.poisonUniforms.uniforms.uIntensity; }
      set intensity(v) { this.resources.poisonUniforms.uniforms.uIntensity = v; }
    }

    this.shaders.set('poison', PoisonFilter);
  }

  getShader(name, options = {}) {
    const ShaderClass = this.shaders.get(name);
    if (ShaderClass) {
      return new ShaderClass(options);
    }
    return null;
  }
}
