

class TerrainController extends VolumetricTerrain{

	constructor( offset, viewDistance, seed, callback ) {
		
        super(
            {
                gridSize: { x: 16, y: 256, z: 16 },
                terrainScale: { x: 10, y: 10, z: 10 },
                currentCoord: offset,
                viewDistance: viewDistance.viewDetail,
                farViewDistance: viewDistance.viewDistance,
                seed: seed,
                fps: 10,
                material: terrainMaterial,
                workers: 4,
                workerScript: './js/terrain/gridworker/GridWorker.js',
                meshFactory: Mesh,
                chunkClass: Chunk,
                db: false                   ////////////////////////////////    <<-------------------------------
            },
            ()=>{

                this.instancedObjectViewDistance = 16;                
                this.grassViewDistance = 4;
                this.grassHighViewDistance = 2;                
                this.fernViewDistance = 3;
                this.fogViewDistance = 6;
                this.treeViewDistance = 16;
                this.treeHighViewDistance = 4;
                this.upperTreeHeightLimit = this.gridSize.y * this.terrainScale.y * 0.7;
                this.upperBoulderHeightLimit = this.gridSize.y * 0.55;

                this.instancedObjects = {
                    "Grass": new Grass( this, this.grassViewDistance ),
                    "Tree": new Trees( this, this.treeViewDistance ),
                    "Fern": new Fern( this, this.fernViewDistance ),
                    "Fog": new Fog( this, this.fogViewDistance ),
                    "Boulder": new Boulder( this, this.instancedObjectViewDistance ),
                    "Pedestal": new Pedestal( this, this.instancedObjectViewDistance )
                };

                this.updateCastChunkTerrainArray( this.currentCoord );
                this.updateChunkLODs();   
                callback( this );

            }
        );

	}



    //   o8o               o8o      .   
    //   `"'               `"'    .o8   
    //  oooo  ooo. .oo.   oooo  .o888oo 
    //  `888  `888P"Y88b  `888    888   
    //   888   888   888   888    888   
    //   888   888   888   888    888 . 
    //  o888o o888o o888o o888o   "888" 
    init( viewDistance ) {

        if ( viewDistance ){
            this.viewDistance = viewDistance.viewDetail;
            this.farViewDistance = viewDistance.viewDistance;
            this.totalViewDistance =  this.viewDistance + this.farViewDistance;
        }

        return new Promise( resolve =>{

            //init chunks
            for( let chunk of Object.keys( this.chunks )){
                this.chunks[chunk].dispose();
            }
            this.chunks = {};

            const grid = uiController.elements.loadingGrid;
            uiController.elements.loadingText.textContent = `loading chunks`;
            
            let max_initial_chunks = 0;
            let num_initial_chunks = 0;
            const LOAD_INITIAL_TERRAIN = async ( chunk ) => {

                this.chunks[ chunk.chunkKey ] = chunk;                
                num_initial_chunks--;
                document.getElementById( chunk.chunkKey ).classList.add('active');
                
                if ( num_initial_chunks == 0 ) {

                    uiController.elements.loadingText.textContent = `loading player`;

                    setTimeout(()=>resolve(), 100);

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

                        const d = document.createElement('div');
                        d.id = `${this.currentCoord.x + x}:${this.currentCoord.z + z}`;
                        d.className = 'loading-grid-item';
                        grid.appendChild(d);

                    }

                }

                for( let chunk of addChunks.sort( ( a, b ) => a.dist - b.dist ) ){
                    chunk.add();
                }

            }, 10);
            

        } );

    }          
    
    //                        o8o                                  .             
    //                        `"'                                .o8             
    //  .oooo.   ooo. .oo.   oooo  ooo. .oo.  .oo.    .oooo.   .o888oo  .ooooo.  
    // `P  )88b  `888P"Y88b  `888  `888P"Y88bP"Y88b  `P  )88b    888   d88' `88b 
    //  .oP"888   888   888   888   888   888   888   .oP"888    888   888ooo888 
    // d8(  888   888   888   888   888   888   888  d8(  888    888 . 888    .o 
    // `Y888""8o o888o o888o o888o o888o o888o o888o `Y888""8o   "888" `Y8bod8P' 
                                                                            
    animate( delta ){
        const keys = Object.keys( this.instancedObjects );
        for( let key of keys){
            this.instancedObjects[key].animate( delta );
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
	async update() {
		
        await super.update( player.position );

        // //set birdsound volume
        let chunk = this.chunks[ this.getChunkKey( this.currentCoord ) ];
        let treeAmount = chunk.modelMatrices[ 'tree' ] ? chunk.modelMatrices[ 'tree' ].length + chunk.modelMatrices[ 'tree1' ].length : 0;
        document.querySelector( 'audio' ).setVolume( map( treeAmount, 10, 35, 0.0, 0.3, true ), 2.5 );        

	}

    updatecurrentCoord( currentCoord, newChunks ){
     
        super.updatecurrentCoord(currentCoord, newChunks );
        this.updateInstancedObjects();   
        
        if ( newChunks ) {
            this.updateChunkLODs();
            this.updateInstancedObjects( true );
        }
    }

    updateChunkLODs(){
     
        for( let chunk in this.chunks){
            
            chunk = this.chunks[chunk];
            const x = Math.abs(this.currentCoord.x - chunk.offset.x);
            const z = Math.abs(this.currentCoord.z - chunk.offset.z);
            
            if  ( x >= -this.viewDistance && x <= this.viewDistance &&
                  z >= -this.viewDistance && z <= this.viewDistance ) {
               
                chunk.showLevel( 1 );

            } else {
                
                chunk.showLevel( 0 );

            }
        }

    }

    updateInstancedObjects( force = false ){

        for ( let chunkKey of Object.keys( this.instancedObjects ) ) {

            if ( this.instancedObjects[ chunkKey ].needsUpdate || force ){

                this.updateInstancedObject( chunkKey );                

            }

        }

    }

    updateInstancedObject( chunkKey ){

        return new Promise( resolve => {

            this.instancedObjects[ chunkKey ].clearData();        
        
            const playerCoord = terrainController.getCoordFromPosition( player.position );

            for ( let x = - this.instancedObjectViewDistance; x <= this.instancedObjectViewDistance; x ++ ) {

                for ( let z = - this.instancedObjectViewDistance; z <= this.instancedObjectViewDistance; z ++ ) {

                    const chunkCoord = { 
                        x: ( playerCoord?.x || 0 ) + x, 
                        z: ( playerCoord?.z || 0 ) + z, 
                    };
                    const chunk = this.chunks[ this.getChunkKey( chunkCoord ) ];

                    if ( chunk ) this.instancedObjects[ chunkKey ].addChunk( chunk, x, z );

                }

            }
            
            this.instancedObjects[ chunkKey ].update( player.position );

            resolve();

        })        
        
    }

    //                              .o8                .               .oooooo.                          .   
    //                             "888              .o8              d8P'  `Y8b                       .o8   
    // oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.  888           .oooo.    .oooo.o .o888oo 
    // `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b 888          `P  )88b  d88(  "8   888   
    //  888   888   888   888 888   888   .oP"888    888   888ooo888 888           .oP"888  `"Y88b.    888   
    //  888   888   888   888 888   888  d8(  888    888 . 888    .o `88b    ooo  d8(  888  o.  )88b   888 . 
    //  `V88V"V8P'  888bod8P' `Y8bod88P" `Y888""8o   "888" `Y8bod8P'  `Y8bood8P'  `Y888""8o 8""888P'   "888" 
    //              888                                                                                      
    //             o888o                                                                                  
    //   .oooooo.   oooo                                oooo                                                 
    //  d8P'  `Y8b  `888                                `888                                                 
    // 888           888 .oo.   oooo  oooo  ooo. .oo.    888  oooo                                           
    // 888           888P"Y88b  `888  `888  `888P"Y88b   888 .8P'                                            
    // 888           888   888   888   888   888   888   888888.                                             
    // `88b    ooo   888   888   888   888   888   888   888 `88b.                                           
    //  `Y8bood8P'  o888o o888o  `V88V"V8P' o888o o888o o888o o888o                                       
    // ooooooooooooo                                        o8o                                              
    // 8'   888   `8                                        `"'                                              
    //      888       .ooooo.  oooo d8b oooo d8b  .oooo.   oooo  ooo. .oo.                                   
    //      888      d88' `88b `888""8P `888""8P `P  )88b  `888  `888P"Y88b                                  
    //      888      888ooo888  888      888      .oP"888   888   888   888                                  
    //      888      888    .o  888      888     d8(  888   888   888   888                                  
    //     o888o     `Y8bod8P' d888b    d888b    `Y888""8o o888o o888o o888o                              
    //       .o.                                                                                             
    //      .888.                                                                                            
    //     .8"888.     oooo d8b oooo d8b  .oooo.   oooo    ooo                                               
    //    .8' `888.    `888""8P `888""8P `P  )88b   `88.  .8'                                                
    //   .88ooo8888.    888      888      .oP"888    `88..8'                                                 
    //  .8'     `888.   888      888     d8(  888     `888'                                                  
    // o88o     o8888o d888b    d888b    `Y888""8o     .8'                                                   
    //                                             .o..P'                                                    
    //                                             `Y8P'                                                     
                                                                                                                          
    updateCastChunkTerrainArray( currentCoord ) { //adding boulders to castables

        if ( this.instancedObjects['Boulder'] ){
            super.updateCastChunkTerrainArray( currentCoord,  [ this.instancedObjects['Boulder'], this.instancedObjects['Pedestal'] ] );
        } else {
            super.updateCastChunkTerrainArray( currentCoord );
        }

        if ( window.watchtower ) this.castables.push( window.watchtower );
        

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
    //  o8o                           .                                                   .o8  
    //  `"'                         .o8                                                  "888  
    // oooo  ooo. .oo.    .oooo.o .o888oo  .oooo.   ooo. .oo.    .ooooo.   .ooooo.   .oooo888  
    // `888  `888P"Y88b  d88(  "8   888   `P  )88b  `888P"Y88b  d88' `"Y8 d88' `88b d88' `888  
    //  888   888   888  `"Y88b.    888    .oP"888   888   888  888       888ooo888 888   888  
    //  888   888   888  o.  )88b   888 . d8(  888   888   888  888   .o8 888    .o 888   888  
    // o888o o888o o888o 8""888P'   "888" `Y888""8o o888o o888o `Y8bod8P' `Y8bod8P' `Y8bod88P" 
    //            .o8           o8o                         .                                  
    //           "888           `"'                       .o8                                  
    //  .ooooo.   888oooo.     oooo  .ooooo.   .ooooo.  .o888oo  .oooo.o                       
    // d88' `88b  d88' `88b    `888 d88' `88b d88' `"Y8   888   d88(  "8                       
    // 888   888  888   888     888 888ooo888 888         888   `"Y88b.                        
    // 888   888  888   888     888 888    .o 888   .o8   888 . o.  )88b                       
    // `Y8bod8P'  `Y8bod8P'     888 `Y8bod8P' `Y8bod8P'   "888" 8""888P'                       
    //                          888                                                            
    //                      .o. 88P                                                            
    //                      `Y888P                                                             
    adjustInstancedObjects( chunkKey, center, radius ) {

        const chunk = this.getChunk( chunkKey );
        const point = chunk.position.clone().add( center.clone().multiply( this.terrainScale ) );

        for ( let key of Object.keys( this.instancedObjects ) ) {
        
            this.instancedObjects[ key ].removeMatricesOnDistanceFromPoint( chunkKey, point, radius );
        
        }

	}
    
}
