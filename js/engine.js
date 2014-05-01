var engine = {};

	engine.MyCanvas = {
		el: null,
		context: null,
		init: function(){
			this.el = document.getElementById('canvas');
			this.context = this.el.getContext('2d');

			// Inicializar canvas
			var $parent = $(this.el).parent();
			this.el.width = $parent.innerWidth();
			this.el.height = $parent.innerHeight() - 50;
		},
		reset: function(){
			this.el.width = this.el.width;
		},
		renderImg: function( imag , keep ){
			// Clear screen
			if ( ! keep ) engine.MyCanvas.reset();
			
			// Center image:
			var x = ( engine.MyCanvas.el.width - imag.width ) / 2,
				y = ( engine.MyCanvas.el.height - imag.height ) / 2;

			engine.MyCanvas.context.putImageData( imag.imgData , x,y );
		},
		getCurrentData: function(){
			return this.context.getImageData(0, 0, engine.MyCanvas.el.width, engine.MyCanvas.el.height);
		}
	};

	// ************************************************
	// 						Imagen
	// ************************************************

	engine.Imagen = function( src ){
		this.img = new Image();
		this.loaded = false;
		this.src = src;
		this.imgData = null;
		this.width = this.height = 0;
		this.histograma = null;
		this.onEvents = {};

		return this;
	};

	engine.Imagen.prototype.create = function( width , height ){
		// Create empty image
		var canvas = document.createElement('canvas');
		
		this.width = this.img.width = canvas.width = width;
		this.height = this.img.height = canvas.height = height;

		this.imgData = canvas.getContext('2d').createImageData(width,height);
	};

	engine.Imagen.prototype.load = function( onload , remote ) {
		var self = this;

		this.img.onload = function(){
			self.getImageData(onload);
			self.loaded = true;
			self.trigger("load");
		};
		
		if ( ! remote ) {
			this.img.src = this.src;
		} else {
			// Fetch base64 of remote Image
			$.getImageData({
				url: self.src,
				server: "./getImage.php",
				success: function(image){
					image.onload = self.img.onload;
					self.img = image;
					self.img.onload();
					self.trigger("remote");
				},
				error: function(xhr, text_status){
				  // Handle your error here
				  self.trigger("error",xhr,text_status);
				}
			});
		};
	};

	engine.Imagen.prototype.clone = function(){
		var ret = new engine.Imagen();

    	var canvas = document.createElement('canvas');
		
		ret.width = ret.img.width = canvas.width = this.width;
		ret.height = ret.img.height = canvas.height = this.height;

		var context = canvas.getContext('2d');

		context.putImageData(this.imgData,0,0);
		ret.imgData = context.getImageData(0, 0, this.width,this.height);
    	return ret;
	};

	engine.Imagen.prototype.getImageData = function( onload ){
		var canvas = document.createElement('canvas');

		canvas.width = this.img.width;
		canvas.height = this.img.height;

		//Resize image:
		var w = this.img.width,
			h = this.img.height;

		if ( w > engine.MyCanvas.el.width ){
			h = ( ( engine.MyCanvas.el.width * h ) / w );
			w = engine.MyCanvas.el.width;
		}
		if ( h > engine.MyCanvas.el.height ){
			w = ( ( engine.MyCanvas.el.height * w ) / h );
			h = engine.MyCanvas.el.height;
		}

		w = Math.floor(w);
		h = Math.floor(h);

		var context = canvas.getContext('2d');
		context.drawImage(this.img,0,0,w,h);

		this.imgData = context.getImageData(0, 0, w,h);

		this.width = w;
		this.height = h;

		if ( onload ) onload(this);
	};

	engine.Imagen.prototype.loop = function(callback){
		var i = 0;
		for ( var y = 0 ; y < this.height ; y++ )
    		for ( var x = 0 ; x < this.width ; x++ ){
    			callback(i,x,y,this.imgData.data[i],this.imgData.data[i+1],this.imgData.data[i+2]);
			    i += 4;
    		}
	};

	engine.Imagen.prototype.resize = function(newWidth,newHeight){};

	engine.Imagen.prototype.getBase64 = function(){
		var canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;

		var context = canvas.getContext('2d');

		context.putImageData(this.imgData,0,0);
		return canvas.toDataURL();
	};

	engine.Imagen.prototype.getPixelBase = function(x,y){
		return ((y - 1) * (this.img.width * 4)) + ((x - 1) * 4);
	};

	engine.Imagen.prototype.getColor = function(x,y) {
		var pixBase = this.getPixelBase(x,y);
		return {r:this.imgData.data[pixBase],
				g:this.imgData.data[pixBase+1],
				b:this.imgData.data[pixBase+2],
				a:this.imgData.data[pixBase+3]};
	};

	engine.Imagen.prototype.setPixel = function(x,y,color){
		var pixBase = this.getPixelBase(x,y);
		if ( ! $.isArray(color) && $.isNumeric(color) ) color = {r:color,g:color,b:color};

		this.imgData.data[pixBase] = color.r;
		this.imgData.data[pixBase+1] = color.g;
		this.imgData.data[pixBase+2] = color.b;
		this.imgData.data[pixBase+3] = 255;
	};

	engine.Imagen.prototype.HexToRGB = function(hex){
		// Check if rgb
		if ( $.isArray(hex) ) return hex; // Ya es rgb

		var rgb = {};
		rgb.r = parseInt(hex.substr(1,2),16);
		rgb.g = parseInt(hex.substr(3,2),16);
		rgb.b = parseInt(hex.substr(5,2),16);

		return rgb;
	};

	engine.Imagen.prototype.RGBtoHex = function(rgb){
		// Check if hex
		if ( rgb.substr(0,1) == "#" ) return rgb; // Ya es hex

		var hex = "#";
		hex += rgb.r.toString(16);
		hex += rgb.g.toString(16);
		hex += rgb.b.toString(16);

		return hex;
	};

	engine.Imagen.prototype.on = function( event, callback ){
		this.onEvents[event] = callback;
	};

	engine.Imagen.prototype.trigger = function(event , param1, param2, param3){
		if ( this.onEvents[event] ) this.onEvents[event](param1,param2,param3);
	};

	// ************************************************
	// 				Cargar Imagen desde Archivo
	// ************************************************

	engine.ImageFileLoad = function(src,callback){
		//	Prevent any non-image file type from being read.
		if(!src.type.match(/image.*/)){
			console.log("The dropped file is not an image: ", src.type);
			return;
		}

		//	Create our FileReader and run the results through the render function.
		var reader = new FileReader();
		reader.onload = function(e){
			callback(e.target.result);
		};
		reader.readAsDataURL(src);
	};

	// ************************************************
	// 					Color Helper
	// ************************************************

	engine.Color = {
		HexToRGB: function(hex){
			// Check if rgb
			if ( $.isArray(hex) ) return hex; // Ya es rgb

			var rgb = {};
			rgb.r = parseInt(hex.substr(1,2),16);
			rgb.g = parseInt(hex.substr(3,2),16);
			rgb.b = parseInt(hex.substr(5,2),16);

			return rgb;
		},
		RGBtoHex: function(rgb){
			// Check if hex
			if ( rgb.substr(0,1) == "#" ) return rgb; // Ya es hex

			var hex = "#";
			hex += rgb.r.toString(16);
			hex += rgb.g.toString(16);
			hex += rgb.b.toString(16);

			return hex;
		},
		RGBtoHSV: function(r,g,b){
			var hsv = {},
				min, max, delta;

			min = Math.min( r, g, b );
			max = Math.max( r, g, b );
			hsv.v = max;				// v

			delta = max - min;

			if( max != 0 )
				hsv.s = delta / max;		// s
			else {
				// r = g = b = 0		// s = 0, v is undefined
				hsv.s = 0;
				hsv.h = -1;
				return hsv;
			}

			if( r == max )
				hsv.h = ( g - b ) / delta;		// between yellow & magenta
			else if( g == max )
				hsv.h = 2 + ( b - r ) / delta;	// between cyan & yellow
			else
				hsv.h = 4 + ( r - g ) / delta;	// between magenta & cyan

			hsv.h *= 60;				// degrees
			if( hsv.h < 0 )
				hsv.h += 360;

			return hsv;
		},
		HSVtoRGB: function(h,s,v){
			var rgb = {},
				i,f,p,q,t;

			if( s == 0 ) {
				// achromatic (grey)
				rgb.r = rgb.g = rgb.b = v;
				return;
			}

			h /= 60;			// sector 0 to 5
			i = Math.floor( h );
			f = h - i;			// factorial part of h
			p = v * ( 1 - s );
			q = v * ( 1 - s * f );
			t = v * ( 1 - s * ( 1 - f ) );

			switch( i ) {
				case 0:
					rgb.r = v;
					rgb.g = t;
					rgb.b = p;
					break;
				case 1:
					rgb.r = q;
					rgb.g = v;
					rgb.b = p;
					break;
				case 2:
					rgb.r = p;
					rgb.g = v;
					rgb.b = t;
					break;
				case 3:
					rgb.r = p;
					rgb.g = q;
					rgb.b = v;
					break;
				case 4:
					rgb.r = t;
					rgb.g = p;
					rgb.b = v;
					break;
				default:		// case 5:
					rgb.r = v;
					rgb.g = p;
					rgb.b = q;
					break;
			}
			return rgb;
		}
	};

	// ************************************************
	// 						PDI
	// ************************************************

	engine.PDI = function( source ){
		this.source = source;
		this.events = {};
		this.dest = null;

		return this;
	};

	engine.PDI.snapshotCallback = null;

	engine.PDI.prototype.clone = function(){
		this.dest = this.source.clone();
	};

	engine.PDI.prototype.dispose = function(){
		this.source = this.dest.clone();
		this.dest = null;
	};

	engine.PDI.prototype.loop = function(callback){ // Loop parejo
		this.clone();

		var pixels_source = this.source.imgData.data,
			pixels_dest = this.dest.imgData.data,
    		numPixels = this.source.width * this.source.height;

    	this.source.loop(function(i,x,y,r,g,b){
    		var rgb = callback(r,g,b,x,y);
			if ( !rgb ) rgb = {r:r,g:g,b:b};
		    pixels_dest[i] = rgb.r;
		    pixels_dest[i+1] = rgb.g; // Green
		    pixels_dest[i+2] = rgb.b; // Blue
    	});
    	
		if ( this.events["end"] ) this.events["end"]();
		return;
	};

	engine.PDI.prototype.loop_trans = function(callback){ // Loop parejo
		var self = this;
		this.dest = new Imagen();
		this.dest.create(this.source.width,this.source.height);

    	this.source.loop(function(i,x,y,r,g,b){
    		var pos = callback(r,g,b,x,y);
			if ( !pos ) pos = {r:r,g:g,b:b,x:x,y:y};

			self.dest.setPixel(pos.x,pos.y,{r:pos.r,g:pos.g,b:pos.b});
    	});

		if ( this.events["end"] ) this.events["end"]();
		return;
	};

	engine.PDI.prototype.on = function( trigger , callback ){
		// Eventos: end
		this.events[trigger] = callback;
	};

	engine.PDI.prototype.snapshot = function( name ){ // Render type
		engine.PDI.snapshotCallback( this.dest.getBase64() , name );
	}

	engine.PDI.prototype.require = function( effectArr , effectStr , params ){
		var ret = effectArr[effectStr].exec(this , params);
		this.snapshot( effectArr[effectStr].nom);
		return ret;
	};

	engine.PDI.prototype.run = function( effectArr , effectStr , params , callback ) {
		var self = this;
		setTimeout(function(){
			effectArr[effectStr].exec(self , params);
			self.snapshot( effectArr[effectStr].nom);
			self.render();
			callback();
		},0);
	};

	engine.PDI.prototype.render = function(){
		engine.MyCanvas.renderImg(this.dest);
	};