var inputSize = [1280, 720]
var video;
var rbb;
var paused = false;
var overlay = undefined;
var framet = 0;
var outer_ring_size = 3.0;
var hcont = undefined;
var median = 0;

drawScene = () => {
	outer_ring_size = parseFloat(document.getElementById('size').value);
	document.getElementById('rangeinfo').innerText = outer_ring_size;
	if(paused){requestAnimationFrame(drawScene); return;}
	var t1 = performance.now();
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, g.RGBA, g.UNSIGNED_BYTE, video);
	g.useProgram(f);
	g.bindFramebuffer(g.FRAMEBUFFER, null);
	g.activeTexture(g.TEXTURE0);
	g.bindTexture(g.TEXTURE_2D, postfxtex);
	g.uniform1i(f.tex, 0);
	g.uniform1f(f.size_1,outer_ring_size);
	//var im = document.querySelector("img");
	g.uniform2f(f.size, inputSize[0], inputSize[1]);
	g.bindBuffer(g.ARRAY_BUFFER, dummyBuffer);
	g.viewport(0, 0, window.innerWidth, window.innerHeight);
	g.vertexAttribPointer(f.pos, 2, g.FLOAT, 0, 0, 0);
	g.drawArrays(g.TRIANGLE_STRIP, 0, 4); //RENDER TO SCREEN
	g.readPixels(0, 0, _c.width, _c.height, g.RGBA, g.UNSIGNED_BYTE, rbb);
	finds = []
	var radius = outer_ring_size;
	var distf = (x, y, box) => {
		if(x > box.xmax + radius)return false;
		if(x < box.xmin - radius)return false;
		if(y > box.ymax + radius)return false;
		if(y < box.ymin - radius)return false;
		return true;
	}
	var min = 255;
	var max = 0;
	for(var i = 0; i < rbb.length; i += 4){
		if(rbb[i+2] > max){
			max = rbb[i+2];
		}
		if(rbb[i+2] < min){
			min = rbb[i+2];
		}
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
	median =  0.5//(((max - min) / 256) * 2) - 1

	//if(finds.length > 0)console.log(finds);
	overlay.clearRect(0,0,inputSize[0],inputSize[1]);
	for(var i = 0; i < finds.length; i++){
		overlay.strokeStyle = "red";
		var center = [(finds[i].xmax + finds[i].xmin) / 2, (finds[i].ymax + finds[i].ymin) / 2];
		overlay.strokeText(i,center[0]+30,center[1]+30);
		overlay.beginPath();
		overlay.moveTo(center[0],center[1]);
		overlay.arc(center[0],center[1],finds[i].xmax-center[0],0,2*Math.PI);

		var data = getMarkerData(center);
		if(data){
			overlay.strokeText("ID: " + data.number,center[0]+30,center[1]+45);
			overlay.strokeText("Code: " + data.code,center[0]+30,center[1]+60);
			overlay.moveTo(center[0], center[1]);
			overlay.lineTo(center[0] + (Math.cos(data.orientation) * 50), center[1] + (Math.sin(data.orientation) * 50));
		}

		overlay.stroke();

	}
	var t2 = performance.now();
	overlay.fillStyle = "white";
	framet = (framet * 0.9) + ((t2-t1) * 0.1)
	overlay.fillText((framet+"").substring(0,3) + "ms",0,12);
	overlay.fillText(`min: ${min}, max: ${max}`,0,24);
	overlay.fillText(`Pixel 0: ${samplePixel2(inputSize[0]/2,inputSize[1]/2)}, median: ${median}`,0,36);
	overlay.fillStyle = "white";
	overlay.fillRect(30,30,20,20);
	requestAnimationFrame(drawScene);	
};

let samplePixel2 = (x,y) => {
	x = x | 0;
	y = y | 0;
	var i = y * inputSize[0] + x; //Get pixel index
	i = i * 4;//Four channels
	i = i + 2;//We'd like the blue one
	i = i | 0;
	return ((rbb[i] / 255) * 2) - 1;
}

const sampleCount = 360;
var markers = [];
for(var j = 0; j < 32; j++){
	var t = [1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0];
	if(! (j & 1)){
		t[5] = 0;
	}
	if(! (j & 2)){
		t[8] = 0;
	}
	if(! (j & 4)){
		t[11] = 0;
	}
	if(! (j & 8)){
		t[14] = 0;
	}
	if(! (j & 16)){
		t[17] = 0;
	}
	markers.push(t);
}



getMarkerData = (c) => {
	var count = 5 * 3 + 1 + 4

	const s = 21;


	


	var samples = new Float32Array(sampleCount);
	var pattern = new Float32Array(sampleCount);
	var min = 10000, max = -10000;
	let get_x = (angle,radius) => Math.min(inputSize[0], Math.max(c[0] + (Math.cos(angle) * radius),0));
	let get_y = (angle,radius) => Math.min(inputSize[1], Math.max( c[1] + (Math.sin(angle) * radius),0));
	let sampleRadiusDistance = (angle, radius) => (samplePixel(get_x(angle,radius), get_y(angle,radius)) + samplePixel(get_x(angle,radius + 1), get_y(angle,radius + 1)) + samplePixel(get_x(angle,radius + 2), get_y(angle,radius + 2))) / 3;
	for(var i = 0; i < sampleCount; i++){
		var angle = (i / sampleCount) * 2 * Math.PI;
		var distance = 1;
		while(sampleRadiusDistance(angle,distance) > median && distance < 100){
			distance++;
			overlay.fillStyle = "green";
			overlay.fillRect(get_x(angle,distance),get_y(angle,distance),1,1);
		}//Skip center
		var d0 = distance; //Distance from center to outer rim
		while(sampleRadiusDistance(angle,distance) < median && distance < 100){
			distance++;
			overlay.fillStyle = "orange";
			overlay.fillRect(get_x(angle,distance),get_y(angle,distance),1,1);
		}//Skip black ring
		
		var d1 = distance;
		var d2 = distance + (d1 - d0);
		var d2_5 = distance + ((d1 - d0) * 1.3);

		while(sampleRadiusDistance(angle,distance) > median && distance < 30){
			distance++;
			overlay.fillStyle = "green";
			overlay.fillRect(get_x(angle,distance),get_y(angle,distance),1,1);
		}

		samples[i] = distance;
		/*overlay.fillStyle = "white";
		overlay.fillRect(get_x(angle,d2_5),get_y(angle,d2_5),2,2);*/
		//samples[i] = samplePixel(c[0] + Math.cos(x) * s, c[1] + Math.sin(x) * s);
		//samples[i] += samplePixel(c[0] + Math.cos(x) * (s-1), c[1] + Math.sin(x) * (s-1));
		//samples[i] += samplePixel(c[0] + Math.cos(x) * (s + 1), c[1] + Math.sin(x) * (s+1));
		
		if(samples[i] < min) min = samples[i];
		if(samples[i] > max) max = samples[i];
		

		while(sampleRadiusDistance(angle,distance) < median && distance < 30){
			distance++;
			pattern[i] = 1;
			overlay.fillStyle = "red";
			overlay.fillRect(get_x(angle,distance),get_y(angle,distance),1,1);
		}
	}
	var mid = (min + max) / 2
	//console.log(min,max);

	//Subsample filter
	/*var subsampled = new Float32Array(sampleCount/ 4);
	for(var i = 0; i < sampleCount; i++){
		subsampled[i/4 | 0] += samples[i] * 0.25;
	}*/

	//make pattern start at biggest black block
    
    var biggest_black_start = 0;
    var biggest_black_length = 0;
    
    for( var vI = 0; vI < pattern.length; ++vI ){
		
        var current_black_start = vI;
        var current_black_length = 0;
        
		for(; pattern[vI%pattern.length]; ++vI){
			++current_black_length;
		}
        
        if(biggest_black_length < current_black_length){
            biggest_black_start = current_black_start;
            biggest_black_length = current_black_length
        }
	}
    
	console.log(biggest_black_start + " " + biggest_black_length);
	
    var temp = [];
    for(var i = 0; i < pattern.length; i++){
        temp[i] = pattern[(i+biggest_black_start)%pattern.length];
    }
    pattern = temp;

	hcont.clearRect(0, 0, 360, 32);
	for(var i = 0; i < sampleCount; i++){
		//hcont.fillStyle = `rgb(0, 0, ${(subsampled[i/4|0] - min) * 255 / (max - min)})`;
		var val = pattern[i]// + samples[i + 1 % 360] + samples[i - 1 % 360];
		//val /= 3;
		hcont.fillStyle = val < 1 ? 'white' : 'black';
		if(i == biggest_black_start){
			hcont.fillStyle = 'red';
		}
		hcont.fillRect(i , 0, 1, 32);
	}

	//console.log(pattern);
	var short_pattern = new Float32Array(20);
	for(var i = 0; i < 20; i++){
		var value = 0;
		for(var j = 0; j  < (sampleCount / 20); j++){
			value += pattern[i * (sampleCount / 20) + j];
		}
		value = value / (sampleCount / 20.0);
		short_pattern[i] = value;
	}
	//console.log(short_pattern);

	var error_numbers = new Float32Array(32);
	var rotations = new Float32Array(32);
	var minerrors = sampleCount;
	var mindex = 0
	for(var pattern_number = 0; pattern_number < 32; pattern_number++){
		error_numbers[pattern_number] = sampleCount;
		for(var j = 0; j < 20; j++){
			var errors = 0;
			for(var i = 0; i < 20; i++){
				errors += Math.abs(short_pattern[i] - markers[pattern_number][i]);
			}
			if(errors < error_numbers[pattern_number]){
				error_numbers[pattern_number] = errors;
				rotations[pattern_number] = j;
				if(errors < minerrors){
					mindex = pattern_number;
					minerrors = errors;
				}
			}

            // ERROR AFTER?????????????????????????????????????????????????????????????????????????????????????
			
			var temp = short_pattern[0];
			for(var i = 0; i < 19; i++){
				short_pattern[i] = short_pattern[i+1];
			}
			short_pattern[19] = temp;

		}
	}

	for(var i = 0; i < 20; i++){
		//hcont.fillStyle = `rgb(0, 0, ${(subsampled[i/4|0] - min) * 255 / (max - min)})`;
		var val = markers[29][i]// + samples[i + 1 % 360] + samples[i - 1 % 360];
		//val /= 3;
		hcont.fillStyle = val < 1 ? 'pink' : 'black';
		hcont.fillRect(i * (sampleCount / 20) , 16, (sampleCount / 20), 16);
	}

	var data = {
		orientation: rotations[mindex],
		code: minerrors,
		number: mindex
	}
	return data;



/*
	var readSample = i => (samples[i] + samples[i + 1 % 360] + samples[i - 1 % 360]) / 3;
	var sampleHigh = i => (samples[i] + samples[i + 1 % 360] + samples[i - 1 % 360]) / 3 > mid;
	var sampleLow = i => (samples[i] + samples[i + 1 % 360] + samples[i - 1 % 360]) / 3 < mid;

	//Skip possibly fragmented first sample
	var offset = 0;
	var j = 0;
	while(sampleLow(j)) j++;

	var segments = [];
	var inSegment = false;
	var segStart;
	var segL;
	var segid = 0;
	var longestLength = 0;
	var longestId = 0;
	for(var i = 0; i < sampleCount; i++){
		if(sampleLow(i + offset % sampleCount)){
			if(!inSegment){//New Segment
				inSegment = true;
				segStart = i;
				segL = 0;
			}else{
				segL ++;
			}
		}else{
			if(inSegment){
				var seg = {
					start: segStart / sampleCount * 100,
					length: segL / sampleCount * 100,
					id: segid
				};
				segments.push(seg);
				segid ++;
				inSegment = false;
				if(seg.length > longestLength){
					longestLength = seg.length;
					longestId = seg.id;
				}
			}
		}
	}

	if(segments.length == 6){

		var arrayRotate = (arr, count) => {
			count -= arr.length * Math.floor(count / arr.length);
			arr.push.apply(arr, arr.splice(0, count));
			return arr;
		};

		if(longestId != 0){
		segments = arrayRotate(segments,-longestId);
		};

		var avgl = 0;
		for(var i = 1; i < 6; i++){
			avgl += segments[i].length / 5;
		}

		var longest = segments.shift();

		var code = segments.map(s => s.length > avgl ? 'L' : 'S').join('');
		var number = segments.reduce((prev,current,index) => prev + (current.length < avgl ? 0: 2 ** (4-index)),0);

		var data = {
			orientation: longest.start / 50 * Math.PI + (1.5 * Math.PI),
			code: code,
			number: number
		}
		return data;
	}else{
		return null;
		//TODO possibly fix fragmented segments
	}
*/
	//console.log(segments);

	
	/*
	var flanks = []
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

drawImage = () => {
	overlay.clearRect(0,0,inputSize[0],inputSize[1]);
	for(var x = 0; x < inputSize[0]; x++){
		for(var y = 0; y < inputSize[1]; y++){
			var pxdata = samplePixel(x,y);
			overlay.fillStyle = pxdata > median? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
			overlay.fillRect(x,y,1,1);
		}
	}
}

samplePixel = (x, y) => {
	var x2 = (x / inputSize[0] * _c.width) | 0;
	var y2 =_c.height -  (y / inputSize[1] * _c.height) | 0;
	return (rbb[(((y2 * _c.width) + x2) * 4) + 2] / 255) * 2 - 1;
 }


var init = () => {
	hcont = document.getElementById("hiss").getContext("2d");


	document.body.addEventListener("click", ()=>{paused = !paused});
	window._c = document.getElementById('3d');
	_c.height =  inputSize[1]// + 'px';//window.innerHeight;
	_c.width = inputSize[0]// + 'px';//window.innerWidth;

	overlay = document.getElementById('overlay');
	overlay.height = inputSize[1];
	overlay.width = inputSize[0];
	overlay = overlay.getContext('2d');
	overlay.font = "12px monospace";

	document.body.addEventListener('keydown',e => {
		if(e.keyCode == 13){
			paused = true;
			drawImage();
		}
	});

	/*document.body.addEventListener('mousemove', e => {
		var r = _c.getBoundingClientRect();
		if(e.layerX > r.x && e.layerY > r.y && e.layerX < (e.x + e.width) && e.layerY < (e.y + e.height)){

		}
	});*/

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
	f.size_1 = g.getUniformLocation(f,"size_1");
		
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
