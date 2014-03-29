<?php

require_once("../images/imageProcessor.class.php");

$imagen = new Imagen();
$imagen->fromURL( $_GET["url"] );

?>