class Player{
    constructor(startChunk){

		//create camera
        this.object = this.camera = new THREE.PerspectiveCamera(70, windowWidth / windowHeight, 0.1, 10000);
        this.object.rotation.order ="YXZ";
        this.object.position.set((startChunk.x * chunkSize) + chunkSize/2, gridSizeY * gridScale * 0.9, (startChunk.z * chunkSize) + chunkSize/2);
        scene.add(this.object);

		//create head-lamp
        this.spotLight = new THREE.SpotLight( 0xffffff, 1, 15, HALF_PI / 3.5, 0.5, 2 );
        this.spotLight.target.position.set(0, 0, -100);
        this.object.add(this.spotLight);
        this.object.add(this.spotLight.target);

		//add a skybox. This position is 
        this.skyBox = new THREE.Mesh(
            new THREE.SphereBufferGeometry(chunkSize * chunkViewDistance * 1.2, 64, 64),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader().load('./resources/background.jpg'),
                side: THREE.BackSide
            })
        );
        this.skyBox.material.map.mapping = THREE.EquirectangularRefractionMapping;
        scene.add( this.skyBox );

        //raycast point
        this.intersectPoint = null;
		
		//chunk coord and list of visible chunks
        this.currentChunkCoord = new THREE.Vector2();
        this.visibleChunks = [];

		//brush vars
        this.terrainAdjustStrength = 0.15;
        this.brushRadius = 7;
        this.buildTimer = 0;
        this.maxBuildTime = 0.25;
        this.maxBuildDistance = 250;
        this.minDigDistance = this.brushRadius * (gridScale / 2 + 0.5);        
		
		//player height/movement vars
        this.height = 10;
		this.walkSpeed = 30;
		this.sprintSpeedMultiplier = 2.5;
		this.walkSlopeLimit = 1.5;		        
		this.vDown = 0.0;
        this.vDownMax = 0.8;
        this.gravity = 0.05;
        this.jumpStrength = 0.1;
		this.bouncyness = 0.15;
		this.mouseSensitivity = 0.002;

		//flymode selector
        this.flyModes = ['jetpack', 'fly'];
        this.selectedFlyMode = 0;
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
																  
	
    update( delta ){

		
		this.updateVisibleChunkRange();
		
        this.movePlayer( delta );

        this.getCameraIntersect();

		//timer for adjusting terrain
        if (mouseIsPressed){
            if ( this.buildTimer == 0) {
                this.adjustTerrain();                
            }
            if ((this.buildTimer += delta) >= this.maxBuildTime) this.buildTimer = 0;
        } else {
            this.buildTimer = 0;
        } 
		
		//move skybox along with the object/camera
        this.skyBox.position.copy( this.object.position );
        this.skyBox.position.y *= 0.4;
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
	                                                          
    movePlayer( delta ){

        //get cameraDirection (player aim direction);
        let cd = new THREE.Vector3();
		this.camera.getWorldDirection(cd);		
        let playerEuler = new THREE.Euler(0, this.object.rotation.y, 0, 'YXZ');

        //get keyinput and rotate to camera direction (y axis rotation )
		let walkDirection = this.getKeyInput( delta ).applyEuler(playerEuler);
		

        //the new position
        let nPos = this.object.position.clone();
		nPos.add( walkDirection );
		//add gravity
        nPos.y += this.vDown; 


        //get the collisions for new position (down, up and in walkDirection )
        let collisions = this.terrainCollidePoint( nPos, walkDirection );
        

        if ( collisions.down.normal ){
            
            if (nPos.y > collisions.down.position.y + this.height && 
                this.flyModes[this.selectedFlyMode] == 'jetpack') {
                    //fallingdown
                    this.vDown -= this.gravity;

            } else {

                this.vDown *= -this.bouncyness;
                //climbing up terrain
                if (this.flyModes[this.selectedFlyMode] == 'jetpack'){
                    nPos.y = collisions.down.position.y + this.height + this.vDown;
                    
                } else{
                    if (abs(nPos.y - collisions.down.position.y) < this.height * 1.5) nPos.y = collisions.down.position.y + this.height * 1.5;
                }
                
            }

        } else {
			
			// no collisions.down means the player is underneath the terrain. 
			// replace new position with old position
            nPos.copy(this.object.position);            
        }

        //always wear a helmet inside caves
        if (collisions.up.position){

            if (collisions.up.position.y - nPos.y < this.height * 1.5){                

				//offset position from ceiling
                this.vDown = this.gravity;
				nPos.y = collisions.up.position.y - this.height * 1.5 - 0.1;
				
            }
        }

        //check pointing direction
        if (collisions.direction.position){

			let d = this.object.position.distanceTo(collisions.direction.position);
			
			//if the angle is too steep, return to previous position
            if (d < this.walkSlopeLimit){
                nPos.copy(this.object.position);
			}            
			
        }

		//set new position and gravity velocity
        this.object.position.copy(nPos);
        this.vDown = constrain(this.vDown, -this.vDownMax, this.vDownMax);
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
	                                                 

    getKeyInput( delta ){

		let d = new THREE.Vector3();
		
        //x axis
		if (keyIsDown(key.up)){

			d.z -= 1;

		} else if (keyIsDown(key.down)){

			d.z += 1;

        }
        
		//z axis
		if (keyIsDown(key.left)){

			d.x -= 1;

		} else if (keyIsDown(key.right)){
			
			d.x += 1;

		}
        
        //y axis up
        if (keyIsDown(key.space) && this.object.position.y < gridSizeY * gridScale){

            if (this.flyModes[this.selectedFlyMode] == 'jetpack'){

				//add to gravity vector
                d.y += this.jumpStrength;
				this.vDown += this.jumpStrength;
				
            } else {

				//only position
				d.y += 1;
				
            }
		}
		
        //y axis down
        if (this.flyModes[this.selectedFlyMode] == 'fly'){

            if (keyIsDown(key.shift)){

				//change position, no gravity
				d.y -= 1;            
				
			}
			
			//set length to walkspeed * sprintspeed, in fly mode
            d.setLength((this.walkSpeed  * delta) * this.sprintSpeedMultiplier);

        } else {

			//set length to only walkspeed, in jetpack mode
			d.setLength(this.walkSpeed * delta);
			
			//add sprint only when shift key is pressed
            if (keyIsDown(key.shift)) d.multiplyScalar(this.sprintSpeedMultiplier);
            
        }

        return d;
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
		  
	getCameraIntersect(){

        if (chunks.length == 0) return;

		raycaster.setFromCamera( new THREE.Vector2(), this.camera );        
		
        let intersects = raycaster.intersectObjects( this.visibleChunks );

		this.intersectPoint = null;

        if (intersects.length > 0){

			this.intersectPoint = intersects[0];
		
        }
    }
	                                                                                                                       
    terrainCollidePoint( point, direction ){
        let response = {};

        //down
        let downNormal;
        let downPos = point.clone();
        downPos.y += this.height * 0.5;

        raycaster.set(downPos, new THREE.Vector3(0, -1, 0));
        let intersectDown = raycaster.intersectObjects( this.visibleChunks );

        if (intersectDown.length > 0){
            downPos.y = intersectDown[0].point.y;
            downNormal = intersectDown[0].face.normal
        } else {
            downPos.y = point.y;
        }
        response.down = {position: downPos, normal: downNormal};
    
        
        //up
        let upNormal;
        let upPos = point.clone();
        upPos.y -= this.height * 0.5;

        raycaster.set(upPos, new THREE.Vector3(0, 1, 0));
        let intersectUp = raycaster.intersectObjects( this.visibleChunks );

        if (intersectUp.length > 0){
            upPos.y = intersectUp[0].point.y;
            upNormal = intersectUp[0].face.normal
        } else {
            upPos = undefined;
        }
        response.up = {position: upPos, normal: upNormal};

        //direction
        let dirNormal;
        let dirPos = this.object.position.clone();        

        raycaster.set(dirPos, direction.normalize());
        let intersectdir = raycaster.intersectObjects( this.visibleChunks );

        if (intersectdir.length > 0){
            dirPos = intersectdir[0].point;
            dirNormal = intersectdir[0].face.normal
        } else {
            dirPos = undefined;
        }
        response.direction = {position: dirPos, normal: dirNormal};

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
	                                                          

    updateVisibleChunkRange(){

		//new set of visible chunks
		let newVisibleChunks = {};
		//new chunk coordinate
        this.currentChunkCoord = getChunkCoord( this.object.position );

        for (let x = -chunkViewDistance; x <= chunkViewDistance; x++){
            for (let z = -chunkViewDistance; z <= chunkViewDistance; z++){
                
                let chunkCoord = {x: this.currentChunkCoord.x + x, y: this.currentChunkCoord.y + z};
                let chunkKey = getChunkKey( chunkCoord );

				//if chunk does not exist, add it to chunk generation queue
                if (!chunks[chunkKey]) {
                    createNewChunks[chunkKey] = chunkCoord;
				}

				//store in visible chunks set
				newVisibleChunks[chunkKey] = true;
				
            }
        }

		//check existing chunks 
        this.visibleChunks.forEach(mesh=>{

			//if this chunk is not needed in new visible chunks, hide it.
			if (!newVisibleChunks[mesh.chunk.chunkKey]) mesh.visible = false;
			
        })

		//reset existing visible chunk set
		this.visibleChunks = [];
		
        for(let chunk in newVisibleChunks){

			//save new visible chunkset in existing visible chunk set
            if (chunks[chunk] && chunks[chunk].terrainMesh){

				//unhide it
				chunks[chunk].terrainMesh.visible = true;

				//add it
				this.visibleChunks.push( chunks[chunk].terrainMesh );
				
			}
			
		}
		
    }


	                                                                                                             
	                                                                                                             
	                                                           
	                                                           
	// ooo. .oo.  .oo.    .ooooo.  oooo  oooo   .oooo.o  .ooooo.  
	// `888P"Y88bP"Y88b  d88' `88b `888  `888  d88(  "8 d88' `88b 
	//  888   888   888  888   888  888   888  `"Y88b.  888ooo888 
	//  888   888   888  888   888  888   888  o.  )88b 888    .o 
	// o888o o888o o888o `Y8bod8P'  `V88V"V8P' 8""888P' `Y8bod8P' 
	                                                                                                             

    mouseMoved(e){

		//rotate object/camera
        this.object.rotateY(e.movementX * -this.mouseSensitivity);
        this.object.rotateX(e.movementY * -this.mouseSensitivity);
		this.object.rotation.z = 0;
		
	}

	mouseScrolled( e ) {

		this.brushRadius = constrain( this.brushRadius -= Math.sign( e.deltaY ), 1, 4 );
	
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
	                                                                
	                                                                
	                                                                
    
    adjustTerrain(){

        if (this.intersectPoint) {
            
            //exit if building too close by, or too far.
			let d = this.intersectPoint.point.distanceTo(this.object.position);
            if (d > this.maxBuildDistance || (mouseButton == RIGHT && d < this.minDigDistance)) return;

            //get the gridposition of the cameraIntersect.point and adjust value.
            let gridPosition = this.intersectPoint.point.clone().sub(this.intersectPoint.object.position).divideScalar(gridScale).round();
            let val = (mouseButton == LEFT) ? -this.terrainAdjustStrength: this.terrainAdjustStrength;
            
            //tell chunk to change the terrain
            this.intersectPoint.object.chunk.adjust( gridPosition, this.brushRadius, val, true );
            
        }
    }

}