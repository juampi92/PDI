if ( engine == undefined ) throw "Se requiere al motor";

	// ************************
	// 		Imagenes
	// ************************

	engine.Imagen.prototype.fromVideo = function( video ){
		var canvas = document.createElement('canvas');
		canvas.width = this.width = this.img.width = video.width;
		canvas.height = this.height = this.img.height = video.height;

		var context = canvas.getContext('2d');
		context.drawImage(video,0,0,this.width,this.height);

		this.imgData = context.getImageData(0, 0,this.width,this.height);
	};


	// ************************************************
	// 					Video Feed
	// ************************************************

	engine.Video = {
		el: null,
		thread: null,
		imags: { prev: null, now: null},
		opts: {
			streaming: false,
        	width: 100,
        	height: 0
		},
		init: function(){
			engine.Video.el = document.getElementsByTagName('video')[0];

			engine.Video.opts.width = $(engine.Video.el).parent().innerWidth();

			navigator.getMedia = ( navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia);

			navigator.getMedia(
				{
					video: true,
					audio: false
				},
				function(stream) {
					if (navigator.mozGetUserMedia) {
						engine.Video.el.mozSrcObject = stream;
					} else {
						var vendorURL = window.URL || window.webkitURL;
						engine.Video.el.src = vendorURL.createObjectURL(stream);
					}
					engine.Video.el.play();
				},
				function(err) {
					console.log("An error occured! " + err);
				}
			);

			this.setEventos();
		},
		setEventos: function(){
			engine.Video.el.addEventListener('canplay', function(ev){
				if ( ! engine.Video.opts.streaming ) {
					var $vid = $(engine.Video.el);

					engine.Video.opts.height = ( engine.Video.el.videoHeight > 0 ) ? engine.Video.el.videoHeight : engine.Video.el.offsetHeight;
					engine.Video.opts.width = ( engine.Video.el.videoWidth > 0 ) ? engine.Video.el.videoWidth : engine.Video.el.offsetWidth;

					// Resize
					var w = $vid.parent().innerWidth() - 10;
					//if ( w < engine.Video.opts.width ){
						engine.Video.opts.height *=  w/engine.Video.opts.width;
						engine.Video.opts.width = w;
					//}

					engine.Video.el.setAttribute('width', engine.Video.opts.width);
					engine.Video.el.setAttribute('height', engine.Video.opts.height);
					
					engine.Video.opts.streaming = true;
				}
			}, false);
		},
		processStart: function(callback){
			engine.Video.thread = setInterval(engine.Video.processRun,1000,callback);
			engine.Video.el.play();
		},
		processEnd: function(){
			if ( engine.Video.thread ) clearInterval(engine.Video.thread);
			engine.Video.el.pause();
		},
		processRun: function(callback){

			if ( engine.Video.imags.now != null )
				engine.Video.imags.prev = engine.Video.imags.now;

			engine.Video.imags.now = new Imagen();
			engine.Video.imags.now.fromengine.Video(engine.Video.el);

			if ( engine.Video.imags.prev != null )
				callback(engine.Video.imags.prev,engine.Video.imags.now);
		}
	};


	// ************************************************
	// 						Process
	// ************************************************

	engine.PDV = function( source1 , source2 ){
		this.source1 = source1;
		this.source2 = source2;
		this.events = {};
		this.dest = null;

		return this;
	};

	engine.PDV.prototype.clone = function(){
		this.dest = this.source1.clone();
	};

	engine.PDV.prototype.loop = function(callback){ // Loop parejo
		this.clone();

		var self = this,
			pixels_src2 = this.source2.imgData.data,
			pixels_dest = this.dest.imgData.data,
    		numPixels = this.source1.width * this.source1.height;

    	this.source1.loop(function(i,x,y,r,g,b){
    		var rgb = callback(
    			{r:r,g:g,b:b},
    			{r:pixels_src2[i],g:pixels_src2[i+1],b:pixels_src2[i+2]},
    			x , y
    		);
			if ( !rgb ) rgb = {r:r,g:g,b:b};
		    pixels_dest[i] = rgb.r;
		    pixels_dest[i+1] = rgb.g; // Green
		    pixels_dest[i+2] = rgb.b; // Blue
    	});
    	
		if ( this.events["end"] ) this.events["end"]();
		return;
	};

	engine.PDV.prototype.on = function( trigger , callback ){
		// Eventos: end
		this.events[trigger] = callback;
	};

	engine.PDV.prototype.render = function(){
		engine.MyCanvas.renderImg(this.dest);
	};
