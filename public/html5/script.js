(function(){

	var $buffer = $('#buffer');

	// ************************
	// 		Canvas
	// ************************

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
		renderImg: function( imag , keep ){
			// Clear screen
			if ( ! keep ) MyCanvas.reset();
			
			// Center image:
			var x = ( MyCanvas.el.width - imag.width ) / 2,
				y = ( MyCanvas.el.height - imag.height ) / 2;

			MyCanvas.context.putImageData( imag.imgData , x,y );
		},
		getCurrentData: function(){
			return this.context.getImageData(0, 0, MyCanvas.el.width, MyCanvas.el.height);
		}
	};
	MyCanvas.init();

	// ************************
	// 		Imagen
	// ************************
	function Imagen( src ){
		this.img = new Image();
		this.loaded = false;
		this.src = src;
		this.imgData = {};
		this.width = this.height = 0;
	};

	Imagen.prototype.load = function( onload , remote ) {
		var self = this;

		this.img.onload = function(){
			self.getImageData(onload);
			self.loaded = true;
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
				},
				error: function(xhr, text_status){
				  // Handle your error here
				  console.log("Error:",xhr,text_status);
				}
			});
		};
	};

	Imagen.prototype.clone = function(){
		var ret = new Imagen();

    	var canvas = document.createElement('canvas');
		
		ret.width = ret.img.width = canvas.width = this.width;
		ret.height = ret.img.height = canvas.height = this.height;

		var context = canvas.getContext('2d');

		context.putImageData(this.imgData,0,0);
		ret.imgData = context.getImageData(0, 0, this.width,this.height);
    	return ret;
	};

	Imagen.prototype.getImageData = function( onload ){
		var canvas = document.createElement('canvas');

		canvas.width = this.img.width;
		canvas.height = this.img.height;

		//Resize image:
		var w = this.img.width,
			h = this.img.height;

		if ( w > MyCanvas.el.width ){
			h = ( ( MyCanvas.el.width * h ) / w );
			w = MyCanvas.el.width;
		}
		if ( h > MyCanvas.el.height ){
			w = ( ( MyCanvas.el.height * w ) / h );
			h = MyCanvas.el.height;
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

	// ************************
	// 		PDI
	// ************************

	function PDI( source ){
		this.source = source;
		this.events = {};
		this.dest = null;
	};

	PDI.prototype.clone = function(){
		this.dest = this.source.clone();
	}

	PDI.prototype.loop = function(callback){
		this.clone();

		var pixels_source = this.source.imgData.data,
			pixels_dest = this.dest.imgData.data,
    		numPixels = this.source.width * this.source.height;

    	var i = 0;
    	for ( var y = 0 ; y < this.source.height ; y++ )
    		for ( var x = 0 ; x < this.source.width ; x++ ){
    			var rgb = callback(pixels_source[i*4] , pixels_source[i*4+1] , pixels_source[i*4+2] ,x,y);
			    pixels_dest[i*4] = rgb.r;
			    pixels_dest[i*4+1] = rgb.g; // Green
			    pixels_dest[i*4+2] = rgb.b; // Blue
			    i++;
    		}

		MyCanvas.renderImg(this.dest);

		if ( this.events["end"] ) this.events["end"]();
		return;
	};

	PDI.prototype.on = function( trigger , callback ){
		// Eventos: end
		this.events[trigger] = callback;
	};

	PDI.prototype.render = function(){
		/*MyCanvas.reset();
		MyCanvas.renderImg( this.dest );*/
	};

	// ************************
	//  	Trans
	// ************************

	var efectos = {
		"negativo": function(pdi){
			pdi.loop(function(r,g,b,x,y){
				return { r: 255-r, g: 255-g , b: 255-b };
			});
		},
		"blanco_negro": function(pdi){
			pdi.loop(function(r,g,b,x,y){
				var iluminancia = (0.2126*r) + (0.7152*g) + (0.0722*b);
				return { r: iluminancia, g: iluminancia , b: iluminancia };
			});
		}
	}

	// ************************
	// 		UI
	// ************************
	var $menu = $('#menu'),
		source = {
			$select: $menu.find('select[name="imgsource"]'),
			$input: $menu.find('input[name="imgremotesource"]'),
			$btn: $menu.find('button[name="load"]')
		},
		effects = {
			$select: $menu.find('select[name="effect"]'),
			$btn: $menu.find('button[name="render"]')
		};

	// Completar efectos
	for ( var key in efectos )
		effects.$select.append( $('<option></option>').val(key).html(key) );

	var pdi;
	var imag;

	source.$btn.on('click',function(){
		source.$btn.html(" ... Cargando ...").attr("disabled", true);

		// Acá en el aire. Desp se usa la clase PDI
		var remote = false;
		if ( source.$input.val() != "" ) {
			imag = new Imagen(source.$input.val());
			remote = true;
		} else {
			imag = new Imagen( source.$select.val() );
		}
		imag.load(function(i){
			MyCanvas.renderImg(i);
			source.$btn.html("Cargar").attr("disabled", false);
		}, remote);

	});

	effects.$btn.on('click',function(){

		pdi = new PDI(imag);
		pdi.on("end",pdi.render);
		efectos[effects.$select.val()](pdi);

	});

})();