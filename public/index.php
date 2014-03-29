<?php
	$ejercicios = array();
	function fileSystem(Array &$padre , $folder){
		$files = scandir($folder);
		$files = array_slice($files,2);
		foreach ( $files as $file ){
			if ( is_dir($folder . "/" . $file) ) {
				$padre[$file] = array();
				fileSystem($padre[$file],$folder . "/" . $file);
			} elseif( true ){
				array_push( $padre , $file );
			}
		};
	}
	fileSystem( $ejercicios , "../images/ejercicios");
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="description" content="">
		<meta name="author" content="">
		<link rel="shortcut icon" href="assets/ico/favicon.ico">
		
		<title>PDI</title>
		
		<!-- Bootstrap core CSS -->
		<link href="css/bootstrap.min.css" rel="stylesheet">
		
		<!-- Custom styles for this template -->
		<!-- <link href="offcanvas.css" rel="stylesheet"> -->
	</head>
	<body>
		<div id="navbar" class="navbar navbar-fixed-top navbar-inverse" role="navigation">
		  <div class="container">
		    <div class="navbar-header">
		      <a class="navbar-brand">PDI</a>
		    </div>
		    <div class="collapse navbar-collapse">
		      <ul class="nav navbar-nav" id="menu">
		        <li><a href="#" data-rol="ejercicio"><b>Ejercicio</b></a></li>
		        <li><a href="#" data-rol="opciones">Opciones</a></li>
		      </ul>
		      <ul class="nav navbar-nav navbar-right" id="zoom">
		        <li><a href="#" data-resize="in" title="Zoom in"><span class="glyphicon glyphicon-zoom-in"></span></a></li>
		        <li><a href="#" data-resize="out" title="Zoom out"><span class="glyphicon glyphicon-zoom-out"></span></a></li>
		        <li><a href="#" data-resize="def" title="Default size"><span class="glyphicon glyphicon-resize-full"></span></a></li>
		      </ul>
		    </div>
		    <div id="opciones" style="display:none;">
		    	<h2 style="color:white;">Opciones</h2>
		    	<form name="formulario">
		    		<div class="form-group">
		    			<input type="text" name="url" placeholder="url to image">
		    		</div>
		    		<button type="button" class="btn btn-primary">Enviar</button>
		    	</form>
		    </div>
		  </div>
		</div>
		<div id="container" style="margin-top:50px;padding:auto;vertical-align: middle;height:100%;">
			<span style="display: inline-block;height: 100%;vertical-align: middle;"></span>
			<img id="image" src="" width="500" style="margin:auto;display: table-cell;
    vertical-align: middle;">
		</div>
		<script src="js/jquery.min.js"></script>
		<script src="js/bootstrap.min.js"></script>
		<script type="text/javascript">var files = <?=json_encode($ejercicios)?>;</script>
		<script src="js/script.js"></script>
	</body>
</html>