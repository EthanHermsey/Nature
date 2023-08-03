import ModelLoader from '../modelloader/ModelLoader';
import Player from '../player/PlayerController';
import UIController from '../ui/UIController';
import TerrainController from '../terrain/TerrainController';



//  .oooo.   oo.ooooo.  oo.ooooo.
// `P  )88b   888' `88b  888' `88b
//  .oP"888   888   888  888   888
// d8(  888   888   888  888   888
// `Y888""8o  888bod8P'  888bod8P'
//            888        888
//           o888o      o888o

export default class App {

	constructor() {

		this.loaded = false;
		this.running = false;

		this.clock = new THREE.Clock( false );
		this.scene = new THREE.Scene();
		this.raycaster = new THREE.Raycaster();
		this.renderer = new THREE.WebGLRenderer( {
			antialias: true,
			logarithmicDepthBuffer: true
		} );

		this.uiController = new UIController();
		this.terrainController;

		this.player = new Player();
		this.scene.add( this.player );

		this.terrainSeed = 32921;
		this.key = {
			up: 87,
			down: 83,
			left: 65,
			right: 68,
			shift: 16,
			space: 32,
			flyMode: 70,
			grab: 69
		};

	}

	zoom( zoomin ) {

		this.player.camera.fov = zoomin ? 21 : 70;
		this.player.mouseSensitivity *= zoomin ? 0.5 : 2;
		this.uiController.windowResized();

	}

	//              .                          .
	//            .o8                        .o8
	//  .oooo.o .o888oo  .oooo.   oooo d8b .o888oo
	// d88(  "8   888   `P  )88b  `888""8P   888
	// `"Y88b.    888    .oP"888   888       888
	// o.  )88b   888 . d8(  888   888       888 .
	// 8""888P'   "888" `Y888""8o d888b      "888"

	//      88               .
	//     .8'             .o8
	//    .8'    .oooo.o .o888oo  .ooooo.  oo.ooooo.
	//   .8'    d88(  "8   888   d88' `88b  888' `88b
	//  .8'     `"Y88b.    888   888   888  888   888
	// .8'      o.  )88b   888 . 888   888  888   888
	// 88       8""888P'   "888" `Y8bod8P'  888bod8P'
	//                                      888
	//                                     o888o


	startLoading( offset, viewDistance, saveProgress ) {

		return new Promise( async ( resolve ) => {

			if ( ! this.loaded ) await ModelLoader.preloadModels();

			if ( ! this.terrainController ) {

				await new Promise( ( resolve ) => {

					this.terrainController = new TerrainController(
						this,
						offset,
						viewDistance,
						saveProgress,
						this.terrainSeed,
						() => resolve()
					);
					this.scene.add( this.terrainController );

				} );

			} else {

				await this.terrainController.init( viewDistance, saveProgress );

			}

			offset = offset || { x: 0, z: 0 };

			this.player.init(
				this.terrainController.getChunk( this.terrainController.getChunkKey( offset ) ),
				() => {

					this.loaded = true;
					this.start();
					resolve();

				}
			);

		} );

	}

	start() {

		this.running = true;
		this.clock.start();
		this.terrainController.toggleClock( true );
		document.querySelector( 'audio' ).play();
		render();

	}

	stopGame() {

		this.uiController.stopGame();

	}

	stop() {

		if ( this.player.position.length() > 0 ) localStorage.setItem( 'position', JSON.stringify( { position: this.player.position.toArray(), offset: this.terrainController.getCoordFromPosition( this.player.position ), crystals: this.player.crystals } ) );

		this.running = false;
		this.clock.stop();
		this.terrainController.toggleClock( false );
		document.querySelector( 'audio' ).pause();

	}




	//                        .
	//                      .o8
	//  .oooo.o  .ooooo.  .o888oo oooo  oooo  oo.ooooo.
	// d88(  "8 d88' `88b   888   `888  `888   888' `88b
	// `"Y88b.  888ooo888   888    888   888   888   888
	// o.  )88b 888    .o   888 .  888   888   888   888
	// 8""888P' `Y8bod8P'   "888"  `V88V"V8P'  888bod8P'
	//                                         888
	//                                        o888o


	setup() {

		//no p5 canvas
		let cnv = createCanvas( windowWidth, windowHeight );
		cnv.parent( 'p5-div' );
		noLoop();
		textFont( "'Fira Sans', sans-serif" );
		textSize( width * 0.009 );
		noiseSeed( this.terrainSeed );

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
		this.scene.down = new THREE.Vector3( 0, - 1, 0 );
		this.raycaster.firstHitOnly = true;


		//THREE Renderer
		this.renderer.physicallyCorrectLights = true;
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.toneMapping = THREE.ReinhardToneMapping;
		this.renderer.toneMappingExposure = 2.2;
		this.renderer.toneMappingExposureMax = 2.2;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.setSize( windowWidth, windowHeight );
		this.renderer.setClearColor( 'rgb(48, 48, 48)' );
		this.uiController.elements.threeDiv.appendChild( this.renderer.domElement );


		//fps counter
		window.stats = new Stats();
		stats.setMode( 0 );
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.zIndex = '10';
		stats.domElement.style.left = '0';
		stats.domElement.style.top = '0';
		document.body.appendChild( stats.domElement );


		//lights
		let amb = new THREE.AmbientLight( "rgb(240,240,240)", 0.45 );
		this.scene.add( amb );

		//fog
		this.scene.fog = new THREE.FogExp2( 'rgb(240, 240, 255)', 0.00045 );

	}


	//                                      .o8
	//                                     "888
	// oooo d8b  .ooooo.  ooo. .oo.    .oooo888   .ooooo.  oooo d8b
	// `888""8P d88' `88b `888P"Y88b  d88' `888  d88' `88b `888""8P
	//  888     888ooo888  888   888  888   888  888ooo888  888
	//  888     888    .o  888   888  888   888  888    .o  888
	// d888b    `Y8bod8P' o888o o888o `Y8bod88P" `Y8bod8P' d888b

	render() {

		if ( this.running ) {

			requestAnimationFrame( render );

			let delta = this.clock.getDelta();

			// update player controller
			this.player.update( delta );

			// animate terrain
			this.terrainController.animate( delta );

			// draw text on screen and crosshair
			this.drawHud();

			// update fps counter
			stats.update();

			//render scene
			this.renderer.render( this.scene, this.player.camera );

		}

	}

	drawHud() {

		clear();
		noFill();
		stroke( 120, 200 );

		strokeWeight( 3 );
		point( width / 2, height / 2 );
		strokeWeight( 1 );
		ellipse( width / 2, height / 2, min( width, height ) * 0.025 );

		noStroke();
		fill( 240, 200 );
		textAlign( LEFT );
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

		const coord = this.terrainController.getCoordFromPosition( this.player.position );
		textAlign( RIGHT );
		text( `chunk: x: ${coord.x} z: ${coord.z}`, width * 0.99, height * 0.96 );
		text( `x: ${floor( this.player.position.x )} y: ${floor( this.player.position.y )} z: ${floor( this.player.position.z )}`, width * 0.99, height * 0.98 );

		//compass
		const m = map( app.player.cameraRig.rotation.y + PI, 0, TWO_PI, - 894, 894, true );
		this.uiController.elements.compass.style.backgroundPositionX = `${ 330 + m }px`;

	}

}
