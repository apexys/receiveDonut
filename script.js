var inputSize = [640, 480]
var video;
var rbb;
var paused = false;

drawScene = () => {
	if(paused){requestAnimationFrame(drawScene); return;}
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, g.RGBA, g.UNSIGNED_BYTE, video);
	g.useProgram(f);
	g.bindFramebuffer(g.FRAMEBUFFER, null);
	g.activeTexture(g.TEXTURE0);
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	g.uniform1i(f.tex, 0);
	//var im = document.querySelector("img");
	g.uniform2f(f.size, inputSize[0], inputSize[1]);
	g.bindBuffer(g.ARRAY_BUFFER, dummyBuffer);
	g.viewport(0, 0, window.innerWidth, window.innerHeight);
	g.vertexAttribPointer(f.pos, 2, g.FLOAT, 0, 0, 0);
	g.drawArrays(g.TRIANGLE_STRIP, 0, 4); //RENDER TO SCREEN
	g.readPixels(0, 0, _c.width, _c.height, g.RGBA, g.UNSIGNED_BYTE, rbb);
	finds = []
	var radius = 20;
	var distf = (x, y, box) => {
		if(x > box.xmax + radius)return false;
		if(x < box.xmin - radius)return false;
		if(y > box.ymax + radius)return false;
		if(y < box.ymin - radius)return false;
		return true;
	}
	for(var i = 0; i < rbb.length; i += 4){
		if(rbb[i] > 0){
			var __y = (1 - (Math.floor(i / 4 / _c.width) / _c.height)) * inputSize[1];
			var __x = ((i / 4) % _c.width) / _c.width * inputSize[0];
			var found = false;
			for(var j = 0; j < finds.length; j++){
				if(distf(__x, __y, finds[j])){
					if(finds[j].xmin > __x)finds[j].xmin = __x;
					if(finds[j].xmax < __x)finds[j].xmax = __x;
					if(finds[j].ymin > __y)finds[j].ymin = __y;
					if(finds[j].ymax < __y)finds[j].ymax = __y;
				found = true;
				break;
				}
			}
			if(!found)finds.push({xmin: __x, xmax: __x, ymin: __y, ymax: __y});
		}
	}
	//if(finds.length > 0)console.log(finds);
	var markers = document.getElementsByClassName("marker");
	for(var i = 0; i < finds.length && i < markers.length; i++){
		var c = [(finds[i].xmax + finds[i].xmin) / 2, (finds[i].ymax + finds[i].ymin) / 2];
		markers[i].style.width = (42 / inputSize[0] * 100) + "vw";
		markers[i].style.height = (42 / inputSize[1] * 100) + "vh";
		markers[i].style.left = ((c[0] - 21) / inputSize[0] * 100) + "vw";
		markers[i].style.top = ((c[1] - 21) / inputSize[1] * 100) + "vh";
		markers[i].style.display = "block";
		markers[i].innerHTML = "find: " + i + "<br>id:" + 0;
		getMarkerData(c);
	}
	for(i=i;i < markers.length; i++){
		markers[i].style.display = "none";
	}

	requestAnimationFrame(drawScene);	
};

getMarkerData = (c) => {
	var count = 5 * 3 + 1 + 4

	const s = 21;
	const sampleCount = 360;
	var samples = new Float32Array(sampleCount);
	var min = 10, max = -10;
	for(var i = 0; i < sampleCount; i++){
		var x = i / sampleCount * 2 * Math.PI;
		samples[i] = samplePixel(c[0] + Math.cos(x) * s, c[1] + Math.sin(x) * s);
		//samples[i] += samplePixel(c[0] + Math.cos(x) * (s-1), c[1] + Math.sin(x) * (s-1));
		//samples[i] += samplePixel(c[0] + Math.cos(x) * (s + 1), c[1] + Math.sin(x) * (s+1));
		
		if(samples[i] < min) min = samples[i];
		if(samples[i] > max) max = samples[i];
	}
	hcont.clearRect(0, 0, 360, 32);
	for(var i = 0; i < sampleCount; i++){
		hcont.fillStyle = `rgb(0, 0, ${(samples[i] - min) * 255 / (max - min)})`;
		hcont.fillRect(i, 0, 1, 32);
	}
	/*
	var flanks = []
	var mid = (min + max) / 2
	var startlevel = samples[0] < mid
	var lastlevel = startlevel;
	for(var i = 1; i < sampleCount; i ++){
		if((samples[i] < mid) != lastlevel){
			flanks.push(i);
		}
		lastlevel = samples[i] < mid;
	}
	if(samples[sampleCount - 1] < mid != startlevel)flanks.push(0);
	console.log(flanks);*/
}

samplePixel = (x, y) => {
	var x2 = (x / inputSize[0] * _c.width) | 0;
	var y2 = (y / inputSize[1] * _c.height) | 0;
	return (rbb[(((y2 * _c.width) + x2) * 4) + 2] / 255) * 2 - 1;
 }

j = () => {
	window.hcont = document.getElementById("hiss").getContext("2d");


	document.body.addEventListener("click", ()=>{paused = !paused});
	window._c = document.getElementsByTagName("canvas")[0];
	_c.height = window.innerHeight;
	_c.width = window.innerWidth;
	g = _c.getContext("webgl");
	rbb = new Uint8Array(4 * _c.height * _c.width);

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
	_c.height = innerHeight;
	_c.width = innerWidth;
	rbb = new Uint8Array(4 * _c.height * _c.width);
};