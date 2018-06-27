precision highp float;

uniform sampler2D inTex;
uniform sampler2D colorRamp;
uniform float rampY;

varying vec2 vUv;

uniform mat3 projection;

void main() {
  vec2 tcoord = vUv - vec2(.5);
	vec2 rcoord = (vec3(tcoord, 1.0) * projection).xy;
	vec4 col = texture2D(inTex, rcoord);
	if(col.g > .5){
			  gl_FragColor = sqrt(texture2D(colorRamp, vec2(col.r, rampY)));
	}else{
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	}
}
