precision mediump float;

// #pragma glslify: noise2 = require(glsl-noise/simplex/2d);
// #pragma glslify: noise3 = require(glsl-noise/simplex/3d);

varying vec2 vUv;
uniform sampler2D uTexCurrent;
uniform sampler2D uTexNext;
uniform float uProgress;


void main() {

  vec4 texCurrent = texture(uTexCurrent, vUv);
  vec4 texNext = texture(uTexNext, vUv);
  gl_FragColor = mix(texCurrent, texNext, uProgress);
}