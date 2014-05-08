(function(){

	engine.MyCanvas.init();
	engine.Video.init();

	// ************************
	// 		Algoritmos
	// ************************

	function MovementDetection(img1,img2){
		var p = new Process(img1,img2);

		p.loop(function(i1,i2,x,y){

			var r = Math.abs(i1.r - i2.r),
				g = Math.abs(i1.g - i2.g),
				b = Math.abs(i1.b - i2.b);

			if ( r + g + b > 100 ) {
				r = 255;  g = b = 0;
			} else {
				r = g = b = 0;
			}

			return {r:r,g:g,b:b};
		});

		p.render();
	}

	// ************************
	// 		UI
	// ************************
	var $menu = $("ul.nav.navbar-nav");

	var ui = {
		$els: {
			play: $menu.find('button[role="play"]')
		},
		last: null,
		init: function(){
			// Inicializar selectores

			// Completar efectos

			// Eventos:
			this.setEvents();
		},
		setEvents: function(){
			var self = this;
			
			this.$els.play.on('click',function(e){
				e.preventDefault();

				var $this = $(this);
				if ( $this.data("pressed") != "true" ) {
					engine.Video.processStart(MovementDetection);
					$this.data("pressed","true");
					$this.html("Stop");
				} else {
					engine.Video.processEnd();
					$this.data("pressed","false");
					$this.html("Play");
				}
			});
			
		}
	}; // ./ ui
	ui.init();

})();