(function(){
	engine.MyCanvas.init();

	// ************************************************
	//  					Efectos
	// ************************************************

	var efectos = {
		"negativo": {
			nom: "Negativo",
			require: null,
			exec: function(pdi){
				var trans = new engine.Transformacion_color(transformaciones.color.negativo);
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
					pdi.require(efectos,"blanco_negro");
					pdi.dispose();
				}

				pdi.source.histograma = new engine.Histograma(pdi.source);
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

				pdi.require(efectos,efectos,"histograma",params);
				//pdi.dispose();

				pdi.source.histograma.ecualizar();

				var trans = new engine.Transformacion_color(null);
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
						pdi.require(efectos,"blanco_negro");
						pdi.dispose();
					}
				}

				if ( !trans ) trans = new engine.Transformacion_color(factor);

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
					var hsv = engine.Color.RGBtoHSV(r,g,b);
					hsv.h = hsv.h * H;
					hsv.s = Math.min(100,hsv.s * S);
					//hsv.v = Math.min(100,hsv.v * V);
					var rgb = engine.Color.HSVtoRGB(hsv.h,hsv.s,hsv.v);
					return rgb;
				}

				if ( !trans ) trans = new engine.Transformacion_color(factor,true);

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
						pdi.require(efectos,"blanco_negro");
						pdi.dispose();
					}
				}

				grado = (grado * Math.PI ) / 180; // To radians

				var centroX = Math.floor(pdi.source.width / 2),
					centroY = Math.floor(pdi.source.height / 2);

				if ( !trans ) trans = new engine.Transformacion_pixel(function(r,g,b,x,y){
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
						pdi.require(efectos,"blanco_negro");
						pdi.dispose();
					}
				}

				var f = new engine.Filtro(filtro.matriz,filtro.factor);
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

				pdi.require(efectos,"blanco_negro");
				pdi.dispose();

				var f = new engine.Filtro(filtro.matriz,filtro.factor);

				pdi.loop(function(r,g,b,x,y){
					return f.exec(pdi.source,x,y);
				});
			}
		},
		"bordes_all":{
			nom: "Detectar Bordes",
			require:  [],
			exec: function(pdi,params){
				pdi.require(efectos,"blanco_negro");
				pdi.dispose();

				// Reducción de ruido
				/*var canny = new engine.Filtro(filtros.ruido.canny.matriz,filtros.ruido.canny.factor)
				pdi.loop(function(r,g,b,x,y){
					return canny.exec(pdi.source,x,y);
				});
				pdi.dispose();*/

				var pdi_x = new engine.PDI(pdi.source),
					pdi_y = new engine.PDI(pdi.source);

				var f_x = new engine.Filtro(filtros.bordes["sobel_h"].matriz,filtros.bordes["sobel_h"].factor),
					f_y = new engine.Filtro(filtros.bordes["sobel_v"].matriz,filtros.bordes["sobel_v"].factor);
				
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
					var hsv = engine.Color.RGBtoHSV(r,g,b);
					hsv.s = Math.min(100,hsv.s * sat);
					var rgb = engine.Color.HSVtoRGB(hsv.h,hsv.s,hsv.v);
					return rgb;
				}

				trans = new engine.Transformacion_color(factor,true);
				pdi.loop(function(r,g,b){
					return trans.exec(r,g,b);
				});
				pdi.snapshot("Saturacion");
				pdi.dispose();

				// --------------------

				// Desenfoque
				var f = new engine.Filtro(filtros.desenfoque.gaussiano.matriz,filtros.desenfoque.gaussiano.factor);

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
				engine.ImageFileLoad(e.target.files[0],function(src){
					self.img = new engine.Imagen( src );
					self.img.load(function(i){
						engine.MyCanvas.renderImg(i);
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
					self.img = new engine.Imagen( self.source.$input.val());
					remote = true;
				} else {
					self.img = new engine.Imagen( self.source.$select.val() );
				}
				
				self.img.load(function(i){
					engine.MyCanvas.renderImg(i);
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

				new engine.PDI(self.img).run( efectos , self.effects.$select.val() , self.effects.$form.serializeArray() , function(){
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
			ui.opts.$pasos.append(
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
	engine.PDI.snapshotCallback = ui.addSnapshot;

})();