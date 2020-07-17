
//main three.js stuff
let deltaCountCreate = 0;
let deltaCountUpdate = 0;
let running = false;
const clock = new THREE.Clock( false );
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer( { antialias: true } );
const raycaster = new THREE.Raycaster();

//the surfacenet generator
const surfaceNetEngine = new SurfaceNets();

//preloaded material (to share)
let whiteMaterial;
let edgeMaterial;

//grid resolution
const gridSize = 32;
const gridSizeY = 80;
const gridScale = 8;
const chunkSize = gridSize * gridScale;
const chunkViewDistance = 5;
const initialTerrainCount = Math.pow( chunkViewDistance * 2 + 1, 2 );

//chunks
const chunks = {};
const updateChunks = {};
const createNewChunks = {};

//player
let player;

//input key codes
const key = {
	up: 87,
	down: 83,
	left: 65,
	right: 68,
	shift: 16,
	space: 32,
	flyMode: 70
};






//                        .                          
//                      .o8                          
//  .oooo.o  .ooooo.  .o888oo oooo  oooo  oo.ooooo.  
// d88(  "8 d88' `88b   888   `888  `888   888' `88b 
// `"Y88b.  888ooo888   888    888   888   888   888 
// o.  )88b 888    .o   888 .  888   888   888   888 
// 8""888P' `Y8bod8P'   "888"  `V88V"V8P'  888bod8P' 
//                                         888       
//                                        o888o 

function setup() {

	//no p5 canvas
	let cnv = createCanvas( windowWidth, windowHeight );
	cnv.parent( 'p5Div' );
	cnv.mouseWheel( mouseScrolled );
	noLoop();
	textSize( height * 0.015 );


	//THREE Renderer
	renderer.setClearColor( new THREE.Color( 'rgb(44, 168, 221)' ), 1.0 );
	renderer.setSize( windowWidth, windowHeight );
	document.getElementById( 'threeDiv' ).appendChild( renderer.domElement );


	//prepare pointerLock api
	if ( 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document ) {

		renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock || renderer.domElement.webkitRequestPointerLock;
		document.addEventListener( 'pointerlockchange', pointerLockChangeCallback, false );
		document.addEventListener( 'mozpointerlockchange', pointerLockChangeCallback, false );
		document.addEventListener( 'webkitpointerlockchange', pointerLockChangeCallback, false );

	}

	

	//lights
	let amb = new THREE.AmbientLight( new THREE.Color( "rgb(240,240,240)" ), 0.5 );
	scene.add( amb );

	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set( gridSize, 100, gridSize );
	scene.add( directionalLight );


	//fog
	scene.fog = new THREE.Fog( 'white', chunkSize * 2, chunkViewDistance * chunkSize * 1.4 );


	//preload materials
	whiteMaterial = new THREE.MeshLambertMaterial( {

		color: 'white'

	} );

	lineMaterial = new THREE.LineBasicMaterial( {

		color: 'rgb(80, 80, 80)'
		
	});


	//terrainSeed!
	let rnd = floor( random( 99999 ) );
	noiseSeed( rnd ); //p5 function to set the seed of the perlin noise gen


	//init chunks,
	let loadInitialTerrain = function() {

		if ( Object.keys( chunks ).length == initialTerrainCount - 1 ) {
	
			document.getElementById( 'playButton' ).textContent = "PLAY";
			player = new Player( { x: 0, z: 0 } );
	
		}
	
	};

	for ( let x = - chunkViewDistance; x <= chunkViewDistance; x ++ ) {

		for ( let z = - chunkViewDistance; z <= chunkViewDistance; z ++ ) {

			chunks[ x + ":" + z ] = new Chunk( x, z, loadInitialTerrain );

		}

	}

}












//                                      .o8                     
//                                     "888                     
// oooo d8b  .ooooo.  ooo. .oo.    .oooo888   .ooooo.  oooo d8b 
// `888""8P d88' `88b `888P"Y88b  d88' `888  d88' `88b `888""8P 
//  888     888ooo888  888   888  888   888  888ooo888  888     
//  888     888    .o  888   888  888   888  888    .o  888     
// d888b    `Y8bod8P' o888o o888o `Y8bod88P" `Y8bod8P' d888b    
															 

function render() {

	if ( running ) requestAnimationFrame( render );

	let delta = clock.getDelta();

	//update chunks after digging
	deltaCountUpdate += delta;
	if ( deltaCountUpdate >= 0.2 && Object.keys( updateChunks ).length > 0 ) {

		//create array of promises
		let promises = [];

		Object.keys( updateChunks ).forEach( chunk=>{

			promises.push( chunks[ chunk ].update() );
			delete updateChunks[ chunk ];

		} );

		//run promises
		Promise.all( promises ).then();

		deltaCountUpdate = 0;
	}

	//create new chunks
	deltaCountCreate += delta;
	if ( deltaCountCreate >= 0.22 && Object.keys( createNewChunks ).length > 0 ) {

		let chunkKey = Object.keys( createNewChunks )[ 0 ];
		if ( ! chunks[ chunkKey ] ) {

			let createChunk = new Promise((resolve, reject)=>{

				chunks[ chunkKey ] = new Chunk( createNewChunks[ chunkKey ].x, createNewChunks[ chunkKey ].y, function () {} );
				delete createNewChunks[ chunkKey ];

				resolve();

			})
			
			//only load one promise
			createChunk.then();			

		}

		deltaCountCreate = 0;

	}

	//update player controller. moving/collision/digging
	player.update( delta );

	//draw text on screen and crosshair
	drawHud();

	
	//render scene
	renderer.render( scene, player.camera );

}









//  .o88o.                                       .    o8o                                 
//  888 `"                                     .o8    `"'                                 
// o888oo  oooo  oooo  ooo. .oo.    .ooooo.  .o888oo oooo   .ooooo.  ooo. .oo.    .oooo.o 
//  888    `888  `888  `888P"Y88b  d88' `"Y8   888   `888  d88' `88b `888P"Y88b  d88(  "8 
//  888     888   888   888   888  888         888    888  888   888  888   888  `"Y88b.  
//  888     888   888   888   888  888   .o8   888 .  888  888   888  888   888  o.  )88b 
// o888o    `V88V"V8P' o888o o888o `Y8bod8P'   "888" o888o `Y8bod8P' o888o o888o 8""888P' 
                                                                                       
                                                                                       

function windowResized() {

	resizeCanvas( windowWidth, windowHeight );
	textSize( height * 0.015 );

	renderer.setSize( windowWidth, windowHeight );
	player.camera.aspect = windowWidth / windowHeight;
	player.camera.updateProjectionMatrix();

}

function start() {

	renderer.domElement.requestPointerLock();
	THREEx.FullScreen.request();
	running = true;
	clock.start();
	document.getElementById( 'mainMenu' ).classList.add( 'hidden' );
	render();

}

function drawHud() {

	clear();
	noFill();
	stroke( 120, 200 );

	strokeWeight( 3 );
	point( width / 2, height / 2 );
	strokeWeight( 1 );
	ellipse( width / 2, height / 2, min( width, height ) * 0.1 );


	//make this better.... or not
	noStroke();
	fill( 40, 200 );
	text( "WASD           -  Move around.", width * 0.01, height * 0.1 );
	text( "SHIFT           -  Sprint.", width * 0.01, height * 0.12 );
	text( "SPACE          -  Jump / Fly.", width * 0.01, height * 0.14 );
	text( "MOUSE L/R  -  Remove/add terrain.", width * 0.01, height * 0.16 );
	text( "F                    -  Fly mode: " + player.flyModes[ player.selectedFlyMode ], width * 0.01, height * 0.18 );
	
	text( "SCROLL       -  Brush radius: " + player.brushRadius, width * 0.01, height * 0.20 );



}

function getChunkCoord( pos ) {

	return new THREE.Vector2( pos.x / chunkSize, pos.z / chunkSize ).floor();

}
function getChunkKey( coord ) {

	return coord.x + ":" + coord.y;

}










                                                 
                                                 
// oooo  oooo   .oooo.o  .ooooo.  oooo d8b          
// `888  `888  d88(  "8 d88' `88b `888""8P          
//  888   888  `"Y88b.  888ooo888  888              
//  888   888  o.  )88b 888    .o  888              
//  `V88V"V8P' 8""888P' `Y8bod8P' d888b             
                                                 
                                                 
                                                 
//  o8o                                         .   
//  `"'                                       .o8   
// oooo  ooo. .oo.   oo.ooooo.  oooo  oooo  .o888oo 
// `888  `888P"Y88b   888' `88b `888  `888    888   
//  888   888   888   888   888  888   888    888   
//  888   888   888   888   888  888   888    888 . 
// o888o o888o o888o  888bod8P'  `V88V"V8P'   "888" 
//                    888                           
//                   o888o                          
                                                 

function onMouseMove( e ) {

	player.mouseMoved( e );

}

function pointerLockChangeCallback() {

	if ( document.pointerLockElement === renderer.domElement ||
  		document.mozPointerLockElement === renderer.domElement ||
  		document.webkitPointerLockElement === renderer.domElement ) {

		document.addEventListener( "mousemove", onMouseMove, false );

	} else {

		document.removeEventListener( "mousemove", onMouseMove, false );
		document.getElementById( 'mainMenu' ).classList.remove( 'hidden' );
		running = false;

	}

}

function mouseScrolled( e ) {

	player.mouseScrolled( e );

}

function keyPressed() {

	switch ( keyCode ) {

		case key.flyMode:
			
			if ( ++ player.selectedFlyMode == player.flyModes.length ) player.selectedFlyMode = 0;

		break;

	}

}






















