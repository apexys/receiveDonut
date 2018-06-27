attribute vec3 pos;

varying vec2 vUv;

void main () {
  vUv = (pos.xy + 1.0) * 0.5;
  gl_Position = vec4(
    pos,
    1.0
  );
}