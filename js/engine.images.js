if ( engine == undefined ) throw "Se requiere al motor";

	// ************************************************
	//  				Transformaciones
	// ************************************************

	engine.Transformacion_color = function( constructor , color_junto ){
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

	engine.Transformacion_color.prototype.lut = function( lut ){
		this._lut = true;
		this.func = lut;
	};

	engine.Transformacion_color.prototype.exec = function( r, g, b){
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

	engine.Transformacion_pixel = function( constructor ){
		this.func = constructor;
	};

	engine.Transformacion_pixel.prototype.exec = function(r,g,b,x,y){
		return this.func(r,g,b,x,y);
	}

	// ************************************************
	//  					Filtros
	// ************************************************	

	engine.Filtro = function(matriz , factor){
		this.matrix = matriz;
		this.w = matriz[0].length;
		this.h = matriz.length;
		this.center = [ (this.w-1) / 2 , (this.h-1) / 2];
		this.factor = ( factor ) ? factor : false;
	};

	engine.Filtro.prototype.exec = function( image , x , y ){
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
	//  				Histograma
	// ************************************************

	engine.Histograma = function( imagen ){
		this.img = imagen;
		this.color = false;
		this.histograma = null;
		this.histogramax = 0;
		this.lut = null; // Look up table
	};

	engine.Histograma.prototype.calcular = function( color ){
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

	engine.Histograma.prototype.get = function(){
		return this.histograma;
	};

	engine.Histograma.prototype.procesar = function(funcion){
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

	engine.Histograma.prototype.ecualizar = function(){
		var self = this;
		this.procesar(function(h,l){self._ecualizar_simple(h,l)});
	};

	engine.Histograma.prototype._ecualizar_simple = function( histograma , lut ){
		var sum = 0,
			pixelCount = this.img.width * this.img.height;

		lut[0] = histograma[0];
		for ( var i = 1; i < 256; ++i )
		    lut[i] = lut[i-1] + histograma[i];

		for ( var i = 0; i < 256; i++)
			lut[i] = Math.floor(lut[i] * 255 / pixelCount);
	};

	engine.Histograma.prototype.getLUT = function( r , g , b  ){
		if ( this.color )
			return {
				r:this.lut.r[r],
				g:this.lut.g[g],
				b:this.lut.b[b],
			};
		else
			return this.lut[r];
	};

	engine.Histograma.prototype.draw = function(){
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

	engine.Histograma.prototype._draw = function( histograma , color , context , offsetX , maxY , factorY){
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