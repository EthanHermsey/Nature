let running = false;
const clock = new THREE.Clock( false );
const scene = new THREE.Scene();
scene.down = new THREE.Vector3( 0, - 1, 0 );
const renderer = new THREE.WebGLRenderer( {
	antialias: true,
	logarithmicDepthBuffer: true
} );
const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;

//chunks
let chunkController;

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
	cnv.parent( 'p5-div' );
	noLoop();
    textFont("'Fira Sans', sans-serif");
	textSize( height * 0.015 );
	const birdSound = document.querySelector( 'audio' );
	birdSound.volume = 0.2;
	birdSound.desiredVolume = 0.2;
	birdSound.setVolume = ( volume, ramp )=>{

		birdSound.desiredVolume = volume;

		if ( ! birdSound.timer ) {

			let timer = 0;
			const diff = ( birdSound.desiredVolume - birdSound.volume ) * 0.1;
			birdSound.timer = setInterval( () => {

				birdSound.volume = Math.max( Math.min( birdSound.volume + diff, 1 ), 0 );

				if ( ++ timer >= 10 ) {

					clearInterval( birdSound.timer );
					birdSound.timer = undefined;

				}

			}, ramp * 100 );

		}

	};



	//THREE Renderer
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize( windowWidth, windowHeight );
	document.getElementById( 'three-div' ).appendChild( renderer.domElement );


	//prepare pointerLock api
	if ( 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document ) {

		renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock || renderer.domElement.webkitRequestPointerLock;
		document.addEventListener( 'pointerlockchange', pointerLockChangeCallback, false );
		document.addEventListener( 'mozpointerlockchange', pointerLockChangeCallback, false );
		document.addEventListener( 'webkitpointerlockchange', pointerLockChangeCallback, false );

	}

	//fps counter
	stats = new Stats();
	stats.setMode( 0 );
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.zIndex = '10';
	stats.domElement.style.left = '0';
	stats.domElement.style.top = '0';
	document.body.appendChild( stats.domElement );



	//lights
	let amb = new THREE.AmbientLight( new THREE.Color( "rgb(240,240,240)" ), 0.5 );
	scene.add( amb );

	//fog
	// scene.fog = new THREE.FogExp2( 'lightgrey', 0.0008 );
	scene.fog = new THREE.FogExp2( 'lightgrey', 0.0003 );

	//terrainSeed
	let rnd = 32921; //is very nice
	// let rnd = floor( random( 99999 ) );
	console.log( '> Seed: ' + rnd );
	noiseSeed( rnd ); //p5 function to set the seed of the perlin noise gen

    //player!
    player = new Player();
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

	// chunkController.update( delta );

	//update player controller. moving/collision/digging
	player.update( delta );

	//draw text on screen and crosshair
	drawHud();

	animateVegetation( delta );

	//update fps counter
	stats.update();

	//render scene
	renderer.render( scene, player.camera );
	// composer.render( delta );

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

function startLoading(){

    document.getElementById( 'menu-content' ).classList.add( 'hidden' );
    document.getElementById( 'loading-container' ).classList.remove( 'hidden' );
    
    renderer.domElement.requestPointerLock();
	THREEx.FullScreen.request();

	preloadModels().then(() => {

        document.getElementById( 'loading-img' ).classList.add( 'hidden' );
        chunkController = new ChunkController( ( controller ) => {										
            
            document.getElementById( 'loading-img' ).classList.remove( 'hidden' );

            player.init(
                controller.chunks[ getChunkKey( { x: 0, y: 0 } ) ],
                () => {

                    controller.updateVisibleChunkTerrainArray();
                    controller.updateCastChunkTerrainArray();
                    start()

                }
            );
        } );
    })
}

function start( userEvent ) {

    document.addEventListener( "mousemove", onMouseMove, false );
    if ( userEvent ){
        renderer.domElement.requestPointerLock();
        THREEx.FullScreen.request();
    }

	running = true;
	clock.start();
    chunkController.toggleClock(true);
	document.querySelector( 'audio' ).play();
	document.getElementById( 'main-menu' ).classList.add( 'hidden' );
	render();
    
}

function stop(){

    document.removeEventListener( "mousemove", onMouseMove, false );
    document.getElementById( 'main-menu' ).classList.remove( 'hidden' );
    document.getElementById( 'menu-content' ).classList.remove( 'hidden' );
    document.getElementById( 'loading-container' ).classList.add( 'hidden' );
    running = false;
    clock.stop();
    chunkController.toggleClock(false);
    document.querySelector( 'audio' ).pause();

}

function drawHud() {
    
    clear();
	noFill();
	stroke( 120, 200 );
    
	strokeWeight( 3 );
	point( width / 2, height / 2 );
	strokeWeight( 1 );
	ellipse( width / 2, height / 2, min( width, height ) * 0.025 );
    
	noStroke();
	fill( 80, 200 );
	text( "WASD", width * 0.01, height * 0.08 );
	text( "- move", width * 0.065, height * 0.08 );

	text( "SHIFT", width * 0.01, height * 0.1 );
    text( "- sprint", width * 0.065, height * 0.1 );	

	text( "SPACE", width * 0.01, height * 0.12 );
	text( "- jump", width * 0.065, height * 0.12 );

	text( "MOUSE L/R", width * 0.01, height * 0.14 );
    text( "-  remove/add terrain", width * 0.065, height * 0.14 );
	
    
    
    
}

function animateVegetation( delta ) {
    
    //update grass animation
	let r = 1.0 + ( Math.random() * 0.5 );
	if ( modelBank.grassModel1.material.userData.shader ) modelBank.grassModel1.material.userData.shader.uniforms.time.value += delta * r;
	if ( modelBank.grassModel2.material.userData.shader ) modelBank.grassModel2.material.userData.shader.uniforms.time.value += delta * r;
	//update tree1 animation
	if ( modelBank.treeModelHigh.children[ 1 ].material.userData.shader ) {
        
        modelBank.treeModelHigh.children[ 1 ].material.userData.shader.uniforms.time.value += delta * r;
        
	}
	if ( modelBank.treeModelHigh.children[ 0 ].material.userData.shader ) {
        
        modelBank.treeModelHigh.children[ 0 ].material.userData.shader.uniforms.time.value += delta * r;
        
	}
	//update tree2 aimation
	if ( modelBank.treeModelHigh2.children[ 1 ].material.userData.shader ) {
        
        modelBank.treeModelHigh2.children[ 1 ].material.userData.shader.uniforms.time.value += delta * r;
        
	}
	if ( modelBank.treeModelHigh2.children[ 0 ].material.userData.shader ) {
        
        modelBank.treeModelHigh2.children[ 0 ].material.userData.shader.uniforms.time.value += delta * r;
        
	}
	//update grasHigh
	if ( modelBank.grassModelHigh.material.userData.shader ) {
        
        modelBank.grassModelHigh.material.userData.shader.uniforms.time.value += delta * r;
        
	}
	//update fern
	if ( modelBank.fernModel.material.userData.shader ) {
        
        modelBank.fernModel.material.userData.shader.uniforms.time.value += delta * r;
        
	}
    
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

	if ( document.pointerLockElement !== renderer.domElement &&
  		document.mozPointerLockElement !== renderer.domElement &&
  		document.webkitPointerLockElement !== renderer.domElement ) {

        stop();

	}

}
