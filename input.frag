precision mediump float;

#pragma glslify: noise2 = require(glsl-noise/simplex/2d);
#pragma glslify: noise3 = require(glsl-noise/simplex/3d);

varying vec2 vUv;
uniform sampler2D uTexCurrent;
uniform sampler2D uTexNext;
uniform float uProgress;
uniform vec2 uNoiseScale;

void main() {

    // n => -1 〜 1
    float n = noise2(vec2(vUv.x * uNoiseScale.x, vUv.y * uNoiseScale.y));
    // n => -1 〜 0.5
    n = n * 0.5 - 0.5;

    //uProgress => 0 〜 1
    //uProgressが1の時、n + uProgressの取り得る値の範囲は0〜1になる
    n = n + uProgress;
    //閾値を超えたものは1、超えないものは0を返す
    n = step(0.0, n);

    vec4 texCurrent = texture(uTexCurrent, vUv);
    vec4 texNext = texture(uTexNext, vUv);
  //第三引数が0の場合はtexCurrent,1の場合はtexNextを返す
    gl_FragColor = mix(texCurrent, texNext, n);
}