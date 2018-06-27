var inputSize = [1920, 1080]
var video;

drawScene = () => {
	requestAnimationFrame(drawScene);
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	console.log(video);
	g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, g.RGBA, g.UNSIGNED_BYTE, video);
	g.useProgram(f);
	g.bindFramebuffer(g.FRAMEBUFFER, null);
	g.activeTexture(g.TEXTURE0);
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	g.uniform1i(f.tex, 0);
	var im = document.querySelector("img");
	g.uniform2f(f.size, inputSize[0], inputSize[1]);
	//g.bindTexture(g.TEXTURE_2D, null);

	g.bindBuffer(g.ARRAY_BUFFER, dummyBuffer);
	g.viewport(0, 0, window.innerWidth, window.innerHeight);
	g.vertexAttribPointer(f.pos, 2, g.FLOAT, 0, 0, 0);
	g.drawArrays(g.TRIANGLE_STRIP, 0, 4); //RENDER TO SCREEN

};

j = () => {
	_c = document.getElementsByTagName("canvas")[0];
	_c.height = window.innerHeight;
	_c.width = window.innerWidth;
	g = _c.getContext("webgl");


	video = document.querySelector('video');
	navigator.mediaDevices.getUserMedia({
		audio: false,
		video: {
			width: {min: inputSize[0]}, height: {min: inputSize[1]}
		}
	  }).then((stream)=>{video.srcObject = stream; video.play(); drawScene();}).catch((e)=>console.error(e));
	
  var fragmentShader = g.createShader(g.FRAGMENT_SHADER);
	g.shaderSource(fragmentShader, document.getElementById('fragment').innerHTML);
	g.compileShader(fragmentShader);
	console.log(g.getShaderInfoLog(fragmentShader));
	var vertexShader = g.createShader(g.VERTEX_SHADER);
	g.shaderSource(vertexShader, document.getElementById('vertex').innerHTML);
	g.compileShader(vertexShader);
	
	f = g.createProgram();
	g.attachShader(f, vertexShader);
	g.attachShader(f, fragmentShader);
	g.linkProgram(f);

	f.pos = g.getAttribLocation(f, "pos");
	g.enableVertexAttribArray(f.pos);
	f.tex = g.getUniformLocation(f, "tex");
	f.size = g.getUniformLocation(f, "size");
		
	dummyBuffer = g.createBuffer();
	g.bindBuffer(g.ARRAY_BUFFER, dummyBuffer);
	g.bufferData(g.ARRAY_BUFFER, new Float32Array([
             1.0, 1.0,
            -1.0, 1.0,
             1.0, -1.0,
            -1.0, -1.0,
        ]), g.STATIC_DRAW);

	postfxtex = g.createTexture();
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
	g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
	g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
	g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
	g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, inputSize[0], inputSize[1], 0, g.RGBA, g.UNSIGNED_BYTE, null);
	//g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, pph, ppw, g.RGBA, g.UNSIGNED_BYTE, tb);

	g.clearColor(.5, 0.0, 0.0, 1.0);
	//setInterval(restart, 60000);
};

onresize = () => {
	var _canvas = document.getElementsByTagName("canvas")[0];
	_canvas.height = innerHeight;
	_canvas.width = innerWidth;
	//drawScene();
	//drawScene();
};