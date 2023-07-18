
class Player {

	constructor() {

		//create camera
		this.object = new THREE.Object3D();
		this.object.rotation.order = "YXZ";
		this.object.frustumCulled = false;
        scene.add( this.object );

        this.cameraRigPosition = new THREE.Vector3(0, 4.5, 0);
		this.cameraRig = new THREE.Object3D();
		this.cameraRig.rotation.order = "YXZ";
		this.camera = new THREE.PerspectiveCamera(
			70,
			windowWidth / windowHeight,
			0.001,
			10000
		);
		this.camera.position.x += 1;
		this.camera.position.y += 4.5;
		this.camera.position.z += 5.5;
		this.camera.lookAt( new THREE.Vector3( 1.5, 1.5, - 4 ) );

        this.cameraMaxDistance = this.camera.position.length();
        this.cameradistance = this.cameraMaxDistance;

		this.cameraRig.add( this.camera );
		this.object.add( this.cameraRig );

		//raycast point
		this.intersectPoint = null;

		//brush vars
		this.terrainAdjustStrength = 0.1;
		this.brushRadius = 4;
		this.buildTimer = 0;
		this.maxBuildTime = 0.21;
		this.maxBuildDistance = 250;
		

		//player height/movement vars
		this.height = 1.9;
		this.walkSpeed = 10;
		this.sprintSpeedMultiplier = 2.2; //4
		this.walkSlopeLimit = 1.2;
		this.vDown = 0.0;
		this.gravity = 1.5;
		this.jumpStrength = 0.55;
		this.bouncyness = 0.1;
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
                                
   init( startChunk, resolve ){

        let x = ( startChunk.offset.x * startChunk.terrain.chunkSize ) + startChunk.terrain.chunkSize / 2;
        let z = ( startChunk.offset.z * startChunk.terrain.chunkSize ) + startChunk.terrain.chunkSize / 2;
        let m = Math.floor( terrainController.gridSize.x / 2 );
        let y = startChunk.getTerrainHeight( m, m ) * terrainController.terrainScale.y * 1.2;
        this.position.set( x, y, z );

        this.minDigDistance = this.brushRadius * ( terrainController.terrainScale.x / 2 + 0.5 );
        

        if ( !this.model){

            let loader = new THREE.GLTFLoader();
    
            loader.load( './resources/model/knight.gltf', ( model ) => {
    
                this.model = model.scene.children[ 0 ];
                this.model.mixer = new THREE.AnimationMixer( this.model );
                this.model.animations = {
                    idle: this.model.mixer.clipAction( model.animations[ 0 ] ),
                    running: this.model.mixer.clipAction( model.animations[ 1 ] )
                };
                this.model.animations.idle.play();
    
                for( let child of this.model.children ){    

                    child.frustumCulled = false;    
                    
                };

                this.model.children[ 1 ].material.metalness = 0.0;
                this.model.children[ 1 ].material.roughness = 0.75;
                this.model.children[ 1 ].material.normalMap = new THREE.TextureLoader()
                    .load( './resources/model/n.png' );
                this.model.scale.multiplyScalar( this.height * 0.9 );
                this.model.position.y -= this.height;
                this.model.rotation.order = "YXZ";
                this.model.rotation.y = Math.PI;
                this.model.castShadow = true;
                this.model.receiveShadow = true;    
                for( let c of this.model.children ){
    
                    if ( c.type != 'Bone' ) {
                        c.castShadow = true;
                        c.receiveShadow = true;    
                    }
    
                };
                this.object.add( this.model );
                resolve();
    
            } );
    
    
            //add shadowlight
            this.shadowLightIntensity = 0.65;
            this.shadowLightOffset = new THREE.Vector3( 30, 80, 0 ).multiplyScalar(5);
            this.shadowLight = new THREE.DirectionalLight( 0xffffff, this.shadowLightIntensity );
            this.shadowLight.target = new THREE.Object3D();
            scene.add( this.shadowLight.target );

            this.shadowLight.position.copy( this.position ).add( this.shadowLightOffset );
            this.shadowLight.target.position.copy( this.position );
    
            this.shadowLight.castShadow = true;
            this.shadowLight.shadow.mapSize.width = 1024;
            this.shadowLight.shadow.mapSize.height = 1024;
            this.shadowLight.shadow.camera.near = 1;
            this.shadowLight.shadow.camera.far = 800;
            this.shadowLight.shadow.camera.top = - 1000;
            this.shadowLight.shadow.camera.bottom = 1000;
            this.shadowLight.shadow.camera.left = - 1000;
            this.shadowLight.shadow.camera.right = 1000;
            this.shadowLight.shadow.bias = -0.002;
            scene.add( this.shadowLight );
            this.cameraTimer = 0;

                
    
            //add a skybox. This position is
            this.skyBox = new THREE.Mesh(
                new THREE.SphereGeometry(
                    startChunk.terrain.chunkSize * 2 * ( startChunk.terrain.viewDistance + startChunk.terrain.farViewDistance + 2 ),
                    64,
                    64
                ),
                new THREE.MeshBasicMaterial( {
                    map: new THREE.TextureLoader().load( './resources/background.jpg' ),
                    side: THREE.BackSide
                } )
            );
            this.skyBox.material.map.mapping = THREE.EquirectangularRefractionMapping;
    
            scene.add( this.skyBox );    

        } else {

            resolve();

        }

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
		if ( mouseIsPressed ) {

			if ( this.buildTimer == 0 ) {

				this.adjustTerrain();

			}
			if ( ( this.buildTimer += delta ) >= this.maxBuildTime ) this.buildTimer = 0;

		} else {

			this.buildTimer = 0;

		}

		//move skybox along with the object/camera
		this.skyBox.position.copy( this.position );
		this.skyBox.position.y *= 0.4;
		this.skyBox.rotation.x += 0.00005;

		if ( ++ this.cameraTimer > 200 ) {

			this.shadowLight.position.copy( this.position ).add( this.shadowLightOffset );
            this.shadowLight.intensity = this.shadowLight.position.y < 1200 ? 0 : this.shadowLightIntensity;
			this.shadowLight.target.position.copy( this.position );
			this.cameraTimer = 0;

		}

	}

    updateCameraCollision(){

        let v = new THREE.Vector3();
        this.camera.getWorldDirection(v);
        v.multiplyScalar(-1);

        const rigPosition = this.object.position.clone().add( this.cameraRigPosition );
        
		raycaster.set( rigPosition, v );
		let intersectdir = raycaster.intersectObjects( terrainController.castables );

		if ( intersectdir.length > 0 ) {

			const distance = rigPosition.distanceTo( intersectdir[0].point ) * 0.5;
			if ( distance < this.cameraDistance ) {
                this.cameraDistance = distance;
            } else {
                this.cameraDistance = min(distance, this.cameraMaxDistance);
            }

            this.camera.position.setLength(this.cameraDistance);
            this.model.visible = this.cameraDistance > 2;

		} 

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
            let cd = new THREE.Vector3();
            this.camera.getWorldDirection( cd );
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
            

            if ( this.godMode == false ){

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

        });

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

		//x axis
		if ( keyIsDown( key.up ) ) {

			d.z -= 1;

		} else if ( keyIsDown( key.down ) ) {

			d.z += 1;

		}

		//z axis
		if ( keyIsDown( key.left ) ) {

			d.x -= 1;

		} else if ( keyIsDown( key.right ) ) {

			d.x += 1;

		}

		//y axis up
		if ( keyIsDown( key.space ) ) {

			if ( this.flyMode == false ) {

                if ( this.grounded ){
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
		if ( this.flyMode == true || this.godMode == true) {

			if ( keyIsDown( key.shift ) ) {

				//change position, no gravity
				d.y -= 1;

			}

			//set length to walkspeed * sprintspeed, in fly mode
			d.setLength( ( this.walkSpeed * delta ) * this.sprintSpeedMultiplier * 4 );

		} else {

			//set length to only walkspeed, in jetpack mode
			d.setLength( this.walkSpeed * delta );

			//add sprint only when shift key is pressed
			if ( keyIsDown( key.shift ) ) d.multiplyScalar( this.sprintSpeedMultiplier );

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

		this.cameraRig.rotation.x = Math.min( this.cameraRig.rotation.x, 1.2 );
		this.cameraRig.rotation.x = Math.max( this.cameraRig.rotation.x, -0.85 );
		this.cameraRig.rotation.z = 0;

        this.updateCameraCollision();

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

		raycaster.setFromCamera( new THREE.Vector2(), this.camera );

		let intersects = raycaster.intersectObjects( terrainController.castables, true );

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

		raycaster.set( downPos, scene.down );
		let intersectDown = raycaster.intersectObjects( terrainController.castables, true );


		if ( intersectDown.length > 0 ) {

			downPos.y = intersectDown[ 0 ].point.y;
			downNormal = intersectDown[ 0 ].face.normal;

		} else {

			downPos.y = point.y;

		}
		response.down = { position: downPos, normal: downNormal };


		//direction
		let dirNormal;
		let dirPos = this.position.clone();

		raycaster.set( dirPos, direction.normalize() );
		let intersectdir = raycaster.intersectObjects( terrainController.castables );

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
        
		return { x: Math.floor(pos.x / chunkSize), z: Math.floor(pos.z / chunkSize) };

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




	adjustTerrain() {

		if ( this.intersectPoint && this.intersectPoint.object?.parent?.isVolumetricTerrain ) {

			//exit if building too close by, or too far.
			let d = this.intersectPoint.point.distanceTo( this.position );
			if ( d > this.maxBuildDistance || ( mouseButton == RIGHT && d < this.minDigDistance ) ) return;

			//get the gridposition of the cameraIntersect.point and adjust value.
			let gridPosition = this.intersectPoint.point.clone()
				.sub( this.intersectPoint.object.position )
				.divide( terrainController.terrainScale )
				.round();
			let val = ( mouseButton == LEFT ) ? - this.terrainAdjustStrength : this.terrainAdjustStrength * 1.2;

			//tell chunk to change the terrain
			this.intersectPoint.object.chunk.adjust( gridPosition, this.brushRadius, val, true );

		}

	}



    remove(){

        this.model.geometry.dispose();
        this.model.material.dispose();

    }

}
