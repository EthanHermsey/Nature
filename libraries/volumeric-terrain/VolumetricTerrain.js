class VolumetricTerrain extends THREE.Object3D{

    constructor(options = {}){
        
        super();

		this.surfaceNetEngine = new SurfaceNets();

		this.chunks = {};
		this.updateChunks = {};
		this.createNewChunks = {};
		this.castChunks = [];
		
        this.prevCoord = undefined;
		
        this.chunkViewDistance = options.viewDistance || 6;
		this.farChunkViewDistance = options.farViewDistance || 0;
        this.totalViewDistance =  this.chunkViewDistance + this.farChunkViewDistance;

		this.material = options.material || new THREE.MeshLambertMaterial( {} );
		
        const num_workers = options.workers || 4;
        this.workerBank = new WorkerBank(options.workerscript, num_workers);

        this.init()
			.then( ()=>{

				callback( this );

			} );

    }

    
	//  o8o               o8o      .   
	//  `"'               `"'    .o8   
	// oooo  ooo. .oo.   oooo  .o888oo 
	// `888  `888P"Y88b  `888    888   
	//  888   888   888   888    888   
	//  888   888   888   888    888 . 
	// o888o o888o o888o o888o   "888" 
	                                
	init() {

		return new Promise( resolve =>{

            //init chunks
            Object.keys( this.chunks ).forEach( chunk => this.chunks[chunk].remove() );
            this.chunks = {};

            const grid = document.getElementById('loading-grid');
            const loadingtext = document.getElementById( 'loading-text' );
            loadingtext.textContent = `loading chunks`;
            
            let max_initial_chunks = 0;
            let num_initial_chunks = 0;
            let loadInitialTerrain = ( chunk ) => {


                this.chunks[ chunk.chunkKey ] = chunk;
                num_initial_chunks--;
                document.getElementById( chunk.chunkKey ).classList.add('active');
                
                if ( num_initial_chunks == 0 ) {

                    loadingtext.textContent = `loading player`;                  
                    this.generateInstancedObjects();
                    resolve();

                }                

            };

            const gridAmount = this.totalViewDistance * 2 + 1;
            grid.style.gridTemplateRows = `repeat(${gridAmount},calc(100% / ${gridAmount}))`;
            grid.style.gridTemplateColumns = `repeat(${gridAmount},calc(100% / ${gridAmount}))`;
            grid.innerHTML = '';

            
            setTimeout(() => {

                const addChunks = [];
                for ( let x = - this.totalViewDistance; x <= this.totalViewDistance; x ++ ) {

                    for ( let z = - this.totalViewDistance; z <= this.totalViewDistance; z ++ ) {

                        addChunks.push({
                            dist: x * x + z * z,
                            add: () =>{
                                new Chunk(
                                    x,
                                    z,
                                    this,
                                    (chunk) => loadInitialTerrain( chunk )
                                );
                            }
                        })
                        
                        num_initial_chunks++;
                        max_initial_chunks++;

                        const d = document.createElement('div');
                        d.id = `${x}:${z}`;
                        d.className = 'loading-grid-item';
                        grid.appendChild(d);

                    }

                }

                const tvd = this.totalViewDistance * this.totalViewDistance;
                addChunks
                    .sort( ( a, b ) => a.dist - b.dist )
                    .forEach( chunk => chunk.add() );

            }, 10);
            

		} );

	}


    toggleClock( start ){

        if ( start ){            
            this.clock = setInterval(() => {
                this.update();
            }, 300 );
        } else {
            clearInterval(this.clock);
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
	update() {

        //create array of promises
        let updatedChunk = false;
        const promises = [];

        //update chunks after digging        
        if ( Object.keys( this.updateChunks ).length > 0 ) {

            Object.keys( this.updateChunks ).forEach( chunkKey => {

                promises.push( this.chunks[ chunkKey ].update() );
                delete this.updateChunks[ chunkKey ];
                updatedChunk = true;

            } );
            
        }

		//create new chunks
		if ( Object.keys( this.createNewChunks ).length > 0 ) {

            Object.keys( this.createNewChunks ).forEach( chunkKey => {
                
                if ( ! this.chunks[ chunkKey ] ) {
    
                    promises.push(new Promise( ( resolve )=>{
    
                        new Chunk(
                            this.createNewChunks[ chunkKey ].x,
                            this.createNewChunks[ chunkKey ].y,
                            this,
                            chunk => {
                                this.chunks[ chunkKey ] = chunk;
                                resolve();
                            }
                        );
                        
                    } ) );
                }

                delete this.createNewChunks[ chunkKey ];

            });

		}


        Promise.all( promises ).then( ()=>{

            if ( ! this.prevCoord ||
                   updatedChunk === true ||
                   this.prevCoord.x != player.currentChunkCoord.x ||
                   this.prevCoord.y != player.currentChunkCoord.y ) {
    

                this.generateInstancedObjects();
                this.updateCastChunkTerrainArray();			

                if ( !updatedChunk ){
                    
                    this.updateVisibleChunkTerrainArray();
                    this.prevCoord = player.currentChunkCoord.clone();

                }

                //set birdsound volume
                let chunk = chunkController.chunks[ getChunkKey( this.prevCoord ) ];
                let treeAmount = chunk.modelMatrices[ 'tree' ].length + chunk.modelMatrices[ 'tree1' ].length;
                document.querySelector( 'audio' ).setVolume( map( treeAmount, 10, 35, 0.0, 0.3, true ), 2.5 );
    
            }
            
        } );


		//update fake-fog
		if ( this.fogCloud && this.fogCloud.material.userData.shader){
			this.fogCloud.material.userData.shader.uniforms.time.value += 0.05;
		}

	}
	
	//                          .     .oooooo.   oooo                                oooo        
	//                        .o8    d8P'  `Y8b  `888                                `888        
	//  .oooooooo  .ooooo.  .o888oo 888           888 .oo.   oooo  oooo  ooo. .oo.    888  oooo  
	// 888' `88b  d88' `88b   888   888           888P"Y88b  `888  `888  `888P"Y88b   888 .8P'   
	// 888   888  888ooo888   888   888           888   888   888   888   888   888   888888.    
	// `88bod8P'  888    .o   888 . `88b    ooo   888   888   888   888   888   888   888 `88b.  
	// `8oooooo.  `Y8bod8P'   "888"  `Y8bood8P'  o888o o888o  `V88V"V8P' o888o o888o o888o o888o 
	// d"     YD                                                                                 
	// "Y88888P'                                                                              
	getChunk( key ) {

		return this.chunks[ key ];

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
	//              o8o            o8o   .o8       oooo                   
	//              `"'            `"'  "888       `888                   
	// oooo    ooo oooo   .oooo.o oooo   888oooo.   888   .ooooo.         
	//  `88.  .8'  `888  d88(  "8 `888   d88' `88b  888  d88' `88b        
	//   `88..8'    888  `"Y88b.   888   888   888  888  888ooo888        
	//    `888'     888  o.  )88b  888   888   888  888  888    .o        
	//     `8'     o888o 8""888P' o888o  `Y8bod8P' o888o `Y8bod8P'        
	//           oooo                                oooo                 
	//           `888                                `888                 
	//  .ooooo.   888 .oo.   oooo  oooo  ooo. .oo.    888  oooo   .oooo.o 
	// d88' `"Y8  888P"Y88b  `888  `888  `888P"Y88b   888 .8P'   d88(  "8 
	// 888        888   888   888   888   888   888   888888.    `"Y88b.  
	// 888   .o8  888   888   888   888   888   888   888 `88b.  o.  )88b 
	// `Y8bod8P' o888o o888o  `V88V"V8P' o888o o888o o888o o888o 8""888P' 
	updateVisibleChunkTerrainArray() {

		//new set of visible chunks
		let newVisibleChunks = {};

		//new chunk coordinate
		for ( let x = - this.totalViewDistance; x <= this.totalViewDistance; x ++ ) {

			for ( let z = - this.totalViewDistance; z <= this.totalViewDistance; z ++ ) {

				let coord = { x: player.currentChunkCoord.x + x, y: player.currentChunkCoord.y + z };
				let chunkKey = getChunkKey( coord );

				
				//if chunk does not exist, 
				//or it's low lod and if it's a farchunk:
				//add it to chunk generation queue
				if ( ! this.chunks[ chunkKey ] ){

					this.createNewChunks[ chunkKey ] = coord;
					

				} else if  ( x >= -this.chunkViewDistance && x <= this.chunkViewDistance &&
							 z >= -this.chunkViewDistance && z <= this.chunkViewDistance ) {

					
					this.chunks[ chunkKey ].showLevel( 1 );
					

				} else {

					//store in visible chunks object
					this.chunks[ chunkKey ].showLevel( 0 );						

				}

				newVisibleChunks[ chunkKey ] = true;

			}

		}

		//check existing chunks
		Object.keys( this.chunks ).forEach( key=>{

			//if this chunk is not needed in new visible chunks, hide it.
			if ( ! newVisibleChunks[ key ]) {

				this.chunks[ key ].remove();
				delete this.chunks[ key ];

			}

		} );

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
	//                                                                 .   
	//                                                               .o8   
	// oooo d8b  .oooo.   oooo    ooo  .ooooo.   .oooo.    .oooo.o .o888oo 
	// `888""8P `P  )88b   `88.  .8'  d88' `"Y8 `P  )88b  d88(  "8   888   
	//  888      .oP"888    `88..8'   888        .oP"888  `"Y88b.    888   
	//  888     d8(  888     `888'    888   .o8 d8(  888  o.  )88b   888 . 
	// d888b    `Y888""8o     .8'     `Y8bod8P' `Y888""8o 8""888P'   "888" 
	//                    .o..P'                                           
	//                    `Y8P'                                            
	//           oooo                                oooo                  
	//           `888                                `888                  
	//  .ooooo.   888 .oo.   oooo  oooo  ooo. .oo.    888  oooo   .oooo.o  
	// d88' `"Y8  888P"Y88b  `888  `888  `888P"Y88b   888 .8P'   d88(  "8  
	// 888        888   888   888   888   888   888   888888.    `"Y88b.   
	// 888   .o8  888   888   888   888   888   888   888 `88b.  o.  )88b  
	// `Y8bod8P' o888o o888o  `V88V"V8P' o888o o888o o888o o888o 8""888P'  
	updateCastChunkTerrainArray() {

		//new set of visible chunks
		let newcastChunks = {};

		//raycast chunk range
        let d = 1
		for ( let x = - d; x <= d; x ++ ) {

			for ( let z = - d; z <= d; z ++ ) {

				let chunkCoord = { x: player.currentChunkCoord.x + x, y: player.currentChunkCoord.y + z };
				let chunkKey = getChunkKey( chunkCoord );

				newcastChunks[ chunkKey ] = true;

			}

		}

		this.castChunks = [];

		for ( let chunkKey in newcastChunks ) {

			let chunk = chunkController.getChunk( chunkKey );
			if ( chunk ) {
				this.castChunks.push( chunk.terrainMesh );
			}
		}

	}

}