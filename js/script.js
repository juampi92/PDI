(function(){

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
			this.el.height = window.innerHeight - 100;
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

	// ************************************************
	// 						Imagen
	// ************************************************

	function Imagen( src ){
		this.img = new Image();
		this.loaded = false;
		this.src = src;
		this.imgData = null;
		this.width = this.height = 0;
		this.histograma = null;
		this.onEvents = {};

		return this;
	};

	Imagen.prototype.create = function( width , height ){
		// Create empty image
		var canvas = document.createElement('canvas');
		
		this.width = this.img.width = canvas.width = width;
		this.height = this.img.height = canvas.height = height;

		this.imgData = canvas.getContext('2d').createImageData(width,height);
	};

	Imagen.prototype.load = function( onload , remote ) {
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

	Imagen.prototype.loop = function(callback){
		var i = 0;
		for ( var y = 0 ; y < this.height ; y++ )
    		for ( var x = 0 ; x < this.width ; x++ ){
    			callback(i,x,y,this.imgData.data[i],this.imgData.data[i+1],this.imgData.data[i+2]);
			    i += 4;
    		}
	};

	Imagen.prototype.getBase64 = function(){
		var canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;

		var context = canvas.getContext('2d');

		context.putImageData(this.imgData,0,0);
		return canvas.toDataURL();
	};

	Imagen.prototype.getPixelBase = function(x,y){
		return (y * (this.img.width * 4)) + (x * 4);
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
		this.imgData.data[pixBase+3] = 255;
	};	

	Imagen.prototype.on = function( event, callback ){
		this.onEvents[event] = callback;
	};

	Imagen.prototype.trigger = function(event , param1, param2, param3){
		if ( this.onEvents[event] ) this.onEvents[event](param1,param2,param3);
	};

	// 

	// ************************************************
	// 				Cargar Imagen desde Archivo
	// ************************************************

	function ImageFileLoad(src,callback){
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
	}

	// ************************************************
	// 					Color Helper
	// ************************************************

	var Color = {
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

	function PDI( source ){
		this.source = source;
		this.events = {};
		this.dest = null;

		return this;
	};

	PDI.prototype.clone = function(){
		this.dest = this.source.clone();
	};

	PDI.prototype.dispose = function(){
		this.source = this.dest.clone();
		this.dest = null;
	};

	PDI.prototype.loop = function(callback){ // Loop parejo
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

	PDI.prototype.loop_trans = function(callback){ // Loop parejo
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

	PDI.prototype.on = function( trigger , callback ){
		// Eventos: end
		this.events[trigger] = callback;
	};

	PDI.prototype.snapshot = function( name ){ // Render type
		ui.addSnapshot( this.dest.getBase64() , name );
	}

	PDI.prototype.require = function( effectStr , params ){
		var ret = efectos[effectStr].exec(this , params);
		this.snapshot(efectos[effectStr].nom);
		return ret;
	};

	PDI.prototype.run = function( effectStr , params , callback ) {
		var self = this;
		setTimeout(function(){
			efectos[effectStr].exec(self , params);
			self.snapshot(efectos[effectStr].nom);
			self.render();
			callback();
		},0);
	};

	PDI.prototype.render = function(){
		MyCanvas.renderImg(this.dest);
	};

	// ************************************************
	//  				Transformaciones
	// ************************************************

	function Transformacion_color( constructor , color_junto ){
		this._lut = false;
		this.func = null;
		this.color_junto = ( color_junto ) ? true : false;
		if ( $.isNumeric(constructor) ) {
			var cte = (255 / Math.pow(255,constructor));
			this.func = function(c){
				return ( cte * Math.pow(c,constructor) ); /// s = c * r^y ( c = 255/255^y)
			};
		} else 
			this.func = constructor;
	};

	Transformacion_color.prototype.lut = function( lut ){
		this._lut = true;
		this.func = lut;
	};

	Transformacion_color.prototype.exec = function( r, g, b){
		if ( this._lut )
			if ( this.func.length != 256 )
				return { r: this.func.r[r] , g:this.func.g[g] , b:this.func.b[b] };
			else
				return { r: this.func[r] , g:this.func[g] , b:this.func[b] };
		else 
		if ( this.color_junto )
			return this.func(r,g,b);
		else if ( $.isArray( this.func ) )
			return { r: this.func.r(r) , g:this.func.g(g) , b:this.func.b(b) };
		else
			return { r: this.func(r) , g:this.func(g) , b:this.func(b) };
	}

	// ----------

	function Transformacion_pixel( constructor ){
		this.func = constructor;
	};

	Transformacion_pixel.prototype.exec = function(r,g,b,x,y){
		return this.func(r,g,b,x,y);
	}

	// ************************************************
	//  					Filtros
	// ************************************************	

	function Filtro(matriz , factor){
		this.matrix = matriz;
		this.w = matriz[0].length;
		this.h = matriz.length;
		this.center = [ (this.w-1) / 2 , (this.h-1) / 2];
		this.factor = ( factor ) ? factor : false;
	};

	Filtro.prototype.exec = function( image , x , y ){
		var sum = {r:0,g:0,b:0},
			fact = this.factor;
		for ( var i = 0 ; i < this.w ; i++)
			for ( var j = 0 ; j < this.h ; j++) {
				var colores = image.getColor( x + i - this.center[0] , y + j - this.center[1] ),
					filtro = this.matrix[i][j];

				sum.r += filtro * colores.r;
				sum.g += filtro * colores.g;
				sum.b += filtro * colores.b;
			}

		if ( fact !== false ) {
			sum.r /= fact;
			sum.g /= fact;
			sum.b /= fact;
		}
		return sum;
	};

	// ************************************************
	//  					Histograma
	// ************************************************

	function Histograma( imagen ){
		this.img = imagen;
		this.color = false;
		this.histograma = null;
		this.histogramax = 0;
		this.lut = null; // Look up table
	};

	Histograma.prototype.calcular = function( color ){
		var self = this;
		if ( color ) this.color = true;

		if ( color ) {
			// Color
			self.histograma = {r:new Array(256),g:new Array(256),b:new Array(256)};
			for (var i = 0; i < self.histograma.r.length; i++)
				self.histograma.r[i] = self.histograma.g[i] = self.histograma.b[i] = 0;

			self.img.loop(function(i,x,y,r,g,b){
				self.histograma.r[r]++;
				self.histograma.g[g]++;
				self.histograma.b[b]++;
				self.histogramax = Math.max(self.histogramax,self.histograma.r[r],self.histograma.g[g],self.histograma.b[b]);
			});

		} else {
			// Blanco y Negro
			self.histograma = new Array(256);
			for (var i = 0; i < self.histograma.length; i++) self.histograma[i] = 0;

			this.img.loop(function(i,x,y,r,g,b){
				self.histograma[r]++;
				self.histogramax = Math.max(self.histogramax,self.histograma[r]);
			});
		}
		this.histograma = self.histograma;
	};

	Histograma.prototype.get = function(){
		return this.histograma;
	};

	Histograma.prototype.procesar = function(funcion){
		if ( this.histograma == null ) this.calcular();

		if ( this.color ) {	
			this.lut = {r:new Array(256),g:new Array(256),b:new Array(256)};
			funcion(this.histograma.r , this.lut.r);
			funcion(this.histograma.g , this.lut.g);
			funcion(this.histograma.b , this.lut.b);
		} else {
			this.lut = new Array(256);
			funcion(this.histograma , this.lut );
		}
	};

	Histograma.prototype.ecualizar = function(){
		var self = this;
		this.procesar(function(h,l){self._ecualizar_simple(h,l)});
	};

	Histograma.prototype._ecualizar_simple = function( histograma , lut ){
		var sum = 0,
			pixelCount = this.img.width * this.img.height;

		lut[0] = histograma[0];
		for ( var i = 1; i < 256; ++i )
		    lut[i] = lut[i-1] + histograma[i];

		for ( var i = 0; i < 256; i++)
			lut[i] = Math.floor(lut[i] * 255 / pixelCount);
	};

	Histograma.prototype.getLUT = function( r , g , b  ){
		if ( this.color )
			return {
				r:this.lut.r[r],
				g:this.lut.g[g],
				b:this.lut.b[b],
			};
		else
			return this.lut[r];
	};

	Histograma.prototype.draw = function(){
		if ( this.histograma == null ) this.calcular();

		var canvas = document.createElement('canvas');
		canvas.width = ( this.color ) ? 257 * 3 : 256;
		canvas.height = 400;

		var context = canvas.getContext('2d');

		var factor = ( canvas.height / this.histogramax );
		if ( this.color ){
			this._draw(this.histograma.r,'red', context , 0,canvas.height , factor );
			context.beginPath(); context.moveTo(256,0); context.lineTo(256,canvas.height); context.lineWidth = 1;context.strokeStyle = 'black'; context.stroke();
			this._draw(this.histograma.g,'green', context , 257,canvas.height , factor );
			context.beginPath(); context.moveTo(256*2,0); context.lineTo(256*2,canvas.height); context.strokeStyle = 'black'; context.stroke();
			this._draw(this.histograma.b,'blue', context , 257*2,canvas.height , factor );
		} else
		this._draw(this.histograma,'black', context , 0,canvas.height , factor );

		var imagen = new Imagen("");
		imagen.width = canvas.width;
		imagen.height = canvas.height;
		imagen.imgData = context.getImageData(0, 0, canvas.width,canvas.height);
		return imagen;
	};

	Histograma.prototype._draw = function( histograma , color , context , offsetX , maxY , factorY){
		context.beginPath();
		for ( var i = 0 ; i < 256 ; i++) {
			x = offsetX+i;
			context.moveTo(x,maxY);
			var h = histograma[i] * factorY;
      		context.lineTo(x,maxY-h);
		};
		context.lineWidth = 1;
		context.strokeStyle = color;
      	context.stroke();
	};

	// ************************************************
	//  					Efectos
	// ************************************************

	var efectos = {
		"negativo": {
			nom: "Negativo",
			require: null,
			exec: function(pdi){
				var trans = new Transformacion_color(transformaciones.color.negativo);
				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});
				return;
			}
		},
		"blanco_negro":  {
			nom: "Blanco y Negro",
			require: null,
			exec: function(pdi){
				pdi.loop(function(r,g,b,x,y){
					var iluminancia = (0.2126*r) + (0.7152*g) + (0.0722*b);
					return { r: iluminancia, g: iluminancia , b: iluminancia };
				});
				return;
			}
		},
		"histograma":  {
			nom: "Histograma",
			require: [
				$('<span></span>').html(" Blanco y Negro").prepend(
					$('<input>').attr("name","byn").attr("type","checkbox"))
			],
			exec: function(pdi,params){
				var color = true;
				if ( params[0] && params[0].value == "on" ) {
					color = false;
					pdi.require("blanco_negro");
					pdi.dispose();
				}

				pdi.source.histograma = new Histograma(pdi.source);
				pdi.source.histograma.calcular(color);

				pdi.dest = pdi.source.histograma.draw();

				return pdi.source.histograma;
			}
		},
		"histograma_ecual":  {
			nom: "Histograma Ecualizacion",
			require: [
				$('<span></span>').html(" Blanco y Negro").prepend(
					$('<input>').attr("name","byn").attr("type","checkbox"))
			],
			exec: function(pdi,params){
				var color = true;
				if ( params[0] && params[0].value == "on" ) {
					color = false;
					
				}

				pdi.require("histograma",params);
				//pdi.dispose();

				pdi.source.histograma.ecualizar();

				var trans = new Transformacion_color(null);
				trans.lut(pdi.source.histograma.lut);

				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});

				console.log(pdi.source.histograma.lut);

				return pdi.source.histograma.lut;
			}
		},
		"transformacion_color":  {
			nom: "Transformacion de Color",
			require: [ 
				$('<select></select>').attr("name","pre-trans")
					.append( $('<option></option>').attr("value","fact").html("Usar factor ( > 0 )") )
					.append( $('<option></option>').attr("value","umbral").html("Umbralado (0-255)") )
					,
				$('<input>').attr("name","factor").attr("placeholder","Factor")
					.attr("value","1.5"),
				$('<span></span>').html(" Blanco y Negro").prepend(
					$('<input>').attr("name","byn").attr("type","checkbox"))
			],
			exec: function(pdi,params,trans) {
				var factor = 1;
				if ( params ) {
					if ( params[0].value == "fact" && $.isNumeric(params[1].value) ) 
						factor = params[1].value;
					else if ( params[0].value == "umbral" && $.isNumeric(params[1].value) ) 
						factor = function(c){return transformaciones.color.umbral(c,parseInt(params[1].value));};

					if ( params[2] && params[2].value == "on" ) {
						pdi.require("blanco_negro");
						pdi.dispose();
					}
				}

				if ( !trans ) trans = new Transformacion_color(factor);

				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});
			}
		},
		"hsv":  {
			nom: "Saturar",
			require: [
				$('<input>').attr("name","hue").attr("placeholder","Hue"),
				$('<input>').attr("name","sat").attr("placeholder","Saturation"),
				$('<input>').attr("name","val").attr("placeholder","Value")
			],
			exec: function(pdi,params,trans) {
				var H = ( $.isNumeric(params[0].value) ) ? params[0].value : 1,
					S = ( $.isNumeric(params[1].value) ) ? params[1].value : 1,
					V = ( $.isNumeric(params[2].value) ) ? params[2].value : 1;

				var factor = function(r,g,b){
					var hsv = Color.RGBtoHSV(r,g,b);
					hsv.h = hsv.h * H;
					hsv.s = Math.min(100,hsv.s * S);
					//hsv.v = Math.min(100,hsv.v * V);
					var rgb = Color.HSVtoRGB(hsv.h,hsv.s,hsv.v);
					return rgb;
				}

				if ( !trans ) trans = new Transformacion_color(factor,true);

				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});
			}
		},
		"transformacion_rotacion":  {
			nom: "Rotacion",
			require: [ 
				$('<input>').attr("name","grado").attr("placeholder","Grado")
					.attr("value","90"),
				$('<span></span>').html(" Blanco y Negro").prepend(
					$('<input>').attr("name","byn").attr("type","checkbox"))
			],
			exec: function(pdi,params,trans) {
				var grado = 90;
				if ( params ) {
					if ( $.isNumeric(params[0].value) ) grado = params[0].value;
					if ( params[1] && params[1].value == "on" ) {
						pdi.require("blanco_negro");
						pdi.dispose();
					}
				}

				grado = (grado * Math.PI ) / 180; // To radians

				var centroX = Math.floor(pdi.source.width / 2),
					centroY = Math.floor(pdi.source.height / 2);

				if ( !trans ) trans = new Transformacion_pixel(function(r,g,b,x,y){
					return transformaciones.pixel.rotacion_origen(r,g,b,x,y,centroX,centroY,grado);
				});

				pdi.loop_trans(function(r,g,b,x,y){
					return trans.exec(r,g,b,x,y);
				});
			}
		},
		"filtro":{
			nom: "Filtro",
			require:  [ 
				$('<select></select>').attr("name","filter")
					.append( $('<option></option>').attr("value","base_blur").html("Desenfoque Base") )
					.append( $('<option></option>').attr("value","gaussian_blur").html("Desenfoque Gaussiano") )
					,
				$('<span></span>').html(" Blanco y Negro").prepend(
					$('<input>').attr("name","byn").attr("type","checkbox"))
			],
			exec: function(pdi,params){
				var filtro;
				if ( params ) {
					switch(params[0].value){
						case "base_blur": filtro = filtros.desenfoque.base; break;
						case "gaussian_blur": filtro = filtros.desenfoque.gaussiano; break;
						default: return; break;
					}
					if ( params[1] && params[1].value == "on" ) {
						pdi.require("blanco_negro");
						pdi.dispose();
					}
				}

				var f = new Filtro(filtro.matriz,filtro.factor);
				pdi.loop(function(r,g,b,x,y){
					return f.exec(pdi.source,x,y);
				})
			}
		},
		"bordes":{
			nom: "Bordes",
			require:  [ 
				$('<select></select>').attr("name","filter")
					.append( $('<option></option>').attr("value","base").html("Base") )
					.append( $('<option></option>').attr("value","base_horizontal").html("Base Horizontal") )
					.append( $('<option></option>').attr("value","base_vertical").html("Base Vertical") )
					.append( $('<option></option>').attr("value","sobel_h").html("Sobel Horizontal") )
					.append( $('<option></option>').attr("value","sobel_v").html("Sobel Vertical") )
			],
			exec: function(pdi,params){
				var filtro;
				if ( params )
					filtro = filtros.bordes[params[0].value];
				
				if ( filtro == undefined ) filtro = filtros.bordes.base;

				pdi.require("blanco_negro");
				pdi.dispose();

				var f = new Filtro(filtro.matriz,filtro.factor);

				pdi.loop(function(r,g,b,x,y){
					return f.exec(pdi.source,x,y);
				});
			}
		},
		"bordes_all":{
			nom: "Detectar Bordes",
			require:  [],
			exec: function(pdi,params){
				pdi.require("blanco_negro");
				pdi.dispose();

				// Reducción de ruido
				/*var canny = new Filtro(filtros.ruido.canny.matriz,filtros.ruido.canny.factor)
				pdi.loop(function(r,g,b,x,y){
					return canny.exec(pdi.source,x,y);
				});
				pdi.dispose();*/

				var pdi_x = new PDI(pdi.source),
					pdi_y = new PDI(pdi.source);

				var f_x = new Filtro(filtros.bordes["sobel_h"].matriz,filtros.bordes["sobel_h"].factor),
					f_y = new Filtro(filtros.bordes["sobel_v"].matriz,filtros.bordes["sobel_v"].factor);
				
				// Sobel X
				pdi_x.loop(function(r,g,b,x,y){
					return f_x.exec(pdi.source,x,y);
				});
				// Sobel Y
				pdi_y.loop(function(r,g,b,x,y){
					return f_y.exec(pdi.source,x,y);
				});

				// Gradiente o combinación de Ambos
				pdi.loop(function(r,g,b,x,y){
					var gradiente = Math.sqrt( Math.pow(pdi_x.dest.getColor(x,y).r,2) + Math.pow(pdi_y.dest.getColor(x,y).r,2)  ); // Pitagoras
					return {r:gradiente,g:gradiente,b:gradiente};
				});
				pdi.dispose();

				// Umbralado:
				pdi.loop(function(r,g,b,x,y){
					if ( r > 20 )
						return {r:255,g:0,b:0};
					else
						return {r:0,g:0,b:0};
				});
			}
		},
		"tiltshift":{
			nom: "Tilt-Shift",
			require:  [ 
				$('<input>').attr("name","sat").attr("placeholder","Saturacion"),
				$('<input>').attr("name","blurpos").attr("placeholder","Posicion Blur %")
			],
			exec: function(pdi,params){
				var perc,sat;
				// Saturacion:
				var sat = ( $.isNumeric(params[0].value) ) ? params[0].value : 1.9,
					perc = ( $.isNumeric(params[1].value) ) ? Math.max(0,Math.min(100,params[1].value)) : 80;

				var factor = function(r,g,b){ // Buscar forma más efectiva
					var hsv = Color.RGBtoHSV(r,g,b);
					hsv.s = Math.min(100,hsv.s * sat);
					var rgb = Color.HSVtoRGB(hsv.h,hsv.s,hsv.v);
					return rgb;
				}

				trans = new Transformacion_color(factor,true);
				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});
				pdi.dispose();

				// --------------------

				// Desenfoque
				var f = new Filtro(filtros.desenfoque.gaussiano.matriz,filtros.desenfoque.gaussiano.factor);

				var y_pixel = (pdi.source.height*perc/100),
					y_min = ( perc > 50 ) ? pdi.source.height - y_pixel : y_pixel;
					factor_blur = function(y){
						return Math.min(1,Math.abs(y_pixel - y) / y_min);
					};
				pdi.loop(function(r,g,b,x,y){
					var blur = factor_blur(y),
						rgb = f.exec(pdi.source,x,y);
					return {
						r:( r*(1-blur) + rgb.r*blur  ),
						g:( g*(1-blur) + rgb.g*blur ),
						b:( b*(1-blur) + rgb.b*blur )};
				});
			}
		}
	}

	// ************************
	// 		Filtros
	// ************************

	var filtros = {
		desenfoque: {
			base: {
				matriz:[ [1,1,1], [1,2,1], [1,1,1]], factor: 10
			},
			gaussiano:{
				matriz:[
					[2,4,5,4,2],
					[4,9,12,9,4],
					[5,12,15,12,5],
					[4,9,12,9,4],
					[2,4,5,4,2]
				], factor: 159
			}
		},
		bordes: {
			base: {
				matriz:[ [-1,-1,-1], [-1,9,-1], [-1,-1,-1]], factor: false
			},
			base_horizontal: {
				matriz:[ [0,0,0], [-1,1,0], [0,0,0]], factor: false
			},
			base_vertical: {
				matriz:[ [0,-1,0], [0,1,0], [0,0,0]], factor: false
			},
			sobel_v: {
				matriz:[ [-1,-2,-1], [0,0,0], [1,2,1]], factor: 4
			},
			sobel_h: {
				matriz:[ [-1,0,1], [-2,0,2], [-1,0,1]], factor: 4
			}
		}
	};

	// ************************
	// 		Transformaciones
	// ************************

	var transformaciones = {
		color: {
			negativo: function(c){
				return 255 - c;
			},
			unbral: function(c,umbralado){
				return ( c > umbralado ) ? 255 : 0;
			}
		},
		pixel: {
			rotacion_origen: function(r,g,b,x,y,centroX,centroY,grado){
				var pixel = {
					x: Math.floor( (x-centroX) * Math.cos(grado) - (y-centroY) * Math.sin(grado) + centroX),
					y: Math.floor( (y-centroY) * Math.cos(grado) + (x-centroX) * Math.sin(grado) + centroY)
				};
				return {r:r,g:g,b:b,x:pixel.x,y:pixel.y};
			}
		}
	};

	// ************************
	// 		UI
	// ************************
	var $menu = $('nav#menu');

	var ui = {
		img: null,
		pdi: null,
		opts: {
			$despliegue: $menu.find('a[role="opt"]'),
			$container: $menu.find('#opciones'),
			$pasos: $menu.find('#pasos'),
			sector: { $fuente: null, $efecto: null },
			$current_div: $menu.find('.current'),
			$reset: $menu.find('a[rol="reset"]')
		},
		source: {
			$select: $menu.find('select[name="imgsource"]'),
			$input: $menu.find('input[name="imgremotesource"]'),
			$fileInput: $menu.find('input[name="imgfilesource"]'),
			$btn: $menu.find('button[name="load"]')
		},
		effects: {
			$form: $menu.find('form'),
			$select: $menu.find('select[name="effect"]'),
			$btn: $menu.find('button[name="render"]')
		},
		$current: null,
		init: function(){
			// Inicializar selectores
			this.$current = this.opts.$reset.find('img');
			this.opts.sector.$fuente = this.opts.$container.find('div[sector="fuente"]');
			this.opts.sector.$efecto = this.opts.$container.find('div[sector="efecto"]');

			// Completar efectos
			this.effects.$select.append( $('<option></option>').val("").html(" -- Elegir efecto --").attr("selected","selected") );
			for ( var key in efectos )
				this.effects.$select.append( $('<option></option>').val(key).html(efectos[key].nom) );

			this.source.$btn.html("Cargar").attr("disabled", false);

			// Eventos:
			this.setEvents();
		},
		setEvents: function(){
			var self = this;
			// Options Slide
			this.opts.$despliegue.on('click',function(e){
				e.preventDefault();
				self.optionsSlide();
			});
			this.opts.$container.find('#slideUp-footer').on('click',function(e){
				e.preventDefault();
				self.optionsSlide(false);
			});

			this.source.$input.on('change',function(){
				if ( self.source.$input.val() == "" ) {
					self.source.$select.addClass("active");
					self.source.$input.removeClass("active");
				} else {
					self.source.$input.addClass("active");
					self.source.$select.removeClass("active");
				}
			});

			this.source.$fileInput.on("change",function(e){
				console.log("ASD");
				ImageFileLoad(e.target.files[0],function(src){
					self.img = new Imagen( src );
					self.img.load(function(i){
						MyCanvas.renderImg(i);
						self.imagenLoaded();
					},false);

					self.img.on('error',function(xhr,text){
						alert("Ocurrio un error procesando lo solicitado. "+text);
						self.source.$btn.html("Cargar").attr("disabled", false);
					});
				});
			});

			this.source.$btn.on('click',function(){
				self.source.$btn.html(" ... Cargando ...").attr("disabled", true);

				// Acá en el aire. Desp se usa la clase PDI
				var remote = false;
				if ( self.source.$input.val() != "" ) {
					self.img = new Imagen( self.source.$input.val());
					remote = true;
				} else {
					self.img = new Imagen( self.source.$select.val() );
				}
				
				self.img.load(function(i){
					MyCanvas.renderImg(i);
					self.imagenLoaded();
				}, remote);

				self.img.on('error',function(xhr,text){
					alert("Ocurrio un error procesando lo solicitado. "+text);
					self.source.$btn.html("Cargar").attr("disabled", false);
				});

			});

			this.opts.$reset.on('click',function(e){
				e.preventDefault();
				self.imagenRemoved();
			});

			this.effects.$select.on('change',function(){
				if ( self.effects.$select.val() == "" ) {
					self.effects.$btn.attr("disabled",true);
					return;
				} else self.effects.$btn.attr("disabled",false);
				
				self.effects.$form.empty();
				if ( efectos[self.effects.$select.val()].require == null ) return;
				var appends = efectos[self.effects.$select.val()].require;
				appends.forEach(function(e){
					self.effects.$form.append(e.addClass("form-control"));
				});
			});

			this.effects.$btn.on('click',function(){
				if ( self.effects.$select.val() == "") return;

				self.effects.$btn.html("Renderizando...").attr("disabled", true);

				self.emptySnapshot();

				new PDI(self.img).run( self.effects.$select.val() , self.effects.$form.serializeArray() , function(){
					self.effects.$btn.html("Render").attr("disabled", false);
				});
			});

		},
		imagenLoaded: function(){
			this.source.$btn.html("Cargar").attr("disabled", false);
			this.opts.sector.$fuente.hide();
			this.opts.sector.$efecto.show();

			this.opts.$current_div.show();

			this.$current.attr("src", this.img.src );
		},
		imagenRemoved: function(){
			this.opts.sector.$fuente.show();
			this.opts.sector.$efecto.hide();

			this.opts.$current_div.hide();

			this.$current.attr("src","");

			this.img = null;
			this.pdi = null;
		},
		optionsSlide: function( activar ) {
			var $li = this.opts.$despliegue.parent();
			if ( activar == undefined ) activar = !$li.hasClass("active");

			if ( activar ) {
				$li.addClass("active");
				this.opts.$container.slideDown("slow");
			} else {
				$li.removeClass("active");
				this.opts.$container.slideUp("slow");
			}
		},
		addSnapshot: function(href,name){
			this.opts.$pasos.append( 
				$('<li></li>').append(
					$('<a></a>').attr("href",href).html(name).attr("target","_blank")
				)
			);
		},
		emptySnapshot: function(){
			this.opts.$pasos.empty();
		}
	}; // ./ ui
	ui.init();

})();