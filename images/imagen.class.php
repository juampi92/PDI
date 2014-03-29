<?php
class Imagen {
	private $img;
	public function __constructor(){

	}
	public function fromURL( $url ){
		//$fetch = file_get_contents( $url ); //$fetch = fopen( $url , 'r' );
		$array  = getimagesize($url);
		switch($array['mime']){
			case "image/png": $this->img = imagecreatefrompng( $url ); break;
			case "image/jpeg": case "image/pjpeg": $this->img = imagecreatefromjpeg( $url ); break;
			case "image/gif": $this->img = imagecreatefromgif( $url ); break;
		}
		//header('Location:data:image/jpeg;base64,' . $this->getBase64() );

		header('Content-Type: image/png');

		imagepng($this->img);
		imagedestroy($this->img);
		
	}
	public function fromFile( $filePath ){
		// Implement later
	}

	public function setPixel( $x , $y , $color ){
		if ( is_array( $color ) )
			$color = imagecolorallocate ( $this->img , $color[0] , $color[1] , $color[2] );
		else 
			$color = imagecolorallocate ( $this->img , $color , $color , $color );
		imagesetpixel( $this->img , $x , $y , $color );
	}

	public function getPixel( $x , $y ){
		$index = imagecolorat ( $this->img , $x , $y );
		return imagecolorsforindex( $this->img , $index);
	}

	public function getBase64(){
		ob_start();
		imagepng($this->img);
		$buffer = ob_get_clean();
		ob_end_clean();
		return base64_encode($buffer);
	}
}