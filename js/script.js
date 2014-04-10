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

	Imagen.prototype.getBase64 = function(){
		var canvas = document.createElement('canvas');
		canvas.width = this.img.width;
		canvas.height = this.img.height;

		var context = canvas.getContext('2d');

		context.putImageData(this.imgData,0,0);
		return canvas.toDataURL();
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

		return this;
	};

	PDI.prototype.clone = function(){
		this.dest = this.source.clone();
	};

	PDI.prototype.dispose = function(){
		this.source = this.dest.clone();
		this.dest = null;
	};

	PDI.prototype.loop = function(callback , onEnd){
		this.clone();

		var pixels_source = this.source.imgData.data,
			pixels_dest = this.dest.imgData.data,
    		numPixels = this.source.width * this.source.height;

    	var i = 0;
    	for ( var y = 0 ; y < this.source.height ; y++ )
    		for ( var x = 0 ; x < this.source.width ; x++ ){
    			var rgb = callback(pixels_source[i*4] , pixels_source[i*4+1] , pixels_source[i*4+2] ,x,y);
    			if ( !rgb ) rgb = {r:pixels_source[i*4],g:pixels_source[i*4+1],b:pixels_source[i*4+2]};
			    pixels_dest[i*4] = rgb.r;
			    pixels_dest[i*4+1] = rgb.g; // Green
			    pixels_dest[i*4+2] = rgb.b; // Blue
			    i++;
    		}

		if ( this.events["end"] ) this.events["end"]();
		if ( onEnd ) onEnd();
		return;
	};

	PDI.prototype.on = function( trigger , callback ){
		// Eventos: end
		this.events[trigger] = callback;
	};

	PDI.prototype.snapshot = function( name ){ // Render type
		addSnapshot( this.dest.getBase64() , name );
	}

	PDI.prototype.require = function( effectStr , params ){
		efectos[effectStr].exec(this , params);
		this.snapshot(efectos[effectStr].nom);
	};

	PDI.prototype.run = function( effectStr , params ) {
		efectos[effectStr].exec(this , params);
		this.snapshot(efectos[effectStr].nom);
		this.render();
	};

	PDI.prototype.render = function(){
		MyCanvas.renderImg(this.dest);
	};

	// ************************
	//  	Transformaciones
	// ************************

	function Transformacion( constructor ){
		this.func = null;
		if ( $.isNumeric(constructor) ) {
			var cte = (255 / Math.pow(255,constructor));
			this.func = function(c){
				return ( cte * Math.pow(c,constructor) ); /// s = c * r^y ( c = 255/255^y)
			};
		} else 
			this.func = constructor;
	};

	Transformacion.prototype.exec = function( r, g, b){
		if ( $.isArray( this.func ) )
			return { r: this.func.r(r) , g:this.func.g(g) , b:this.func.b(b) };
		else
			return { r: this.func(r) , g:this.func(g) , b:this.func(b) };
	}

	// ************************
	//  	Efectos
	// ************************

	var efectos = {
		"negativo": {
			nom: "Negativo",
			require: null,
			exec: function(pdi){
				var trans = new Transformacion(function(c){ return 255-c;});
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
		"histograma_ByN":  {
			nom: "Histograma Blanco y Negro",
			require: null,
			exec: function(pdi){
				pdi.require("blanco_negro");

				pdi.dispose();

				var histograma = new Array(256);
				for (var i = 0; i < histograma.length; i++)
					histograma[i] = 0;

				pdi.loop(function(b){
					histograma[b]++;
				});
				console.log(histograma);
				return histograma;
			}
		},
		"histograma_color":  {
			nom: "Histograma a Color",
			require: null,
			exec: function(pdi){
				var histograma = {r:new Array(256),g:new Array(256),b:new Array(256)};
				for (var i = 0; i < histograma.r.length; i++)
					histograma.r[i] = histograma.g[i] = histograma.b[i] = 0;

				pdi.loop(function(r,g,b){
					histograma.r[r]++;
					histograma.g[g]++;
					histograma.b[b]++;
				});
				console.log(histograma);
				return histograma;
			}
		},
		"transformacion":  {
			nom: "Transformacion",
			require: [ 
				$('<select></select>').attr("name","pre-trans")
					.append( $('<option></option>').attr("value","fact").html("Usar factor ( > 0 )") )
					.append( $('<option></option>').attr("value","umbral").html("Umbralado (0-255)") ) 
					//.append( $('<option></option>').attr("value","2").html("2") )
					,
				$('<input>').attr("name","factor").attr("placeholder","Factor")
					.attr("title","s = r ^ factor")
					.attr("value","1.5"),
				$('<span></span>').html(" Blanco y Negro").prepend(
					$('<input>').attr("name","byn").attr("type","checkbox"))
			],
			exec: function(pdi,params,trans) {
				var factor = 1;
				if ( params ) {
					if ( params[0].value == "fact" && $.isNumeric(params[1].value) ) factor = params[1].value;
					else if ( params[0].value == "umbral" && $.isNumeric(params[1].value) ) factor = function(c){
						return ( c > params[1].value ) ? 0 : 255;
					};
					else if ( params[0].value == "someOther" ) factor = 1;

					if ( params[2] && params[2].value == "on" ) {
						pdi.require("blanco_negro");
						pdi.dispose();
						console.log("Blanco y negro");
					}
				}

				if ( !trans ) trans = new Transformacion(factor);

				console.log("Transformando");
				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});
			}
		},
	}

	// ************************
	// 		UI
	// ************************
	var $menu = $('nav#menu'),
		opts = {
			$despliegue: $menu.find('a[role="opt"]'),
			$container: $menu.find('#opciones'),
			$pasos: $menu.find('#pasos')
		},
		source = {
			$select: $menu.find('select[name="imgsource"]'),
			$input: $menu.find('input[name="imgremotesource"]'),
			$btn: $menu.find('button[name="load"]')
		},
		effects = {
			$form: $menu.find('form'),
			$select: $menu.find('select[name="effect"]'),
			$btn: $menu.find('button[name="render"]')
		};

	// Completar efectos
	effects.$select.append( $('<option></option>').val("").html(" -- Elegir efecto --").attr("selected","selected") );
	for ( var key in efectos )
		effects.$select.append( $('<option></option>').val(key).html(efectos[key].nom) );

	opts.$despliegue.on('click',function(e){
		e.preventDefault();
		var $li = $(this).parent();
		if ( opts.$despliegue.parent().hasClass("active") ) {
			$li.removeClass("active");
			opts.$container.slideUp("slow");
		} else {
			$li.addClass("active");
			opts.$container.slideDown("slow");
		}
	});

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

	effects.$select.on('change',function(){
		if ( effects.$select.val() == "" ) {
			effects.$btn.attr("disabled",true);
			return;
		} else effects.$btn.attr("disabled",false);
		effects.$form.empty();
		if ( efectos[effects.$select.val()].require == null ) return;
		var appends = efectos[effects.$select.val()].require;
		appends.forEach(function(e){
			effects.$form.append(e.addClass("form-control"));
		});
	});

	effects.$btn.on('click',function(){
		emptySnapshot();
		if ( effects.$select.val() == "" ) return;
		new PDI(imag).run( effects.$select.val() , effects.$form.serializeArray() );
	});

	function addSnapshot(href,name){ opts.$pasos.append( $('<li></li>').append($('<a></a>').attr("href",href).html(name).attr("target","_blank") ) ); };
	function emptySnapshot(){ opts.$pasos.empty(); };

})();