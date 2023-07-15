class VolumetricChunk{

    constructor( x, z, parent, callback ) {

		//controller
		this.parent = parent;

		//offset coordinates
		this.offset = { x: x, z: z };
		this.chunkKey = getChunkKey( { x: this.offset.x, y: this.offset.z } );
		this.chunkOverlap = 2;
		this.noiseScale = 0.0045;
		this.lodLevel = 0;

		//terrain generation vars
		this.chunkSize = gridSize.x * gridScale.x;
		this.chunkPosition = new THREE.Vector3(
			this.offset.x * ( gridSize.x - this.chunkOverlap ) * gridScale.x,
			0,
			this.offset.z * ( gridSize.z - this.chunkOverlap ) * gridScale.z
		);
		this.upperTreeHeightLimit = gridSize.y * gridScale.y * 0.7;


		this.modelMatrices = {};
		this.grid;
        this.terrainHeights;
		
		//initialize the grid
		this.initGrid()
            .then( () => {
                this.generateMesh().then( ()=>{

                    this.generateVegetation();
                    this.showLevel( this.lodLevel );
                    callback( this );
        
                } );
            });		

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

		return new Promise( resolve=>{

			// update was called because it was put in the update-chunk list,
			// the terrain was adjusted by player.
			this.generateMesh().then( ()=>{

                this.showLevel( this.lodLevel );

				resolve();

			} );

		} );

	}

	showLevel( level ) {


		this.lodLevel = level;

		if ( this.lodLevel == 1 ) {

			if ( this.terrainMesh ) scene.add( this.terrainMesh );
			scene.remove( this.terrainTopMesh );

		} else {

			if ( this.terrainMesh ) scene.remove( this.terrainMesh );
			if ( this.terrainTopMesh ) scene.add( this.terrainTopMesh );

		}


	}



	//  o8o               o8o      .
	//  `"'               `"'    .o8
	// oooo  ooo. .oo.   oooo  .o888oo
	// `888  `888P"Y88b  `888    888
	//  888   888   888   888    888
	//  888   888   888   888    888 .
	// o888o o888o o888o o888o   "888"



	//                      o8o        .o8
	//                      `"'       "888
	//  .oooooooo oooo d8b oooo   .oooo888
	// 888' `88b  `888""8P `888  d88' `888
	// 888   888   888      888  888   888
	// `88bod8P'   888      888  888   888
	// `8oooooo.  d888b    o888o `Y8bod88P"
	// d"     YD
	// "Y88888P'


    initGrid() {

        return new Promise( resolve => {

            chunkController.workerBank.work({offset: this.offset, gridSize: chunkController.gridSize}, ( { data } ) => {

                this.grid = data.grid;
                this.terrainHeights = data.terrainHeights;
                resolve();
    
            })

            
        })

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

	//                                      oooo
	//                                      `888
	// ooo. .oo.  .oo.    .ooooo.   .oooo.o  888 .oo.
	// `888P"Y88bP"Y88b  d88' `88b d88(  "8  888P"Y88b
	//  888   888   888  888ooo888 `"Y88b.   888   888
	//  888   888   888  888    .o o.  )88b  888   888
	// o888o o888o o888o `Y8bod8P' 8""888P' o888o o888o

	generateMesh() {

		return new Promise( resolve =>{

			//pass in the 3D grid and the dimensions (x, y, z).
			this.parent.surfaceNetEngine.createSurface( this.grid, [ gridSize.x, gridSize.y, gridSize.z ] ).then( generatedSurface => {

				//create new geometry
				const geo = new THREE.BufferGeometry();
				const vertices = []
                const indices = []
                const underground = [];

                //top geomtery
                const topvertmap = {};                
                const topgeo = new THREE.BufferGeometry();
				const topvertices = []
                const topindices = []

                let x, y, z, terrainHeight, smoothRange = 2;
                for(let vIndex = 0; vIndex < generatedSurface.vertices.length; vIndex++){

                    const v = generatedSurface.vertices[vIndex];
					vertices.push( v[ 0 ], v[ 1 ], v[ 2 ] );

                    x = round( v[0] );
                    y = v[1]
                    z = round( v[2] );
                    terrainHeight = this.terrainHeights[x][z];

                    if ( y < terrainHeight ) {
                        underground.push(( y > terrainHeight - smoothRange ) ? ( terrainHeight - y ) / smoothRange : 1);
                    } else {
                        underground.push(0);
                        topvertmap[ vIndex ] = true;
                    }

				};

                const topverts = Object.keys(topvertmap);                

				for(let i = 0; i < generatedSurface.faces.length; i++){

                    const f = generatedSurface.faces[i];

					indices.push( f[ 1 ], f[ 0 ], f[ 2 ] );
					indices.push( f[ 3 ], f[ 2 ], f[ 0 ] );

                    //per face, check if any vertex is higher than terrainheight  * 0.95
                    //add to topmesh
                    if ( topvertmap[ f[ 0 ] ] && topvertmap[ f[ 1 ] ] && topvertmap[ f[ 2 ] ] && topvertmap[ f[ 3 ] ] ){

                        const i0 = topverts.indexOf( `${f[ 0 ]}` );
                        const i1 = topverts.indexOf( `${f[ 1 ]}` );
                        const i2 = topverts.indexOf( `${f[ 2 ]}` );
                        const i3 = topverts.indexOf( `${f[ 3 ]}` );

                        topindices.push( i1, i0, i2 );
                        topindices.push( i3, i2, i0 );

                    }

				};

                for(let i = 0; i < topverts.length; i++){
                    const v = generatedSurface.vertices[ i ];
                    topvertices.push( v[ 0 ], v[ 1 ], v[ 2 ] )
                }

				geo.setIndex( indices );
				geo.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
				geo.setAttribute( 'force_stone', new THREE.Float32BufferAttribute( underground, 1 ) );				
				geo.computeVertexNormals();
                geo.computeBoundsTree = computeBoundsTree;
                geo.disposeBoundsTree = disposeBoundsTree;
                geo.computeBoundsTree();


                topgeo.setIndex( topindices );
				topgeo.setAttribute( 'position', new THREE.Float32BufferAttribute( topvertices, 3 ) );				
				topgeo.computeVertexNormals();

				//remove old mesh
				this.remove();

				//create new mesh with preloaded material
				this.terrainMesh = new THREE.Mesh( geo, this.parent.terrainMaterial );
				this.terrainMesh.scale.set( gridScale.x, gridScale.y, gridScale.z );
                this.terrainMesh.raycast = acceleratedRaycast;
				this.terrainMesh.chunk = this;
				this.terrainMesh.position.x = this.chunkPosition.x;
				this.terrainMesh.position.z = this.chunkPosition.z;
				this.terrainMesh.castShadow = true;
				this.terrainMesh.receiveShadow = true;
				this.terrainMesh.material.needsUpdate = true;

				this.terrainMesh.updateWorldMatrix();
				this.terrainMesh.matrixAutoUpdate = false;
				this.terrainMesh.name = "terrain";

                this.terrainTopMesh = new THREE.Mesh( topgeo, this.parent.terrainMaterial );
				this.terrainTopMesh.scale.set( gridScale.x, gridScale.y, gridScale.z );
				this.terrainTopMesh.position.x = this.chunkPosition.x;
				this.terrainTopMesh.position.z = this.chunkPosition.z;

				this.terrainTopMesh.updateWorldMatrix();
				this.terrainTopMesh.matrixAutoUpdate = false;
				this.terrainTopMesh.name = "terrainTop";

				resolve();

			} );

		} );

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
	//                      o8o        .o8
	//                      `"'       "888
	//  .oooooooo oooo d8b oooo   .oooo888
	// 888' `88b  `888""8P `888  d88' `888
	// 888   888   888      888  888   888
	// `88bod8P'   888      888  888   888
	// `8oooooo.  d888b    o888o `Y8bod88P"
	// d"     YD
	// "Y88888P'




	adjust( center, radius, val, checkNeighbors ) {

		return new Promise( resolve => {

			//square loop around a sphere brush
			let loopRadius = radius;

			for ( let y = - loopRadius; y <= loopRadius; y ++ ) {

				for ( let z = - loopRadius; z <= loopRadius; z ++ ) {

					for ( let x = - loopRadius; x <= loopRadius; x ++ ) {

						//if within radius, add value to grid
						let d = x * x + y * y + z * z;
						if ( d < radius ) {

                            let p = map(d, 0, radius * 0.8, 1, 0, true);

							//grid position in sphere around center (x y and z go from -looprad to +looprad)
							let newPosition = new THREE.Vector3( x, y, z ).add( center );

							if ( this.isInsideGrid( newPosition ) ) {

								//if not lower that 0 or height that gridsize, add value
								this.addValueToGrid( newPosition.x, newPosition.y, newPosition.z, val * p );

							}

						}

					}

				}

			}

			//put this chunk in the list of chunk that need updates
			this.parent.updateChunks[ this.chunkKey ] = true;

			this.adjustVegetation( center, radius );

			// if the player clicks near a chunk edge, make sure to
			// check the neighbors for terrain adjusting
			if ( checkNeighbors ) this.adjustNeighbors( center, radius, val );

			resolve();

		} );

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
	//                        o8o             oooo         .o8
	//                        `"'             `888        "888
	// ooo. .oo.    .ooooo.  oooo   .oooooooo  888 .oo.    888oooo.   .ooooo.  oooo d8b  .oooo.o
	// `888P"Y88b  d88' `88b `888  888' `88b   888P"Y88b   d88' `88b d88' `88b `888""8P d88(  "8
	//  888   888  888ooo888  888  888   888   888   888   888   888 888   888  888     `"Y88b.
	//  888   888  888    .o  888  `88bod8P'   888   888   888   888 888   888  888     o.  )88b
	// o888o o888o `Y8bod8P' o888o `8oooooo.  o888o o888o  `Y8bod8P' `Y8bod8P' d888b    8""888P'
	//                             d"     YD
	//                             "Y88888P'


	adjustNeighbors( center, radius, val ) {

		//x-axis
		if ( center.x <= radius) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z } );
			let nCenter = center.clone();
			nCenter.x += gridSize.x - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		} else if ( gridSize.x - center.x <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - gridSize.x + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}

		//z-axis
		if ( center.z <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.z += gridSize.z - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );


		} else if ( gridSize.z - center.z <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.z = nCenter.z - gridSize.z + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}

		//diagonals
		if ( center.x < radius && center.z <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.x += gridSize.x - this.chunkOverlap;
			nCenter.z += gridSize.z - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( gridSize.x - center.x < radius && gridSize.z - center.z <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - gridSize.x + this.chunkOverlap;
			nCenter.z = nCenter.z - gridSize.z + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( center.x < radius && gridSize.x - center.z <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.x += gridSize.x - this.chunkOverlap;
			nCenter.z = nCenter.z - gridSize.z + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( gridSize.x - center.x < radius && center.z <= radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - gridSize.x + this.chunkOverlap;
			nCenter.z += gridSize.z - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}

	}


	//  .o88o.                                       .    o8o
	//  888 `"                                     .o8    `"'
	// o888oo  oooo  oooo  ooo. .oo.    .ooooo.  .o888oo oooo   .ooooo.  ooo. .oo.    .oooo.o
	//  888    `888  `888  `888P"Y88b  d88' `"Y8   888   `888  d88' `88b `888P"Y88b  d88(  "8
	//  888     888   888   888   888  888         888    888  888   888  888   888  `"Y88b.
	//  888     888   888   888   888  888   .o8   888 .  888  888   888  888   888  o.  )88b
	// o888o    `V88V"V8P' o888o o888o `Y8bod8P'   "888" o888o `Y8bod8P' o888o o888o 8""888P'



	//add a value to the grid on coordinate xyz
	addValueToGrid( x, y, z, val ) {

		let gridOffset = this.gridIndex( x, y, z );
		this.grid[ gridOffset ] = constrain( this.grid[ gridOffset ] + val, - 0.5, 0.5 );

	}

	//set value of the grid (used in initialization)
	setGridValue( x, y, z, val ) {

		let gridOffset = this.gridIndex( x, y, z );
		this.grid[ gridOffset ] = val;

	}

	//convert 3d coordinate into 1D index.
	gridIndex( x, y, z ) {

		return ( ( z * ( gridSize.x * gridSize.y ) ) + ( y * gridSize.z ) + x );

	}

	//check if coordinate is inside grid
	isInsideGrid( coord ) {

		return ( coord.x >= 0 && coord.x < gridSize.x &&
			coord.y > 0 && coord.y < gridSize.y - 1 &&
			coord.z >= 0 && coord.z < gridSize.z );

	}

	remove() {

		if ( this.terrainMesh ) {
            this.terrainMesh.geometry.dispose();
            scene.remove( this.terrainMesh );
            this.terrainMesh = undefined;
        }
        
        if ( this.terrainTopMesh ){
            this.terrainTopMesh.geometry.dispose();
            scene.remove( this.terrainTopMesh );
            this.terrainTopMesh = undefined;
        }

	}
}