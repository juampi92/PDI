(function(){

	var Imagen = {
		loaded: false,
		$img : $('img#image'),
		init: function(){
			this.loaded = false;
			this.$img.css('display','none');
		},
		loading: function(){
			this.loaded = false;
		},
		render : function ( base ) {
			this.loaded = true;
			this.$img.attr('src', 'data:image/jpeg;base64,' + base);
			this.$img.css('display','block');
			this.resize();
		},
		resize : function( type ){
			if ( !this.loaded ) return;

			if ( type == "in") {
				// Bigger
				console.log("Resize Bigger");
			} else if ( type == "out") {
				// Smaller
				console.log("Resize Smaller");
			} else {
				// Default size
				console.log("Resize Default size");
			}
			
		}
	};

	var Menu = {
		$menu: $('ul#menu'),
		$opciones: $('#opciones'),
		$zoom: $('ul#zoom'),
		$form: null,
		init: function(){
			this.$form = this.$opciones.children('form');
			this.clickEvents();
		},
		clickEvents: function(){
			var self = this;
			// Zoom:
			this.$zoom.on('click','a',function(e){
				e.preventDefault();
				var $this = $(this),
					res = $this.data('resize');
				Imagen.resize(res);
			});
			// Toggle Options
			this.$menu.on('click','a',function(e){
				e.preventDefault();
				var $this = $(this),
					id = $this.data('rol');
				if ( id == "opciones" ) {
					// Toggle:
					if ( self.$opciones.is( ":hidden" ) ){
						self.$opciones.slideDown("fast");
						$this.addClass("active");
					} else {
						self.$opciones.slideUp("fast");
						$this.removeClass("active");
					}
				} else if ( id == "ejercicios") {
					console.log("Mostrar ejercicios");
				}
			});
			// Send form
			this.$form.find('button').click(function(e){
				e.preventDefault();
				console.log( self.$form.serialize() );
				//console.log("Click agarrado");
			});
		}
	}

	Imagen.init();
	Menu.init();

})();