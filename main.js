
// import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
// // import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';


let running = false;
const clock = new THREE.Clock( false );
const scene = new THREE.Scene();
scene.down = new THREE.Vector3( 0, - 1, 0 );
const renderer = new THREE.WebGLRenderer( {
	antialias: true,
	logarithmicDepthBuffer: true
} );
const raycaster = new THREE.Raycaster();

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
	cnv.parent( 'p5Div' );
	cnv.mouseWheel( mouseScrolled );
	noLoop();
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
	document.getElementById( 'threeDiv' ).appendChild( renderer.domElement );

	// const bloom_params = {
	// 	exposure: 1.2,
	// 	bloomStrength: 1.2,
	// 	bloomThreshold: 0.01,
	// 	bloomRadius: 0.5
	// };

	// const renderScene = new THREE.RenderPass( scene, camera );

	// const bokehPass = new BokehPass( scene, camera, {
	// 	focus: camera.position.length(),
	// 	aperture: 0.0000001,
	// 	maxblur: 0.15,

	// 	width: window.innerWidth,
	// 	height: window.innerHeight
	// } );

	// const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	// bloomPass.threshold = bloom_params.bloomThreshold;
	// bloomPass.strength = bloom_params.bloomStrength;
	// bloomPass.radius = bloom_params.bloomRadius;

	// composer = new EffectComposer( renderer );
	// composer.addPass( renderScene );
	// composer.addPass( bloomPass );
	// composer.addPass( bokehPass );



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

	//terrainSeed!
	let rnd = 75898;
	// let rnd = floor( random( 99999 ) );
	console.log( '> Seed: ' + rnd );
	noiseSeed( rnd ); //p5 function to set the seed of the perlin noise gen

	//preload tree
	let loader = new THREE.ObjectLoader();
	loader.load( './resources/rocks.json', model=>{

		rocks = model;

		loader.load( './resources/tree.json', model=>{

			model.material.opacity = 1.0;
			model.scale.setScalar( 3 );
			model.geometry.translate( 0, - 0.05, 0 );
			treeModel = model;

			loader.load( './resources/tree2.json', model=>{

				model.material.opacity = 1.0;
				model.geometry.translate( 0, - 0.05, 0 );

				model.scale.setScalar( 3.2 );
				treeModel1 = model;

				loader.load( './resources/treeHigh.json', model=>{

					model.children[ 0 ].material.map.wrapT = model.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

					//trunk
					model.children[ 0 ].material.onBeforeCompile = ( shader ) => {

						shader.uniforms.time = { value: 0 };

						shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
						shader.vertexShader.replace(
							`#include <begin_vertex>`,
							`
							vec3 transformed = vec3( position );
							if ( transformed.y > 0.5){
								transformed.x += sin( time * 0.32) * 0.2;
								transformed.z += sin( time * 0.2734 ) * 0.1;
								transformed.y += sin( time * 0.23 ) * 0.015;
							}
							`
						);

						model.children[ 0 ].material.userData.shader = shader;

					};
					model.children[ 0 ].material.needsUpdate = true;

					//leaves
					model.children[ 1 ].material.onBeforeCompile = ( shader ) => {

						shader.uniforms.time = { value: 0 };

						shader.vertexShader = 'uniform float time;\nvarying float edge;\n' + shader.vertexShader;
						shader.vertexShader = shader.vertexShader.replace(
							`#include <begin_vertex>`,
							`					
							
							vec3 transformed = vec3( position );
							float r = rand( uv );
							
							transformed.x += sin( time * 0.62) * 0.2;
							transformed.z += sin( time * 0.4734 ) * 0.1;
							transformed.y += sin( time * 0.23 ) * 0.015;

							transformed.x += sin( time * 0.7 ) * 0.02;
							transformed.z += sin( time * 0.643734 * r ) * 0.02;
							transformed.y += sin( time * 1.93 * r ) * 0.125;
							
							`
						);
						// shader.vertexShader = shader.vertexShader.replace(
						// 	`#include <defaultnormal_vertex>`,
						// 	`
						// 	#include <defaultnormal_vertex>

						// 	vec3 iPos = vec3(instanceMatrix * vec4( position , 1.0 )); //modelMatrix
						// 	vec3 dir = normalize(cameraPosition - iPos);
						// 	edge = 1.0 - ( dot( dir, transformedNormal ) );
						// 	edge *= edge * edge;
						// 	`
						// );

						// shader.fragmentShader = 'varying float edge;\n' + shader.fragmentShader;
						// shader.fragmentShader = shader.fragmentShader.replace(
						// 	'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
						// 	`
						// 		// if ( edge > 0.4 ) discard;
						// 		gl_FragColor = vec4( outgoingLight, diffuseColor.a * edge );
						// 	`
						// 	// 'gl_FragColor = vec4( outgoingLight, diffuseColor.a * edge );'
						// 	// 'gl_FragColor = vec4( edge, 0.0, 0.0, 1.0 );'
						// );

						model.children[ 1 ].material.userData.shader = shader;

					};

					// model.children[ 1 ].material.blending = THREE.NormalBlending;
					model.children[ 1 ].material.needsUpdate = true;
					treeModelHigh = model;


					loader.load( './resources/treeHigh2.json', model=>{

						model.children[ 0 ].material.map.wrapT = model.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

						//trunk
						model.children[ 0 ].material.onBeforeCompile = ( shader ) => {

							shader.uniforms.time = { value: 0 };

							shader.vertexShader = 'uniform float time;\n' +
							shader.vertexShader.replace(
								`#include <begin_vertex>`,
								`
								vec3 transformed = vec3( position );
								if ( transformed.y > 0.5){
									transformed.x += sin( time * 0.32) * 0.2;
									transformed.z += sin( time * 0.2734 ) * 0.1;
									transformed.y += sin( time * 0.23 ) * 0.015;
								}
								
								`
							);

							model.children[ 0 ].material.userData.shader = shader;

						};
						model.children[ 0 ].material.needsUpdate = true;

						//leaves
						model.children[ 1 ].material.onBeforeCompile = ( shader ) => {

							shader.uniforms.time = { value: 0 };

							shader.vertexShader = 'uniform float time;\n' +
							shader.vertexShader.replace(
								`#include <begin_vertex>`,
								`
								
								
								vec3 transformed = vec3( position );
								float r = rand( uv );
								
								// transformed.x += sin( time * 0.32) * 0.06;
								// transformed.z += sin( time * 0.2734 ) * 0.04;
								// transformed.y += sin( time * 0.23 ) * 0.02;
								transformed.x += sin( time * 0.32) * 0.2;
								transformed.z += sin( time * 0.2734 ) * 0.1;
								transformed.y += sin( time * 0.23 ) * 0.015;

								transformed.x += sin( time * 0.5 ) * 0.02;
								transformed.z += sin( time * 0.43734 * r ) * 0.02;
								transformed.y += sin( time * 1.93 * r ) * 0.125;
								
								`
							);

							model.children[ 1 ].material.userData.shader = shader;

						};

						model.children[ 1 ].material.needsUpdate = true;
						treeModelHigh2 = model;

						loader.load( './resources/grass.json', model=>{

							grassModel1 = model.clone();
							grassModel2 = model.clone();

							grassModel2.geometry = new THREE.BufferGeometry()
								.copy( grassModel1.geometry );

							grassModel1.geometry.translate( 0, - 0.051, 0 );
							grassModel2.geometry.translate( 0, - 0.051, 0 );

							grassModel2.geometry.scale( 1.5, 1.25, 1.5 );


							//grass1
							const mat1 = new THREE.MeshLambertMaterial( {
								alphaTest: 0.47,
								map: new THREE.TextureLoader().load( './resources/grassdiff2.png' ),
								side: THREE.DoubleSide
							} );
							mat1.onBeforeCompile = ( shader ) => {

								shader.uniforms.time = { value: 0 };

								shader.vertexShader = 'uniform float time;\n' +
									shader.vertexShader.replace(
										`#include <begin_vertex>`,
										`
										vec3 transformed = vec3( position );
										if ( transformed.y > 0.5){
											transformed.x += sin( time ) * 0.06;
											transformed.z += sin( time * 0.9734 ) * 0.04;
										}
										`
									);

								mat1.userData.shader = shader;

							};
							grassModel1.material = mat1;
							grassModel1.material.needsUpdate = true;

							//grass2
							const mat2 = new THREE.MeshLambertMaterial( {
								alphaTest: 0.47,
								map: new THREE.TextureLoader().load( './resources/grassdiff1a.png' ),
								side: THREE.DoubleSide
							} );
							mat2.onBeforeCompile = ( shader ) => {

								shader.uniforms.time = { value: 0 };

								shader.vertexShader = 'uniform float time;\n' +
									shader.vertexShader.replace(
										`#include <begin_vertex>`,
										`
										vec3 transformed = vec3( position );
										if ( transformed.y > 0.5){
											transformed.x += sin( time ) * 0.06;
											transformed.z += sin( time * 0.9734 ) * 0.04;
										}
										`
									);

								mat2.userData.shader = shader;

							};
							grassModel2.material = mat2;
							grassModel2.material.needsUpdate = true;


							loader.load( './resources/grassHigh.json', model=>{

								grassModelHigh = model.clone();
								grassModelHigh.geometry.scale( 0.45, 0.85, 0.45 );

								model.material.map = new THREE.TextureLoader().load( './resources/grassdiff1b.png' );

								grassModelHigh.material.onBeforeCompile = ( shader ) => {

									shader.uniforms.time = { value: 0 };

									shader.vertexShader = 'uniform float time;\n' +
										shader.vertexShader.replace(
											`#include <begin_vertex>`,
											`
											vec3 transformed = vec3( position );
											float r = rand( transformed.xz );
											if ( transformed.y > 0.5){
												transformed.x += sin( time * r ) * 0.06;
												transformed.z += sin( time * r * 0.9734 ) * 0.04;
											}
											`
										);

									grassModelHigh.material.userData.shader = shader;

								};
								grassModelHigh.material.needsUpdate = true;


								loader.load( './resources/fern.json', model=>{

									model.scale.set( 0.55, 0.5, 0.55 );
									model.geometry.translate( 0, - 0.2, 0 );
									model.geometry.boundingSphere.radius = 128;

									const mat1 = new THREE.MeshLambertMaterial().copy( model.material );
									mat1.onBeforeCompile = ( shader ) => {

										shader.uniforms.time = { value: 0 };

										shader.vertexShader = 'uniform float time;\n' +
											shader.vertexShader.replace(
												`#include <begin_vertex>`,
												`
												vec3 transformed = vec3( position );
												float r = rand( uv );

												if ( transformed.y > 0.5){
													transformed.x += sin( time * r ) * 0.04;
													transformed.y -= sin( time * 0.23 * r) * 0.05;
													transformed.z += sin( time * 0.9734 * r) * 0.03;
												}
												`
											);

										mat1.userData.shader = shader;

									};

									fernModel = model;
									fernModel.material = mat1;
									fernModel.material.needsUpdate = true;

									chunkController = new ChunkController( ( controller )=>{

										document.getElementById( 'playButton' ).textContent = "PLAY";
										player = new Player( controller.chunks[ getChunkKey( { x: 0, y: 0 } ) ] );

										// //composer
										// composer = new THREE.EffectComposer( renderer );
										// composer.setSize( windowWidth, windowHeight );

										// let renderScene = new THREE.RenderPass( scene, player.camera );
										// composer.addPass( renderScene );

										// fxaaPass = new THREE.ShaderPass( FXAAShader );
										// fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( windowWidth * devicePixelRatio );
										// fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( windowHeight * devicePixelRatio );
										// composer.addPass( fxaaPass );

										// let bloomPass = new THREE.UnrealBloomPass(
										// 	new THREE.Vector2( windowWidth, windowHeight ),
										// 	0.1, //strength
										// 	0.35, //radius
										// 	0.4 //threshold
										// );
										// composer.addPass( bloomPass );

									} );

								} );

							} );

						} );


					} );

				} );

			} );

		} );

	} );


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

	chunkController.update( delta );

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

function start() {

	renderer.domElement.requestPointerLock();
	THREEx.FullScreen.request();
	running = true;
	clock.start();
	document.querySelector( 'audio' ).play();
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
	ellipse( width / 2, height / 2, min( width, height ) * 0.025 );


	//make this better.... or not
	noStroke();
	fill( 80, 200 );
	text( "WASD           -  Move around.", width * 0.01, height * 0.1 );
	text( "SHIFT           -  Sprint.", width * 0.01, height * 0.12 );
	text( "SPACE          -  Jump / Fly.", width * 0.01, height * 0.14 );
	text( "MOUSE L/R  -  Remove/add terrain.", width * 0.01, height * 0.16 );
	text( "F                    -  Fly mode: " + player.flyModes[ player.selectedFlyMode ], width * 0.01, height * 0.18 );

	text( "SCROLL       -  Brush radius: " + player.brushRadius, width * 0.01, height * 0.20 );



}

function animateVegetation( delta ) {

	//update grass animation
	let r = 1.0 + ( Math.random() * 0.5 );
	if ( grassModel1.material.userData.shader ) grassModel1.material.userData.shader.uniforms.time.value += delta * r;
	if ( grassModel2.material.userData.shader ) grassModel2.material.userData.shader.uniforms.time.value += delta * r;
	//update tree1 animation
	if ( treeModelHigh.children[ 1 ].material.userData.shader ) {

		treeModelHigh.children[ 1 ].material.userData.shader.uniforms.time.value += delta * r;

	}
	if ( treeModelHigh.children[ 0 ].material.userData.shader ) {

		treeModelHigh.children[ 0 ].material.userData.shader.uniforms.time.value += delta * r;

	}
	//update tree2 aimation
	if ( treeModelHigh2.children[ 1 ].material.userData.shader ) {

		treeModelHigh2.children[ 1 ].material.userData.shader.uniforms.time.value += delta * r;

	}
	if ( treeModelHigh2.children[ 0 ].material.userData.shader ) {

		treeModelHigh2.children[ 0 ].material.userData.shader.uniforms.time.value += delta * r;

	}
	//update grasHigh
	if ( grassModelHigh.material.userData.shader ) {

		grassModelHigh.material.userData.shader.uniforms.time.value += delta * r;

	}
	//update fern
	if ( fernModel.material.userData.shader ) {

		fernModel.material.userData.shader.uniforms.time.value += delta * r;

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

	if ( document.pointerLockElement === renderer.domElement ||
  		document.mozPointerLockElement === renderer.domElement ||
  		document.webkitPointerLockElement === renderer.domElement ) {

		document.addEventListener( "mousemove", onMouseMove, false );

	} else {

		document.removeEventListener( "mousemove", onMouseMove, false );
		document.getElementById( 'mainMenu' ).classList.remove( 'hidden' );
		running = false;
		document.querySelector( 'audio' ).pause();

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






















