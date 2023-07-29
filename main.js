

                                
//  .oooo.   oo.ooooo.  oo.ooooo.  
// `P  )88b   888' `88b  888' `88b 
//  .oP"888   888   888  888   888 
// d8(  888   888   888  888   888 
// `Y888""8o  888bod8P'  888bod8P' 
//            888        888       
//           o888o      o888o   
const app = {
    loaded: false,
    running: false,
    clock: new THREE.Clock( false ),
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer( {
        antialias: true,
        logarithmicDepthBuffer: true
    } ),
    raycaster: new THREE.Raycaster(),
    terrainSeed: 32921, //is very nice
    // const terrainSeed = Math.floor( Math.random() * 99999 );
    key: {
        up: 87,
        down: 83,
        left: 65,
        right: 68,
        shift: 16,
        space: 32,
        flyMode: 70,
        grab: 69
    },
    startLoading: function( offset, viewDistance ){

        return new Promise( async ( resolve ) => {

            if ( !app.loaded ) await preloadModels();

            if ( !terrainController ) {
                
                await new Promise((resolve) => {
                    terrainController = new TerrainController( 
                        offset, 
                        viewDistance, 
                        app.terrainSeed, 
                        () => resolve() 
                    );
                    app.scene.add( terrainController );                
                })
                
            } else {
    
                await terrainController.init( viewDistance );
    
            }
    
            offset = offset || { x: 0, z: 0 };
    
            player.init(
                terrainController.getChunk( terrainController.getChunkKey( offset ) ),
                () => {
    
                    app.loaded = true;            
                    app.start();
                    resolve();
    
                }
            );
    
        })
    
    },
    start: function() {
    
        app.running = true;
        app.clock.start();
        terrainController.toggleClock(true);
        document.querySelector( 'audio' ).play();        
        render();
        
    },
    stop: function(){
    
        if ( player.position.length() > 0 ) localStorage.setItem('position', JSON.stringify( { position: player.position.toArray(), offset: terrainController.getCoordFromPosition( player.position ) } ) );
    
        app.running = false;
        app.clock.stop();
        terrainController.toggleClock(false);
        document.querySelector( 'audio' ).pause();
    
    }
};



//            oooo                                           
//            `888                                           
// oo.ooooo.   888   .oooo.   oooo    ooo  .ooooo.  oooo d8b 
//  888' `88b  888  `P  )88b   `88.  .8'  d88' `88b `888""8P 
//  888   888  888   .oP"888    `88..8'   888ooo888  888     
//  888   888  888  d8(  888     `888'    888    .o  888     
//  888bod8P' o888o `Y888""8o     .8'     `Y8bod8P' d888b    
//  888                       .o..P'                         
// o888o                      `Y8P'                       
const player = new Player();





//     .                                          o8o                .oooooo.                             .                      oooo  oooo                     
//   .o8                                          `"'               d8P'  `Y8b                          .o8                      `888  `888                     
// .o888oo  .ooooo.  oooo d8b oooo d8b  .oooo.   oooo  ooo. .oo.   888           .ooooo.  ooo. .oo.   .o888oo oooo d8b  .ooooo.   888   888   .ooooo.  oooo d8b 
//   888   d88' `88b `888""8P `888""8P `P  )88b  `888  `888P"Y88b  888          d88' `88b `888P"Y88b    888   `888""8P d88' `88b  888   888  d88' `88b `888""8P 
//   888   888ooo888  888      888      .oP"888   888   888   888  888          888   888  888   888    888    888     888   888  888   888  888ooo888  888     
//   888 . 888    .o  888      888     d8(  888   888   888   888  `88b    ooo  888   888  888   888    888 .  888     888   888  888   888  888    .o  888     
//   "888" `Y8bod8P' d888b    d888b    `Y888""8o o888o o888o o888o  `Y8bood8P'  `Y8bod8P' o888o o888o   "888" d888b    `Y8bod8P' o888o o888o `Y8bod8P' d888b    
let terrainController;






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
    noiseSeed( app.terrainSeed );

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

    //setting scene and raycaster
    app.scene.down = new THREE.Vector3( 0, - 1, 0 );
    app.raycaster.firstHitOnly = true;

    //uitController
    uiController = new UIController();

	//THREE Renderer
    app.renderer.physicallyCorrectLights = true;
    app.renderer.outputEncoding = THREE.sRGBEncoding;
    app.renderer.toneMapping = THREE.ReinhardToneMapping;
    app.renderer.toneMappingExposure = 2.2;
    app.renderer.toneMappingExposureMax = 2.2;
	app.renderer.shadowMap.enabled = true;
	app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	app.renderer.setSize( windowWidth, windowHeight );
    app.renderer.setClearColor( 'rgb(48, 48, 48)');
	uiController.elements.threeDiv.appendChild( app.renderer.domElement );


	//fps counter
	stats = new Stats();
	stats.setMode( 0 );
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.zIndex = '10';
	stats.domElement.style.left = '0';
	stats.domElement.style.top = '0';
	document.body.appendChild( stats.domElement );



	//lights
	let amb = new THREE.AmbientLight( "rgb(240,240,240)", 0.45 );
	app.scene.add( amb );

	//fog
	app.scene.fog = new THREE.FogExp2( 'rgb(240, 240, 255)', 0.00045 );

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

function keyPressed( e ){

    if ( app.running && e.code == 'KeyC') uiController.zoom( true );

}

function keyReleased( e ){
    
    if ( app.running && e.code == 'KeyC') uiController.zoom( false );

}

function onMouseMove( e ) {

	if ( app.running ) player.mouseMoved( e );

}







//                                      .o8
//                                     "888
// oooo d8b  .ooooo.  ooo. .oo.    .oooo888   .ooooo.  oooo d8b
// `888""8P d88' `88b `888P"Y88b  d88' `888  d88' `88b `888""8P
//  888     888ooo888  888   888  888   888  888ooo888  888
//  888     888    .o  888   888  888   888  888    .o  888
// d888b    `Y8bod8P' o888o o888o `Y8bod88P" `Y8bod8P' d888b

function render() {

	if ( app.running ){

        requestAnimationFrame( render );

        let delta = app.clock.getDelta();
    
        // update player controller
        player.update( delta );
    
        // animate terrain
        terrainController.animate( delta );	
    
        // draw text on screen and crosshair
        drawHud();
    
        // update fps counter
        stats.update();
    
        //render scene
        app.renderer.render( app.scene, player.camera );

    } 

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
	fill( 200, 200 );
    textAlign(LEFT);
	text( "WASD", width * 0.01, height * 0.88 );
	text( "- move", width * 0.05, height * 0.88 );

	text( "SHIFT", width * 0.01, height * 0.90 );
    text( "- sprint", width * 0.05, height * 0.90 );	

	text( "SPACE", width * 0.01, height * 0.92 );
	text( "- jump", width * 0.05, height * 0.92 );

    text( "E", width * 0.01, height * 0.94 );
    text( "- grab", width * 0.05, height * 0.94 );

	text( "C", width * 0.01, height * 0.96 );
    text( "- zoom", width * 0.05, height * 0.96 );

	text( "MOUSE", width * 0.01, height * 0.98 );
    text( "- remove/add terrain", width * 0.05, height * 0.98 );

    const coord = terrainController.getCoordFromPosition( player.position );
    textAlign(RIGHT);    
    text( `chunk: x: ${coord.x} z: ${coord.z}`, width * 0.99, height * 0.96 );
    text( `x: ${floor(player.position.x)} y: ${floor(player.position.y)} z: ${floor(player.position.z)}`, width * 0.99, height * 0.98 );
    
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