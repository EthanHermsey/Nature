
class Player {

	constructor() {

		//create camera
		this.object = new THREE.Object3D();
		this.object.rotation.order = "YXZ";
		this.object.frustumCulled = false;
		app.scene.add( this.object );

		this.cameraRigPosition = new THREE.Vector3( 0, 2.05, 0 );
		this.cameraRig = new THREE.Object3D();
		this.cameraRig.position.y += 1.05;
		this.cameraRig.rotation.order = "YXZ";
		this.camera = new THREE.PerspectiveCamera(
			70,
			window.innerWidth / window.innerHeight,
			0.1,
			10000
		);
		this.camera.position.x += 1;
		this.camera.position.y += 1;
		this.camera.position.z += 5.5;
		this.camera.lookAt( new THREE.Vector3( 1.5, 1.4, - 4 ) );

		this.cameraOriginalDistance = this.camera.position.length();
		this.cameraMaxDistance = this.camera.position.length();
		this.cameraDistance = this.cameraMaxDistance;


		this.cameraRig.add( this.camera );
		this.object.add( this.cameraRig );

		//raycast point
		this.intersectPoint = null;

		//grabbing gem
		this.gems = 0;
		this.grabbingGem = false;

		//brush vars
		this.terrainAdjustStrength = 0.05;
		this.brushRadius = 5;
		this.buildTimer = 0;
		this.maxBuildTime = 0.05;
		this.maxBuildDistance = 450;


		//player height/movement vars
		this.height = 1.9;
		this.walkSpeed = 10;
		this.sprintSpeedMultiplier = 2.2; //4
		this.walkSlopeLimit = 1.2;
		this.vDown = 0.0;
		this.gravity = 1.5;
		this.jumpStrength = 0.55;
		this.bouncyness = 0.1;
		this.defaultMouseSensitivity = 0.0016;
		this.mouseSensitivity = 0.0016;
		this.grounded = true;

		//flymode selector
		this.flyMode = false;
		this.godMode = false;

	}

	get position() {

		return this.object.position;

	}


	//    o8o               o8o      .
	//    `"'               `"'    .o8
	//   oooo  ooo. .oo.   oooo  .o888oo
	//   `888  `888P"Y88b  `888    888
	//    888   888   888   888    888
	//    888   888   888   888    888 .
	//   o888o o888o o888o o888o   "888"

	init( startChunk, resolve ) {

		let x = ( startChunk.offset.x * startChunk.terrain.chunkSize ) + startChunk.terrain.chunkSize / 2;
		let z = ( startChunk.offset.z * startChunk.terrain.chunkSize ) + startChunk.terrain.chunkSize / 2;
		let m = Math.floor( terrainController.gridSize.x / 2 );
		let y = startChunk.getTerrainHeight( m, m ) * terrainController.terrainScale.y * 1.2;
		this.position.set( x, y, z );

		this.minDigDistance = this.brushRadius * terrainController.terrainScale.x * 0.225;

		if ( ! this.model ) {

			this.model = modelBank.knight;
			this.model.mixer = new THREE.AnimationMixer( this.model );
			this.model.animations = {
				idle: this.model.mixer.clipAction( this.model.animations[ 0 ] ),
				running: this.model.mixer.clipAction( this.model.animations[ 1 ] )
			};
			this.model.animations.idle.play();

			for ( let child of this.model.children ) {

				child.frustumCulled = false;

			}

			this.model.children[ 1 ].material.metalness = 0.0;
			this.model.children[ 1 ].material.roughness = 0.85;
			this.model.children[ 1 ].material.normalMap = new THREE.TextureLoader()
				.load( './resources/model/n.png' );
			this.model.scale.multiplyScalar( this.height * 0.9 );
			this.model.position.y -= this.height;
			this.model.rotation.order = "YXZ";
			this.model.rotation.y = Math.PI;

			this.object.add( this.model );



			//add shadowlight. This position is updated in the update function
			this.shadowLightIntensity = 0.57;
			this.shadowLightOffset = new THREE.Vector3( 30, 80, 0 ).multiplyScalar( 5 );
			this.shadowLight = new THREE.DirectionalLight( 0xffffff, this.shadowLightIntensity );
			this.shadowLight.target = new THREE.Object3D();
			app.scene.add( this.shadowLight.target );

			this.shadowLight.position.copy( this.position ).add( this.shadowLightOffset );
			this.shadowLight.target.position.copy( this.position );

			this.defaultShadowLightFar = 800;
			this.shadowLight.castShadow = true;
			this.shadowLight.shadow.mapSize.width = 1024;
			this.shadowLight.shadow.mapSize.height = 1024;
			this.shadowLight.shadow.camera.near = 1;
			this.shadowLight.shadow.camera.far = this.defaultShadowLightFar;
			this.shadowLight.shadow.camera.top = - 1000;
			this.shadowLight.shadow.camera.bottom = 1000;
			this.shadowLight.shadow.camera.left = - 1000;
			this.shadowLight.shadow.camera.right = 1000;
			this.shadowLight.shadow.bias = - 0.002;
			app.scene.add( this.shadowLight );
			this.cameraTimer = 0;



			//add a skybox. This position is updated in the update function
			this.skyBox = new THREE.Mesh(
				new THREE.SphereGeometry(
					startChunk.terrain.chunkSize * 2 * Math.min( startChunk.terrain.viewDistance + startChunk.terrain.farViewDistance + 2, 14 ),
					64,
					64
				),
				new THREE.MeshBasicMaterial( {
					map: new THREE.TextureLoader().load( './resources/background.jpg' ),
					side: THREE.BackSide
				} )
			);
			this.skyBox.material.map.mapping = THREE.EquirectangularRefractionMapping;
			this.skyBox.material.map.encoding = THREE.sRGBEncoding;

			app.scene.add( this.skyBox );

		}

		resolve();

	}



	//                              .o8                .
	//                             "888              .o8
	// oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.
	// `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b
	//  888   888   888   888 888   888   .oP"888    888   888ooo888
	//  888   888   888   888 888   888  d8(  888    888 . 888    .o
	//  `V88V"V8P'  888bod8P' `Y8bod88P" `Y888""8o   "888" `Y8bod8P'
	//              888
	//             o888o


	update( delta ) {

		this.movePlayer( delta );

		this.model.mixer.update( delta );

		this.getCameraIntersect();

		//timer for adjusting terrain
		if ( mouseIsPressed ) this.adjustTerrain();

		//move skybox along with the object/camera
		this.skyBox.position.copy( this.position );
		this.skyBox.position.y *= 0.4;
		this.skyBox.rotation.x += 0.00004;

		if ( ++ this.cameraTimer > 200 ) {

			this.shadowLight.position.copy( this.position ).add( this.shadowLightOffset );
			this.shadowLight.target.position.copy( this.position );
			this.cameraTimer = 0;

		}

	}

	updateCameraCollision() {

		let v = new THREE.Vector3();
		this.camera.getWorldDirection( v );
		v.multiplyScalar( - 1 );

		// const rigPosition = this.object.position.clone().add( this.cameraRigPosition );

		// app.raycaster.set( rigPosition, v );
		// let intersectdir = app.raycaster.intersectObjects( terrainController.castables );

		// if ( intersectdir.length > 0 ) {

		// 	const distance = rigPosition.distanceTo( intersectdir[ 0 ].point ) * 0.5;
		// 	if ( distance < this.cameraDistance ) {

		// 		this.cameraDistance = distance;

		// 	}

		// }

		this.cameraDistance = Math.min( this.cameraDistance + ( this.cameraMaxDistance - this.cameraDistance ) * 0.4, this.cameraMaxDistance );

		this.camera.position.setLength( this.cameraDistance );
		this.model.visible = this.cameraDistance > 2;

	}










	// ooo. .oo.  .oo.    .ooooo.  oooo    ooo  .ooooo.
	// `888P"Y88bP"Y88b  d88' `88b  `88.  .8'  d88' `88b
	//  888   888   888  888   888   `88..8'   888ooo888
	//  888   888   888  888   888    `888'    888    .o
	// o888o o888o o888o `Y8bod8P'     `8'     `Y8bod8P'



	//            oooo
	//            `888
	// oo.ooooo.   888   .oooo.   oooo    ooo  .ooooo.  oooo d8b
	//  888' `88b  888  `P  )88b   `88.  .8'  d88' `88b `888""8P
	//  888   888  888   .oP"888    `88..8'   888ooo888  888
	//  888   888  888  d8(  888     `888'    888    .o  888
	//  888bod8P' o888o `Y888""8o     .8'     `Y8bod8P' d888b
	//  888                       .o..P'
	// o888o                      `Y8P'

	movePlayer( delta ) {

		return new Promise( resolve => {

			//get cameraDirection (player aim direction);
			let playerEuler = new THREE.Euler( 0, this.cameraRig.rotation.y, 0, 'YXZ' );

			//get keyinput and rotate to camera direction (y axis rotation )
			let walkDirection = this.getKeyInput( delta ).applyEuler( playerEuler );

			if ( walkDirection.length() > 0 ) {

				if ( walkDirection.x != 0 && walkDirection.z != 0 ) {

					let fEuler = new THREE.Euler( 0, this.model.rotation.y, 0, 'YXZ' );
					let fDirection = new THREE.Vector3( 0, 0, 1 ).applyEuler( fEuler );
					fDirection.lerp( walkDirection, 0.5 );

					let v = this.object.position
						.clone()
						.add( fDirection );
					v.y *= - 1;

					this.model.lookAt( v );

				}

				this.model.animations.running.play();
				this.model.animations.idle.stop();

				if ( keyIsDown( 16 ) ) {

					this.model.animations.running.timeScale = 1.25;

				} else {

					this.model.animations.running.timeScale = 1.0;

				}

				this.updateCameraCollision();

			} else {

				this.model.animations.idle.play();
				this.model.animations.running.stop();

			}

			//the new position
			let nPos = this.position.clone();
			nPos.add( walkDirection );


			if ( this.godMode == false ) {

				//get the collisions for new position (down, up and in walkDirection )
				let collisions = this.terrainCollidePoint( nPos, walkDirection );

				if ( collisions.down.normal ) {

					//add gravity
					if ( this.flyMode == false ) nPos.y += this.vDown;

					if ( nPos.y > collisions.down.position.y + this.height ) {


						if ( this.flyMode == false ) {

							//fallingdown
							this.vDown -= this.gravity * delta;

						}
						this.grounded = false;

					} else {

						//climbing up terrain
						if ( this.flyMode == false ) {

							nPos.y = collisions.down.position.y + this.height;

						} else {

							nPos.y -= this.vDown;

							if ( abs( nPos.y - collisions.down.position.y ) < this.height * 1.5 ) {

								nPos.y = collisions.down.position.y + this.height * 1.5;

							}

						}
						this.grounded = true;

					}

				} else {

					nPos.copy( this.position );
					this.vDown = 0;

				}

				//check pointing direction
				if ( collisions.direction.position ) {

					let d = this.position.distanceTo( collisions.direction.position );

					//if the angle is too steep, return to previous position
					if ( d < this.walkSlopeLimit ) {

						nPos.copy( this.position );

					}

				}

			}


			//set new position and gravity velocity
			this.position.copy( nPos );
			resolve();

		} );

	}





	// oooo
	// `888
	//  888  oooo   .ooooo.  oooo    ooo
	//  888 .8P'   d88' `88b  `88.  .8'
	//  888888.    888ooo888   `88..8'
	//  888 `88b.  888    .o    `888'
	// o888o o888o `Y8bod8P'     .8'
	//                       .o..P'
	//                       `Y8P'
	//  o8o                                         .
	//  `"'                                       .o8
	// oooo  ooo. .oo.   oo.ooooo.  oooo  oooo  .o888oo
	// `888  `888P"Y88b   888' `88b `888  `888    888
	//  888   888   888   888   888  888   888    888
	//  888   888   888   888   888  888   888    888 .
	// o888o o888o o888o  888bod8P'  `V88V"V8P'   "888"
	//                    888
	//                   o888o


	getKeyInput( delta ) {

		let d = new THREE.Vector3();

		this.grabbingGem = keyIsDown( app.key.grab );

		//x axis
		if ( keyIsDown( app.key.up ) ) {

			d.z -= 1;

		} else if ( keyIsDown( app.key.down ) ) {

			d.z += 1;

		}

		//z axis
		if ( keyIsDown( app.key.left ) ) {

			d.x -= 1;

		} else if ( keyIsDown( app.key.right ) ) {

			d.x += 1;

		}

		//y axis up
		if ( keyIsDown( app.key.space ) ) {

			if ( this.flyMode == false ) {

				if ( this.grounded ) {

					//add to gravity vector
					d.y += this.jumpStrength;
					this.vDown = this.jumpStrength;

				}

			} else {

				//only position
				d.y += 1;

			}

		}

		//y axis down
		if ( this.flyMode == true || this.godMode == true ) {

			if ( keyIsDown( app.key.shift ) ) {

				//change position, no gravity
				d.y -= 1;

			}

			//set length to walkspeed * sprintspeed, in fly mode
			d.setLength( ( this.walkSpeed * delta ) * this.sprintSpeedMultiplier * 4 );

		} else {

			//set length to only walkspeed, in jetpack mode
			d.setLength( this.walkSpeed * delta );

			//add sprint only when shift key is pressed
			if ( keyIsDown( app.key.shift ) ) d.multiplyScalar( this.sprintSpeedMultiplier );

		}

		return d;

	}




	// ooo. .oo.  .oo.    .ooooo.  oooo  oooo   .oooo.o  .ooooo.
	// `888P"Y88bP"Y88b  d88' `88b `888  `888  d88(  "8 d88' `88b
	//  888   888   888  888   888  888   888  `"Y88b.  888ooo888
	//  888   888   888  888   888  888   888  o.  )88b 888    .o
	// o888o o888o o888o `Y8bod8P'  `V88V"V8P' 8""888P' `Y8bod8P'

	//  o8o                                         .
	//  `"'                                       .o8
	// oooo  ooo. .oo.   oo.ooooo.  oooo  oooo  .o888oo
	// `888  `888P"Y88b   888' `88b `888  `888    888
	//  888   888   888   888   888  888   888    888
	//  888   888   888   888   888  888   888    888 .
	// o888o o888o o888o  888bod8P'  `V88V"V8P'   "888"
	//                    888
	//                   o888o

	mouseMoved( e ) {

		//rotate object on Y
		this.cameraRig.rotateY( e.movementX * - this.mouseSensitivity );

		//rotate cameraRig on X
		this.cameraRig.rotateX( e.movementY * - this.mouseSensitivity );

		this.cameraRig.rotation.x = Math.min( this.cameraRig.rotation.x, 1.35 );
		this.cameraRig.rotation.x = Math.max( this.cameraRig.rotation.x, - 1.1 );
		this.cameraRig.rotation.z = 0;

		this.updateCameraCollision();

	}

	mouseWheel( e ) {

		this.cameraMaxDistance += Math.sign( e.deltaY ) * 0.5;
		if ( this.cameraMaxDistance < 0.01 ) this.cameraMaxDistance = 0.01;
		if ( this.cameraMaxDistance > this.cameraOriginalDistance * 2 ) this.cameraMaxDistance = this.cameraOriginalDistance * 2;
		this.updateCameraCollision();

	}





	//                 .o8      o8o                          .
	//                "888      `"'                        .o8
	//  .oooo.    .oooo888     oooo oooo  oooo   .oooo.o .o888oo
	// `P  )88b  d88' `888     `888 `888  `888  d88(  "8   888
	//  .oP"888  888   888      888  888   888  `"Y88b.    888
	// d8(  888  888   888      888  888   888  o.  )88b   888 .
	// `Y888""8o `Y8bod88P"     888  `V88V"V8P' 8""888P'   "888"
	//                          888
	//                      .o. 88P
	//                      `Y888P
	//     .                                          o8o
	//   .o8                                          `"'
	// .o888oo  .ooooo.  oooo d8b oooo d8b  .oooo.   oooo  ooo. .oo.
	//   888   d88' `88b `888""8P `888""8P `P  )88b  `888  `888P"Y88b
	//   888   888ooo888  888      888      .oP"888   888   888   888
	//   888 . 888    .o  888      888     d8(  888   888   888   888
	//   "888" `Y8bod8P' d888b    d888b    `Y888""8o o888o o888o o888o




	adjustTerrain( delta ) {

		// this.buildTimer > this.maxBuildTime &&
		if ( terrainController.updating == false && this.intersectPoint && this.intersectPoint.object?.parent?.isVolumetricTerrain ) {

			//exit if building too close by, or too far.
			let d = this.intersectPoint.point.distanceTo( this.position );
			if ( d > this.maxBuildDistance || ( mouseButton == RIGHT && d < this.minDigDistance ) ) return;

			let val = ( mouseButton == LEFT ) ? - this.terrainAdjustStrength : this.terrainAdjustStrength;

			//tell chunk to change the terrain
			this.intersectPoint.object.chunk.adjust( this.intersectPoint.point, this.brushRadius, val, true );
			terrainController.updateInstancedObjects();

		}

	}





	//                                                                 .
	//                                                               .o8
	// oooo d8b  .oooo.   oooo    ooo  .ooooo.   .oooo.    .oooo.o .o888oo  .ooooo.  oooo d8b
	// `888""8P `P  )88b   `88.  .8'  d88' `"Y8 `P  )88b  d88(  "8   888   d88' `88b `888""8P
	//  888      .oP"888    `88..8'   888        .oP"888  `"Y88b.    888   888ooo888  888
	//  888     d8(  888     `888'    888   .o8 d8(  888  o.  )88b   888 . 888    .o  888
	// d888b    `Y888""8o     .8'     `Y8bod8P' `Y888""8o 8""888P'   "888" `Y8bod8P' d888b
	//                    .o..P'
	//                    `Y8P'

	//  o8o                  .                                                       .    o8o
	//  `"'                .o8                                                     .o8    `"'
	// oooo  ooo. .oo.   .o888oo  .ooooo.  oooo d8b  .oooo.o  .ooooo.   .ooooo.  .o888oo oooo   .ooooo.  ooo. .oo.    .oooo.o
	// `888  `888P"Y88b    888   d88' `88b `888""8P d88(  "8 d88' `88b d88' `"Y8   888   `888  d88' `88b `888P"Y88b  d88(  "8
	//  888   888   888    888   888ooo888  888     `"Y88b.  888ooo888 888         888    888  888   888  888   888  `"Y88b.
	//  888   888   888    888 . 888    .o  888     o.  )88b 888    .o 888   .o8   888 .  888  888   888  888   888  o.  )88b
	// o888o o888o o888o   "888" `Y8bod8P' d888b    8""888P' `Y8bod8P' `Y8bod8P'   "888" o888o `Y8bod8P' o888o o888o 8""888P'

	getCameraIntersect() {

		app.raycaster.setFromCamera( new THREE.Vector2(), this.camera );

		let intersects = app.raycaster.intersectObjects( terrainController.castables, true );

		this.intersectPoint = null;

		if ( intersects.length > 0 ) {

			this.intersectPoint = intersects[ 0 ];

		}

	}

	terrainCollidePoint( point, direction ) {

		let response = {};

		//down
		let downNormal;
		let downPos = point.clone();
		downPos.y += this.height * 0.5 - this.vDown;

		app.raycaster.set( downPos, app.scene.down );
		let intersectDown = app.raycaster.intersectObjects( terrainController.castables, true );


		if ( intersectDown.length > 0 ) {

			downPos.y = intersectDown[ 0 ].point.y;
			downNormal = intersectDown[ 0 ].face?.normal || intersectDown[ 0 ].normal || undefined;

		} else {

			downPos.y = point.y;

		}
		response.down = { position: downPos, normal: downNormal };


		//direction
		let dirNormal;
		let dirPos = this.position.clone();

		app.raycaster.set( dirPos, direction.normalize() );
		let intersectdir = app.raycaster.intersectObjects( terrainController.castables );

		if ( intersectdir.length > 0 ) {

			dirPos = intersectdir[ 0 ].point;
			dirNormal = intersectdir[ 0 ].face.normal;

		} else {

			dirPos = undefined;

		}
		response.direction = { position: dirPos, normal: dirNormal };

		return response;

	}




	//           oooo                                oooo
	//           `888                                `888
	//  .ooooo.   888 .oo.   oooo  oooo  ooo. .oo.    888  oooo
	// d88' `"Y8  888P"Y88b  `888  `888  `888P"Y88b   888 .8P'
	// 888        888   888   888   888   888   888   888888.
	// 888   .o8  888   888   888   888   888   888   888 `88b.
	// `Y8bod8P' o888o o888o  `V88V"V8P' o888o o888o o888o o888o


	// oooo d8b  .oooo.   ooo. .oo.    .oooooooo  .ooooo.
	// `888""8P `P  )88b  `888P"Y88b  888' `88b  d88' `88b
	//  888      .oP"888   888   888  888   888  888ooo888
	//  888     d8(  888   888   888  `88bod8P'  888    .o
	// d888b    `Y888""8o o888o o888o `8oooooo.  `Y8bod8P'
	//                                d"     YD
	//                                "Y88888P'

	getChunkCoord( pos, chunkSize ) {

		return { x: Math.floor( pos.x / chunkSize ), z: Math.floor( pos.z / chunkSize ) };

	}








	// oooo d8b  .ooooo.  ooo. .oo.  .oo.    .ooooo.  oooo    ooo  .ooooo.
	// `888""8P d88' `88b `888P"Y88bP"Y88b  d88' `88b  `88.  .8'  d88' `88b
	//  888     888ooo888  888   888   888  888   888   `88..8'   888ooo888
	//  888     888    .o  888   888   888  888   888    `888'    888    .o
	// d888b    `Y8bod8P' o888o o888o o888o `Y8bod8P'     `8'     `Y8bod8P'

	remove() {

		this.model.geometry.dispose();
		this.model.material.dispose();

	}

}
