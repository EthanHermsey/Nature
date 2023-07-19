let running = false;
let loaded = false;
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
let terrainController;

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
	textSize( width * 0.009 );

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

    const position = localStorage.getItem('position');
    if ( position ){
        document.getElementById( 'load-button' ).classList.remove( 'hidden' );
        document.getElementById( 'start-button' ).textContent = 'new';
    };

    document.getElementById( 'load-button' ).addEventListener('click', setFullscreen, true);
    document.getElementById( 'start-button' ).addEventListener('click', setFullscreen, true);

	//THREE Renderer
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.3;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize( windowWidth, windowHeight );
	document.getElementById( 'three-div' ).appendChild( renderer.domElement );


	//fps counter
	stats = new Stats();
	stats.setMode( 0 );
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.zIndex = '10';
	stats.domElement.style.left = '0';
	stats.domElement.style.top = '0';
	document.body.appendChild( stats.domElement );



	//lights
	let amb = new THREE.AmbientLight( new THREE.Color( "rgb(240,240,240)" ), 0.25 );
	scene.add( amb );

	//fog
	scene.fog = new THREE.FogExp2( 'lightgrey', 0.0005 );

	//terrainSeed
	let rnd = 32921; //is very nice
	// let rnd = floor( random( 99999 ) );
	console.log( '> Seed: ' + rnd );
	noiseSeed( rnd ); //p5 function to set the seed of the perlin noise gen

    //player!
    player = new Player();

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

	if ( !document.pointerLockElement ) {

        stop();

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

	// update player controller
	player.update( delta );

	// animate terrain
    terrainController.animate( delta );	

    // draw text on screen and crosshair
	drawHud();

	// update fps counter
	stats.update();

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
    
	renderer.setSize( windowWidth, windowHeight );
	player.camera.aspect = windowWidth / windowHeight;
	player.camera.updateProjectionMatrix();
    
}

function setFullscreen( e ){

    THREEx.FullScreen.request();
    setTimeout(()=>{
        ((e) => {
            renderer.domElement.requestPointerLock();
            if ( 'pointerLockElement' in document ) document.addEventListener( 'pointerlockchange', pointerLockChangeCallback, false );
        })(e)
    }, 400);

}

function loadFromStorage(){

    if ( loaded ){
                    
        start( true );

    } else {

        const {position, offset} = JSON.parse(localStorage.getItem('position'));
        startLoading( offset )
            .then(() => {
                player.position.fromArray( position );
                terrainController.updateInstancedObjects();
            });

    }

}

function loadNew(){
    startLoading()
        .then(() => {
            terrainController.updateInstancedObjects();
        });
}


function startLoading( offset ){

    return new Promise( async ( resolve ) => {

        document.getElementById( 'menu-content' ).classList.add( 'hidden' );
        document.getElementById( 'loading-container' ).classList.remove( 'hidden' );                
        document.getElementById( 'loading-img' ).classList.add( 'hidden' );

        if ( !offset ){
            const db = new DB('grid-data');
            db.clear();
        }

        if ( !terrainController ) {
            
            await new Promise((resolve) => {
                terrainController = new TerrainController( offset, () => resolve() );
                scene.add( terrainController );                
            })
            
        } else {

            await terrainController.init();

        }        
            
        document.getElementById( 'loading-img' ).classList.remove( 'hidden' );

        offset = offset || { x: 0, z: 0 };

        player.init(
            terrainController.getChunk( terrainController.getChunkKey( offset ) ),
            () => {

                loaded = true;                
                start();
                resolve();

            }
        );

    })

}

function start( userEvent ) {

    document.addEventListener( "mousemove", onMouseMove, false );
    if ( userEvent ){
        THREEx.FullScreen.request();
        renderer.domElement.requestPointerLock();
    }

    if ( 'pointerLockElement' in document ) document.addEventListener( 'pointerlockchange', pointerLockChangeCallback, false );

    running = true;
	clock.start();
    terrainController.toggleClock(true);
	document.querySelector( 'audio' ).play();
	document.getElementById( 'main-menu' ).classList.add( 'hidden' );
	render();
    
}

function stop(){

    THREEx.FullScreen.cancel();
    document.removeEventListener( "mousemove", onMouseMove, false );

    document.getElementById( 'main-menu' ).classList.remove( 'hidden' );
    document.getElementById( 'menu-content' ).classList.remove( 'hidden' );
    document.getElementById( 'loading-container' ).classList.add( 'hidden' );
    document.getElementById( 'load-button' ).classList.remove( 'hidden' );
    document.getElementById( 'start-button' ).textContent = 'new';

    if ( player.position.length() > 0 ) localStorage.setItem('position', JSON.stringify( { position: player.position.toArray(), offset: terrainController.getCoordFromPosition( player.position ) } ) );

    if ( 'pointerLockElement' in document ) document.removeEventListener( 'pointerlockchange', pointerLockChangeCallback, false );		

    running = false;
    clock.stop();
    terrainController.toggleClock(false);
    document.querySelector( 'audio' ).pause();

    terrainController.save();

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
	fill( 180, 200 );
    textAlign(LEFT);
	text( "WASD", width * 0.01, height * 0.92 );
	text( "- move", width * 0.05, height * 0.92 );

	text( "SHIFT", width * 0.01, height * 0.94 );
    text( "- sprint", width * 0.05, height * 0.94 );	

	text( "SPACE", width * 0.01, height * 0.96 );
	text( "- jump", width * 0.05, height * 0.96 );

	text( "MOUSE", width * 0.01, height * 0.98 );
    text( "- remove/add terrain", width * 0.05, height * 0.98 );

    const coord = terrainController.getCoordFromPosition( player.position );
    textAlign(RIGHT);
    text( `chunk:`, width * 0.99, height * 0.92 );
    text( `x: ${coord.x} z: ${coord.z}`, width * 0.99, height * 0.94 );
    text( `position:`, width * 0.99, height * 0.96 );
    text( `x: ${floor(player.position.x)} z: ${floor(player.position.z)}`, width * 0.99, height * 0.98 );
    
    if ( player ){
        const compass = [' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'SW', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'W', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'NW', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'N', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'NE', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'E', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'SE', ' ', ' ', '╷', ' ', ' ', '╷', ' ', ' ', 'S'];
        const rotation = (player.cameraRig.rotation.y + PI) * 0.5;
        const index = floor(map(rotation, 0, PI, compass.length, 0, true ));

        let str = '';
        for( let i = index - 12; i <= index + 12; i++){
            let c = i;
            if (c < 0) c += compass.length;
            if (c >= compass.length) c = c -= compass.length;
            str += compass[ c ] + '  ';
        }

        textAlign(CENTER);
        text( str, width * 0.57, height * 0.05 );

    }
        
    
}





