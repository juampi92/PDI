<?php

require_once("imagen.class.php");

abstract class ImageProcessor {
	protected $fuente = null;
	protected $destino = null;

	public function __construct( $image ){
		$this->fuente = $image;
	}

	abstract public function getForm();
	abstract public function exec( $options );

	public function run( $form ){
	
		}
} ?>