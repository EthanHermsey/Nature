const CHUNK_OVERLAP = 2;

class VolumetricTerrain extends THREE.Object3D {

    constructor(options = {}, cb){
        
        super();

        this.isVolumetricTerrain = true;
        this.DB = options.db === true ? new DB() : undefined;        
        this.fps = options.fps || 20;

        this.currentCoord = options.currentCoord || {x: 0, z: 0};
		this.chunks = {};
		this.chunkBuildQueue = {};
		this.castables = [];		
		
        this.gridSize = options.gridSize || { x: 16, y: 256, z: 16 };
        this.terrainScale = options.terrainScale || { x: 5, y: 5, z: 5 };
        this.viewDistance = options.viewDistance || 6;
		this.farViewDistance = options.farViewDistance || 0;
        this.totalViewDistance =  this.viewDistance + this.farViewDistance;
        this.chunkSize = this.terrainScale.x * this.gridSize.x;
        this.chunkSizeOverlap = ( this.gridSize.x - CHUNK_OVERLAP ) * this.terrainScale.x;

		this.material = options.material || new THREE.MeshLambertMaterial( {color: 'rgb(100, 100, 100)'} );
        this.meshFactory = options.meshFactory || undefined;
        this.chunkClass = options.chunkClass || VolumetricChunk;
		
        const num_workers = options.workers || 4;
        this.gridWorkerBank = new WorkerBank(options.gridWorkerScript || './libraries/volumetric-terrain/GridWorker.js', options.gridWorkerOptions || {}, num_workers);
        this.meshWorkerBank = new WorkerBank(options.meshWorkerScript || './libraries/volumetric-terrain/MeshWorker.js', options.meshWorkerOptions || {}, num_workers);

        this.init()
			.then( ()=>{

				cb( this );

			} );

    }

    toggleClock( start ){

        if ( start ){            
            this.clock = setInterval(() => {
                this.update();
            }, 1000 / this.fps );
        } else {
            clearInterval(this.clock);
        }

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
            for( let chunk of Object.keys( this.chunks )){
                this.chunks[chunk].dispose();
            }
            this.chunks = {};

            let max_initial_chunks = 0;
            let num_initial_chunks = 0;
            let LOAD_INITIAL_TERRAIN = async ( chunk ) => {

                this.chunks[ chunk.chunkKey ] = chunk;
                num_initial_chunks--;            
                
                if ( num_initial_chunks == 0 ) resolve();

            };

            setTimeout(() => {

                const addChunks = [];
                for ( let x = - this.totalViewDistance; x <= this.totalViewDistance; x ++ ) {

                    for ( let z = - this.totalViewDistance; z <= this.totalViewDistance; z ++ ) {

                        addChunks.push({
                            dist: x * x + z * z,
                            add: () =>{
                                new this.chunkClass(
                                    this.currentCoord.x + x,
                                    this.currentCoord.z + z,
                                    this,
                                    (chunk) => LOAD_INITIAL_TERRAIN( chunk )
                                );
                            }
                        })
                        
                        num_initial_chunks++;
                        max_initial_chunks++;

                    }

                }

                for( let chunk of addChunks.sort( ( a, b ) => a.dist - b.dist ) ){
                    chunk.add();
                }

            }, 10);
            

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

	async update( position, updateCallback ) {

        //create array of promises
        let updatedChunk = false;
        const promises = [];

        const currentCoord = this.getCoordFromPosition( position );

        //update chunks after digging
        for( let chunkKey of Object.keys( this.chunks ) ) {

            if ( this.chunks[ chunkKey].needsUpdate === true ){

                promises.push( this.chunks[ chunkKey ].update() );
                this.chunks[ chunkKey].needsUpdate = false;
                updatedChunk = true;            

            }

        };
            
        

		//create new chunks
        const buildKeys = Object.keys( this.chunkBuildQueue );
		if ( buildKeys.length > 0 ) {
            
            const chunkKey = buildKeys[0];
            if ( ! this.chunks[ chunkKey ] ) {

                promises.push( new Promise( ( resolve )=>{

                    new this.chunkClass(
                        this.chunkBuildQueue[ chunkKey ].x,
                        this.chunkBuildQueue[ chunkKey ].z,
                        this,
                        chunk => {
                            this.chunks[ chunkKey ] = chunk;
                            resolve( chunkKey );
                        }
                    );
                    
                } ) );
            }

            delete this.chunkBuildQueue[ chunkKey ];
           
		}


        await Promise.all( promises ).then( data => updateCallback( data ));

        if ( ! this.currentCoord ||
                updatedChunk === true ||
                this.currentCoord.x != currentCoord.x ||
                this.currentCoord.z != currentCoord.z ) {

            this.updatecurrentCoord( currentCoord, !updatedChunk );

        }

	}

    updatecurrentCoord( currentCoord, newChunks ){
         
        
        //updated after adjusting grid
        this.updateCastChunkTerrainArray( currentCoord );

        if ( newChunks ){
            
            this.updateVisibleChunkTerrainArray( currentCoord );
            //update after changing coord
            this.currentCoord = currentCoord;
            
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
    getCoordFromPosition( position ){

        return { x: Math.floor(position.x / this.chunkSizeOverlap), z: Math.floor(position.z / this.chunkSizeOverlap) };

    }
    getChunkKey( coord ) {
    
        return coord.x + ":" + coord.z;
        
    }
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
	updateVisibleChunkTerrainArray( currentCoord ) {

        	//new set of visible chunks
        	let newVisibleChunks = {};
    
        	//new chunk coordinate
        	for ( let x = - this.totalViewDistance; x <= this.totalViewDistance; x ++ ) {
    
        		for ( let z = - this.totalViewDistance; z <= this.totalViewDistance; z ++ ) {
    
        			let coord = { x: currentCoord.x + x, z: currentCoord.z + z };
        			let chunkKey = this.getChunkKey( coord );
    
                    
        			//if chunk does not exist, 
        			//or it's low lod and if it's a farchunk:
        			//add it to chunk generation queue
        			if ( ! this.getChunk( chunkKey ) ){
    
        				this.chunkBuildQueue[ chunkKey ] = coord;                        
    
        			}
    
        			newVisibleChunks[ chunkKey ] = true;
    
        		}
    
        	}
    
        	//check existing chunks
        	for( let key of Object.keys( this.chunks ) ){
    
                //if this chunk is not needed in new visible chunks, hide it.
                if ( ! newVisibleChunks[ key ]) {
                    
                    this.chunks[ key ].dispose();
        			delete this.chunks[ key ];
    
        		}
    
        	};
    
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
	updateCastChunkTerrainArray( currentCoord, castableObjects = [] ) {

        //new set of visible chunks
		let newcastables = {};

		//raycast chunk range
        let d = 1
		for ( let x = - d; x <= d; x ++ ) {

			for ( let z = - d; z <= d; z ++ ) {

				let chunkCoord = { x: currentCoord.x + x, z: currentCoord.z + z };
				let chunkKey = this.getChunkKey( chunkCoord );

				newcastables[ chunkKey ] = true;

			}

		}

		this.castables = [];

		for ( let chunkKey in newcastables ) {

            let chunk = terrainController.getChunk( chunkKey );
            let objects = castableObjects.map( castableObject => castableObject?.cachedData[ chunkKey ]?.mesh || castableObject );

			if ( chunk ) this.castables.push( chunk.mesh );
			if ( objects.length > 0 ) this.castables.push( ...objects );

		}

	}

}