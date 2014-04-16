<html>
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="description" content="">
		<meta name="author" content="">
		<link rel="shortcut icon" href="../assets/favicon.ico">

		<title>PDI using HTML5</title>
	
		<link href="css/bootstrap.min.css" rel="stylesheet">
		<link href="css/style.css" rel="stylesheet">
	</head>
	<body>
		<nav id="menu" class="navbar navbar-inverse navbar-default navbar-fixed-top" role="navigation">
			<div class="container">
			    <div class="navbar-header"> <a class="navbar-brand"><b>PDI</b> (HTML5)</a> </div>
			    <!-- Collect the nav links, forms, and other content for toggling -->
			    <div>
				    <ul class="nav navbar-nav">
						<li><a href="#" role="opt">Opciones <b class="caret"></b></a></li>
						<li class="current" style="display:none;">
							<a rol="reset" href="#">
								<span class="glyphicon glyphicon-remove"></span> <img height="40">
							</a>							
						</li>
					</ul>
					<ul class="nav navbar-nav navbar-right">
						<li style="margin-top:-5px;margin-bottom:-5px">
							<a href="https://github.com/juampi92/PDI" target="_blank"><img src="css/github.png" title="Forkeame en github!"></a>
						</li>
					</ul>
				</div>
			</div>
			<div class="container" id="opciones" style="display:none;">
				<div>
					<div class="col-md-9">
						<div class="form-inline" sector="fuente">
							<h4>Imagen fuente</h4>	
							<select name="imgsource" class="form-control">
								<option value="assets/sample1.jpg">sample1</option>
								<option value="assets/sample2.jpg">sample2</option>
								<option value="assets/sample3.jpg">sample3</option>
								<option value="assets/lenna.png">Lena</option>
							</select>
							<input type="text" class="form-control" placeholder="URL to image" name="imgremotesource">
							<button type="button" name="load" class="btn btn-primary">Cargar</button>
						</div>					
						<div class="form-inline" style="display:none;" sector="efecto">
							<h4>Efecto</h4>
							<select name="effect" class="form-control"></select>
							<form></form>
							<button type="button" name="render" disabled="true" class="btn btn-success">Render</button>
						</div>
					</div>
					<div class="col-md-3">
						<h4>Pasos</h4>
						<ul id="pasos"></ul>
					</div>
				</div>
				<div id="slideUp-footer"></div>				
			</div>
		</nav>
		<content>
			<canvas id="canvas"></canvas>
		</content>

		<script src="js/jquery.min.js"></script>
		<script src="js/getimagedata.min.js"></script>
		<script src="js/script.js"></script>
		<script type="text/javascript">
			var php = false;
			//Test php: <?php echo "\nphp = true;"?>

			if ( !php ) $('input[name="imgremotesource"]').attr("disabled","true").hide();
		</script>
	</body>
</html>