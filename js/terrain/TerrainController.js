

class TerrainController extends VolumetricTerrain{

	constructor( callback ) {
		
        super(
            {
                gridSize: { x: 16, y: 256, z: 16 },
                gridScale: { x: 10, y: 10, z: 10 },
                viewDistance: 6,
                farViewDistance: 4,
                material: materials['terrain'],
                workers: 4,
                workerScript: './js/terrain/worker/worker.js',
                meshFactory: Mesh,
                chunkClass: Chunk
            },
            ()=>{

                this.grassViewDistance = 4;
                this.grassHighViewDistance = 2;
                this.fernViewDistance = 3;
                this.treeViewDistance = 16;
                this.treeHighViewDistance = 3;

                this.deltaCountCreate = 0;
                this.deltaCountUpdate = 0;
                this.updateCastChunkTerrainArray( this.prevCoord );
                this.updateLODs();
                this.generateInstancedObjects();
                callback( this );

            }
        );

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


//   o8o               o8o      .   
//   `"'               `"'    .o8   
//  oooo  ooo. .oo.   oooo  .o888oo 
//  `888  `888P"Y88b  `888    888   
//   888   888   888   888    888   
//   888   888   888   888    888 . 
//  o888o o888o o888o o888o   "888" 
    init() {

        return new Promise( resolve =>{

            //init chunks
            for( let chunk of Object.keys( this.chunks )){
                this.chunks[chunk].dispose();
            }
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
                                new this.chunkClass(
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
	async update() {
		
        // update fake-fog
		if ( this.fogCloud && this.fogCloud.material.userData.shader){
			this.fogCloud.material.userData.shader.uniforms.time.value += 0.05;
		}

        await super.update( player.currentChunkCoord );

        // //set birdsound volume
        let chunk = this.chunks[ this.getChunkKey( this.prevCoord ) ];
        let treeAmount = chunk.modelMatrices[ 'tree' ] ? chunk.modelMatrices[ 'tree' ].length + chunk.modelMatrices[ 'tree1' ].length : 0;
        document.querySelector( 'audio' ).setVolume( map( treeAmount, 10, 35, 0.0, 0.3, true ), 2.5 );        

	}

    updatePrevCoord( currentCoord, newChunks ){
     
        super.updatePrevCoord(currentCoord, newChunks );
        
        if ( newChunks ) {
            this.updateLODs();
            this.generateInstancedObjects();
        }
    }

    updateLODs(){
     
        for( let chunk in this.chunks){
            
            chunk = this.chunks[chunk];
            const x = Math.abs(this.prevCoord.x - chunk.offset.x);
            const z = Math.abs(this.prevCoord.z - chunk.offset.z);
            
            if  ( x >= -this.viewDistance && x <= this.viewDistance &&
                  z >= -this.viewDistance && z <= this.viewDistance ) {
               
                chunk.showLevel( 1 );

            } else {
                
                chunk.showLevel( 0 );

            }
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














	//                                                                   .                     
	//                                                                 .o8                     
	//  .oooooooo  .ooooo.  ooo. .oo.    .ooooo.  oooo d8b  .oooo.   .o888oo  .ooooo.          
	// 888' `88b  d88' `88b `888P"Y88b  d88' `88b `888""8P `P  )88b    888   d88' `88b         
	// 888   888  888ooo888  888   888  888ooo888  888      .oP"888    888   888ooo888         
	// `88bod8P'  888    .o  888   888  888    .o  888     d8(  888    888 . 888    .o         
	// `8oooooo.  `Y8bod8P' o888o o888o `Y8bod8P' d888b    `Y888""8o   "888" `Y8bod8P'         
	// d"     YD                                                                               
	// "Y88888P'                                                                               
	                                                                                        
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

	generateInstancedObjects(){


		// for( let object in store.instancedObjects){

		// }
		this.generateGrass();
		this.generateFerns();
		this.generateTrees();
		this.generateFog();
		
	}

	//                                                                   .             
	//                                                                 .o8             
	//  .oooooooo  .ooooo.  ooo. .oo.    .ooooo.  oooo d8b  .oooo.   .o888oo  .ooooo.  
	// 888' `88b  d88' `88b `888P"Y88b  d88' `88b `888""8P `P  )88b    888   d88' `88b 
	// 888   888  888ooo888  888   888  888ooo888  888      .oP"888    888   888ooo888 
	// `88bod8P'  888    .o  888   888  888    .o  888     d8(  888    888 . 888    .o 
	// `8oooooo.  `Y8bod8P' o888o o888o `Y8bod8P' d888b    `Y888""8o   "888" `Y8bod8P' 
	// d"     YD                                                                       
	// "Y88888P'                                                                    
	//  .oooooooo oooo d8b  .oooo.    .oooo.o  .oooo.o                                 
	// 888' `88b  `888""8P `P  )88b  d88(  "8 d88(  "8                                 
	// 888   888   888      .oP"888  `"Y88b.  `"Y88b.                                  
	// `88bod8P'   888     d8(  888  o.  )88b o.  )88b                                 
	// `8oooooo.  d888b    `Y888""8o 8""888P' 8""888P'                                 
	// d"     YD                                                                       
	// "Y88888P'                                                                    
	async generateGrass() {

		if ( ! this.grass ) {

			this.grass = [
				new THREE.InstancedMesh(
					modelBank.grassModel1.geometry,
					modelBank.grassModel1.material,
					100000
				),
				new THREE.InstancedMesh(
					modelBank.grassModel2.geometry,
					modelBank.grassModel2.material,
					15000
				),
				new THREE.InstancedMesh(
					modelBank.grassModelHigh.geometry,
					modelBank.grassModelHigh.material,
					15000
				)
			];
			this.grass[0].receiveShadow = true;
			this.grass[1].receiveShadow = true;
			this.grass[2].receiveShadow = true;

			scene.add( this.grass[0] );
			scene.add( this.grass[1] );
			scene.add( this.grass[2] );

		}

		let count0 = 0, count1 = 0, count2 = 0;
		for ( let x = - this.grassViewDistance; x <= this.grassViewDistance; x ++ ) {

			for ( let z = - this.grassViewDistance; z <= this.grassViewDistance; z ++ ) {

				const chunkCoord = { 
					x: ( player?.currentChunkCoord?.x || 0 ) + x, 
					z: ( player?.currentChunkCoord?.z || 0 ) + z, 
				};
                const chunk = this.chunks[ this.getChunkKey( chunkCoord ) ];

				if ( chunk ) {

					let grassMatrices = chunk.getGrassMatrices();

					if ( Math.abs(x) <= 1 && Math.abs(z) <= this.grassHighViewDistance){

						//high quality grass
						for ( let i = 0; i < grassMatrices[0].length; i ++, count2 ++ ) {

							this.grass[2].setMatrixAt( count2, grassMatrices[0][ i ] );
	
						}
	
					} else {

                        if ( grassMatrices ){
                            for ( let i = 0; i < grassMatrices[0].length; i ++, count0 ++ ) {
        
                                this.grass[0].setMatrixAt( count0, grassMatrices[0][ i ] );
        
                            }
        
                            for ( let i = 0; i < grassMatrices[1].length; i ++, count1 ++ ) {
        
                                this.grass[1].setMatrixAt( count1, grassMatrices[1][ i ] );
        
                            }
                        }

					}
					

				}

			}

		}

		this.grass[0].count = Math.min( count0, 100000 );
		this.grass[1].count = Math.min( count1, 15000 );
		this.grass[2].count = Math.min( count2, 15000 );

		this.grass[0].instanceMatrix.needsUpdate = true;
		this.grass[1].instanceMatrix.needsUpdate = true;
		this.grass[2].instanceMatrix.needsUpdate = true;

	}


	//                                                                   .             
	//                                                                 .o8             
	//  .oooooooo  .ooooo.  ooo. .oo.    .ooooo.  oooo d8b  .oooo.   .o888oo  .ooooo.  
	// 888' `88b  d88' `88b `888P"Y88b  d88' `88b `888""8P `P  )88b    888   d88' `88b 
	// 888   888  888ooo888  888   888  888ooo888  888      .oP"888    888   888ooo888 
	// `88bod8P'  888    .o  888   888  888    .o  888     d8(  888    888 . 888    .o 
	// `8oooooo.  `Y8bod8P' o888o o888o `Y8bod8P' d888b    `Y888""8o   "888" `Y8bod8P' 
	// d"     YD                                                                       
	// "Y88888P'                                                                       
	                                                                                
	// oooooooooooo                                                                    
	// `888'     `8                                                                    
	//  888          .ooooo.  oooo d8b ooo. .oo.    .oooo.o                            
	//  888oooo8    d88' `88b `888""8P `888P"Y88b  d88(  "8                            
	//  888    "    888ooo888  888      888   888  `"Y88b.                             
	//  888         888    .o  888      888   888  o.  )88b                            
	// o888o        `Y8bod8P' d888b    o888o o888o 8""888P'                            
	async generateFerns() {

		if ( ! this.ferns ) {

			this.ferns = new THREE.InstancedMesh(
				modelBank.fernModel.geometry,
				modelBank.fernModel.material,
				2500
			);

			scene.add( this.ferns );

		}

		let count = 0;
		for ( let x = - this.fernViewDistance; x <= this.fernViewDistance; x ++ ) {

			for ( let z = - this.fernViewDistance; z <= this.fernViewDistance; z ++ ) {

				const chunkCoord = { 
					x: ( player?.currentChunkCoord?.x || 0 ) + x, 
					z: ( player?.currentChunkCoord?.z || 0 ) + z, 
				};
				const chunk = this.chunks[ this.getChunkKey( chunkCoord ) ];

				if ( chunk ) {

					let fernMatrices = chunk.getFernMatrices();
					for ( let i = 0; i < fernMatrices.length; i ++, count ++ ) {

						this.ferns.setMatrixAt( count, fernMatrices[ i ] );

					}

				}

			}

		}

		this.ferns.count = Math.min( count, 2500 );
		this.ferns.instanceMatrix.needsUpdate = true;

	}


	//                                                                   .             
	//                                                                 .o8             
	//  .oooooooo  .ooooo.  ooo. .oo.    .ooooo.  oooo d8b  .oooo.   .o888oo  .ooooo.  
	// 888' `88b  d88' `88b `888P"Y88b  d88' `88b `888""8P `P  )88b    888   d88' `88b 
	// 888   888  888ooo888  888   888  888ooo888  888      .oP"888    888   888ooo888 
	// `88bod8P'  888    .o  888   888  888    .o  888     d8(  888    888 . 888    .o 
	// `8oooooo.  `Y8bod8P' o888o o888o `Y8bod8P' d888b    `Y888""8o   "888" `Y8bod8P' 
	// d"     YD                                                                       
	// "Y88888P'                                                                       
	                                                                                
	//  .o88o.                                                                         
	//  888 `"                                                                         
	// o888oo   .ooooo.   .oooooooo                                                    
	//  888    d88' `88b 888' `88b                                                     
	//  888    888   888 888   888                                                     
	//  888    888   888 `88bod8P'                                                     
	// o888o   `Y8bod8P' `8oooooo.                                                     
	//                   d"     YD                                                     
	//                   "Y88888P'                                                  
	generateFog(){
			
		if ( this.fogCloud ) {

            this.fogCloud.geometry.dispose();
            this.fogCloud.material.dispose();
			scene.remove( this.fogCloud );

		}

		let points = Object.keys( this.chunks ).map( key => this.chunks[ key ].getFogMatrices() ).flat();
		let fogGeo = new THREE.BufferGeometry().setFromPoints( points );
		let fogMat = new THREE.PointsMaterial({
			map: new THREE.TextureLoader().load('./resources/fog.png'),
			size: 500,
			transparent: true,
			opacity: 0.08,
			alphaTest: 0.015
		})
		fogMat.onBeforeCompile = ( shader ) => {
						
			shader.uniforms.time = { value: 0 };

			shader.vertexShader = 'uniform float time;\n' + 
				shader.vertexShader.replace(
					`#include <begin_vertex>`,
					`
					vec3 transformed = vec3( position );
					float r = rand( position.xz );

					if ( transformed.y > 0.5){
						transformed.x += sin( time * 0.008 * r ) * 250.0;
						transformed.y -= sin( time * 0.0013 * r) * 250.0;
						transformed.z += sin( time * 0.00734 * r) * 250.0;
					}
					`
				);

				fogMat.userData.shader = shader;

		};
		this.fogCloud = new THREE.Points( fogGeo, fogMat );		
		this.fogCloud.material.needsUpdate = true;
		scene.add( this.fogCloud );
	}

	//                                                                   .             
	//                                                                 .o8             
	//  .oooooooo  .ooooo.  ooo. .oo.    .ooooo.  oooo d8b  .oooo.   .o888oo  .ooooo.  
	// 888' `88b  d88' `88b `888P"Y88b  d88' `88b `888""8P `P  )88b    888   d88' `88b 
	// 888   888  888ooo888  888   888  888ooo888  888      .oP"888    888   888ooo888 
	// `88bod8P'  888    .o  888   888  888    .o  888     d8(  888    888 . 888    .o 
	// `8oooooo.  `Y8bod8P' o888o o888o `Y8bod8P' d888b    `Y888""8o   "888" `Y8bod8P' 
	// d"     YD                                                                       
	// "Y88888P'                                                                       
	                                                                                
	//     .                                                                           
	//   .o8                                                                           
	// .o888oo oooo d8b  .ooooo.   .ooooo.   .oooo.o                                   
	//   888   `888""8P d88' `88b d88' `88b d88(  "8                                   
	//   888    888     888ooo888 888ooo888 `"Y88b.                                    
	//   888 .  888     888    .o 888    .o o.  )88b                                   
	//   "888" d888b    `Y8bod8P' `Y8bod8P' 8""888P'                                
	async generateTrees() {

		if ( ! this.trees ) {

			this.trees = [
				new THREE.InstancedMesh(
					modelBank.treeModel.geometry,
					modelBank.treeModel.material,
					50000
				),
				new THREE.InstancedMesh(
					modelBank.treeModel1.geometry,
					modelBank.treeModel1.material,
					25000
				),
				new THREE.InstancedMesh( //high trunk
					modelBank.treeModelHigh.children[0].geometry,
					modelBank.treeModelHigh.children[0].material,
					1200
				),
				new THREE.InstancedMesh( //high leaves
					modelBank.treeModelHigh.children[1].geometry,
					modelBank.treeModelHigh.children[1].material,
					1200
				),
				new THREE.InstancedMesh( //high trunk2
					modelBank.treeModelHigh2.children[0].geometry,
					modelBank.treeModelHigh2.children[0].material,
					1200
				),
				new THREE.InstancedMesh( //high leaves2
					modelBank.treeModelHigh2.children[1].geometry,
					modelBank.treeModelHigh2.children[1].material,
					1200
				)
			];

			this.trees[0].material.alphaTest = 0.45;
			this.trees[0].material.needsUpdate = true;
            this.trees[0].material.blending = THREE.NoBlending;
			this.trees[0].material.needsUpdate = true;

			this.trees[1].material.alphaTest = 0.45;
			this.trees[1].material.needsUpdate = true;
            this.trees[1].material.blending = THREE.NoBlending;
			this.trees[1].material.needsUpdate = true;

			this.trees[3].material.alphaTest = 0.075;			
			this.trees[3].material.blending = THREE.NoBlending;
			this.trees[3].material.needsUpdate = true;

			this.trees[5].material.alphaTest = 0.075;
			this.trees[5].material.blending = THREE.NoBlending;
			this.trees[5].material.needsUpdate = true;
			
			this.trees[3].castShadow = true;
			this.trees[5].castShadow = true;

			scene.add( this.trees[0] );
			scene.add( this.trees[1] );
			scene.add( this.trees[2] );
			scene.add( this.trees[3] );
			scene.add( this.trees[4] );
			scene.add( this.trees[5] );

		}

		let t = new THREE.Matrix4();
		let count = [0,0,0,0];
		for ( let x = - this.treeViewDistance; x <= this.treeViewDistance; x ++ ) {

			for ( let z = - this.treeViewDistance; z <= this.treeViewDistance; z ++ ) {

				const chunkCoord = { 
					x: ( player?.currentChunkCoord?.x || 0 ) + x, 
					z: ( player?.currentChunkCoord?.z || 0 ) + z, 
				};
				const chunk = this.chunks[ this.getChunkKey( chunkCoord ) ];
				let playerPosition = ( x <= this.treeHighViewDistance && x >= -this.treeHighViewDistance) && ( z <= this.treeHighViewDistance && z >= -this.treeHighViewDistance );
                
				if ( chunk ) {

					let treeMatrices = chunk.getTreeMatrices();
					for(let m = 0; m < treeMatrices.length; m++){
						if ( !treeMatrices[ m ] ) continue;
						for ( let i = 0; i < treeMatrices[ m ].length; i ++, count[m] ++ ) {

							if ( playerPosition ){

								t.copy( treeMatrices[ m ][ i ] );                                
								t.scale( new THREE.Vector3( 0.056, 0.085, 0.065 ) );
								
								let nM = ( m==0 ) ? 2 : 4;
								this.trees[ nM ].setMatrixAt( count[m + 2], t );
								this.trees[ nM + 1 ].setMatrixAt( count[m + 2], t );
								count[m + 2]++								
								continue;
							}

                            t.copy( treeMatrices[ m ][ i ] );                                
							t.scale( new THREE.Vector3( 1.4, 1.4, 1.4 ) );
							this.trees[ m ].setMatrixAt( count[m], t );

						}
					}

				}

			}

		}
		
		this.trees[0].count = Math.min( count[0], 50000 );
		this.trees[1].count = Math.min( count[1], 25000 );
		this.trees[2].count = Math.min( count[2], 1200 );
		this.trees[3].count = Math.min( count[2], 1200 );
		this.trees[4].count = Math.min( count[3], 1200 );
		this.trees[5].count = Math.min( count[3], 1200 );

		this.trees[0].instanceMatrix.needsUpdate = true;		
		this.trees[1].instanceMatrix.needsUpdate = true;
		this.trees[2].instanceMatrix.needsUpdate = true;
		this.trees[3].instanceMatrix.needsUpdate = true;
		this.trees[4].instanceMatrix.needsUpdate = true;
		this.trees[5].instanceMatrix.needsUpdate = true;

	}
}
