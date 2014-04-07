(function(){

	var $buffer = $('#buffer');

	// Canvas

	var MyCanvas = {
		el: document.getElementById('canvas'),
		context: null,
		init: function(){
			this.context = this.el.getContext('2d');

			// Inicializar canvas
			this.el.width = $('body').width();
			this.el.height = window.innerHeight - $('#menu').innerHeight() - 100;
		},
		reset: function(){
			this.el.width = this.el.width;
		},
		renderImg: function( imag ){
			MyCanvas.context.putImageData( imag.imgData , 0,0 );
		},
		getCurrentData: function(){
			return this.context.getImageData(0, 0, MyCanvas.el.width, MyCanvas.el.height);
		}
	};
	MyCanvas.init();

	// Imagen

	function Imagen( src ){
		this.img = new Image();
		this.loaded = false;
		this.src = src;
		this.imgData = {};
	};

	Imagen.prototype.load = function( onload ) {
		var self = this;

		this.img.onload = function(){
			self.getImageData(onload);
			self.loaded = true;
		};
		this.img.src = this.src;
	};

	Imagen.prototype.getImageData = function( onload ){
		var canvas = document.createElement('canvas');

		canvas.width = this.img.width;
		canvas.height = this.img.height;

		var context = canvas.getContext('2d');
		context.drawImage(this.img,0,0);

		this.imgData = context.getImageData(0, 0, this.img.width,this.img.height);

		if ( onload ) onload(this);
	};

	Imagen.prototype.getPixelBase = function(x,y){
		return ((y - 1) * (this.img.width * 4)) + ((x - 1) * 4);
	};

	Imagen.prototype.getColor = function(x,y) {
		var pixBase = this.getPixelBase(x,y);
		return {r:this.imgData.data[pixBase],
				g:this.imgData.data[pixBase+1],
				b:this.imgData.data[pixBase+2],
				a:this.imgData.data[pixBase+3]};
	};

	Imagen.prototype.setPixel = function(x,y,color){
		var pixBase = this.getPixelBase(x,y);
		if ( ! $.isArray(color) && $.isNumeric(color) ) color = {r:color,g:color,b:color};

		this.imgData.data[pixBase] = color.r;
		this.imgData.data[pixBase+1] = color.g;
		this.imgData.data[pixBase+2] = color.b;
	};

	Imagen.prototype.HexToRGB = function(hex){
		// Check if rgb
		if ( $.isArray(hex) ) return hex; // Ya es rgb

		var rgb = {};
		rgb.r = parseInt(hex.substr(1,2),16);
		rgb.g = parseInt(hex.substr(3,2),16);
		rgb.b = parseInt(hex.substr(5,2),16);

		return rgb;
	};

	Imagen.prototype.RGBtoHex = function(rgb){
		// Check if hex
		if ( rgb.substr(0,1) == "#" ) return rgb; // Ya es hex

		var hex = "#";
		hex += rgb.r.toString(16);
		hex += rgb.g.toString(16);
		hex += rgb.b.toString(16);

		return hex;
	};

	// PDI

	function PDI( source ){
		this.source = source;
		this.events = {};
		this.dest = null;
	};

	PDI.prototype.clone = function(){
		this.dest = new Imagen(this.source.img.width,this.source.img.height);
	}

	PDI.prototype.loop = function(callback){
		this.clone();

		var pixels_source = this.source.imgData.data,
			pixels_dest = this.source.imgData.data,
    		numPixels = this.source.img.width * this.source.img.height;

    	for (var i = 0; i < numPixels; i++) {
    		var rgb = callback(pixels_source[i*4] , pixels_source[i*4+1] , pixels_source[i*4+2]);
		    pixels_dest[i*4] = rgb.r;
		    pixels_dest[i*4+1] = rgb.g; // Green
		    pixels_dest[i*4+2] = rgb.b; // Blue
		};

		this.dest.imgData = this.source.imgData;
		this.dest.imgData.data = pixels_dest;

		MyCanvas.renderImg(this.dest);

		if ( this.events["end"] ) this.events["end"]();
	};

	PDI.prototype.on = function( trigger , callback ){
		// Eventos: end
		this.events[trigger] = callback;
	};

	PDI.prototype.render = function(){
		/*MyCanvas.reset();
		MyCanvas.renderImg( this.dest );*/
	};


	// UI
	var $menu = $('#menu'),
		source = {
			$select: $menu.find('select[name="imgsource"]'),
			$btn: $menu.find('button[name="load"]')
		},
		effects = {
			$btn: $menu.find('button[name="render"]')
		};


	var pdi;
	var imag;

	source.$btn.on('click',function(){

		// Acá en el aire. Desp se usa la clase PDI
		imag = new Imagen( source.$select.val() );
		imag.load(MyCanvas.renderImg);

	});

	effects.$btn.on('click',function(){

		pdi = new PDI(imag);

		pdi.on("end",function(){
			pdi.render();
		});

		pdi.loop(function(r,g,b){
			return { r: 255-r, g: 255-g , b: 255-b };
		});

	});

})();