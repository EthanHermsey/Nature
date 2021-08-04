class Chunk {

	constructor( x, z, callback ) {

		//offset coordinates
		this.offset = { x: x, z: z };
		this.chunkKey = getChunkKey( { x: this.offset.x, y: this.offset.z } );

		//terrain generation vars
		this.chunkOverlap = 2;
		this.noiseScale = 0.006;
		this.terrainLowPoint = gridSizeY * 0.2;
		this.terrainHillRange = gridSizeY;
		this.terrainRockRange = gridSizeY * 0.2;

		// the 3D array with the grid of values [ -1, 1 ].
		// initialize with -0.5, not filled. ( > 0 is solid )
		this.grid = new Float32Array( gridSize * gridSizeY * gridSize ).fill( - 0.5 );

		//the terrain mesh
		this.terrainMesh;

		//initialize the grid
		this.initGrid();

		//generate the mesh and execute the callback
		this.generateMesh().then( callback() );

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

			this.generateMesh();

			resolve();

		} );

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

		for ( var z = 0; z < gridSize; z ++ ) {

			for ( var x = 0; x < gridSize; x ++ ) {

				//low frequency noise
				let lowN = noise(
					5999754664 + ( x + this.offset.x * ( gridSize - 1 ) - this.offset.x ) * this.noiseScale,
					5999754664 + ( z + this.offset.z * ( gridSize - 1 ) - this.offset.z ) * this.noiseScale,
				);
				lowN *= lowN;

				//high frequency noise
				let highN = noise(
					5999754664 + ( x + this.offset.x * ( gridSize - 1 ) - this.offset.x ) * this.noiseScale * 6,
					5999754664 + ( z + this.offset.z * ( gridSize - 1 ) - this.offset.z ) * this.noiseScale * 6,
				);
				highN *= highN;

				//multiply with hill and rock range
				let terrainHeight = this.terrainLowPoint + this.terrainHillRange * lowN + this.terrainRockRange * highN;
				if ( terrainHeight > gridSizeY * 0.6 ) {

					let v = ( terrainHeight - gridSizeY * 0.6 ) / gridSizeY * 0.4;
					terrainHeight += v * this.terrainRockRange * ( highN * highN );

				}

				const smoothRange = 2;
				for ( var y = 0; y < terrainHeight + smoothRange; y ++ ) {

					let v = ( y > terrainHeight ) ? ( y - terrainHeight ) / smoothRange : 0;
					this.setValueToGrid( x, y, z, 0.5 - v );

				}

			}

		}

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
			surfaceNetEngine.createSurface( this.grid, [ gridSize, gridSizeY, gridSize ] ).then( generatedSurface =>{

				//create new geometry
				let geo = new THREE.Geometry();
				geo.faceVertexUvs[ 0 ] = [];


				generatedSurface.vertices.forEach( v=>{

					//copy all the vertices
					geo.vertices.push( new THREE.Vector3().fromArray( v ) );

				} );

				generatedSurface.faces.forEach( ( f )=>{

					//copy faces. 2 faces per square
					let f1 = new THREE.Face3( f[ 1 ], f[ 0 ], f[ 2 ] );
					let f2 = new THREE.Face3( f[ 3 ], f[ 2 ], f[ 0 ] );
					geo.faces.push( f1 );
					geo.faces.push( f2 );

					//generate simple uv's for texturing later on
					geo.faceVertexUvs[ 0 ].push( [
						new THREE.Vector2( 0, 1 ),
						new THREE.Vector2( 1, 1 ),
						new THREE.Vector2( 0, 0 )
					] );
					geo.faceVertexUvs[ 0 ].push( [
						new THREE.Vector2( 0, 0 ),
						new THREE.Vector2( 1, 1 ),
						new THREE.Vector2( 1, 0 )
					] );

				} );

				//update new geometry and create a buffergeometry from it
				geo.uvsNeedUpdate = true;
				geo.computeVertexNormals();
				geo = new THREE.BufferGeometry().fromGeometry( geo );

				//remove old mesh
				if ( this.terrainMesh ) scene.remove( this.terrainMesh );

				//create new mesh with preloaded material
				this.terrainMesh = new THREE.Mesh( geo, whiteMaterial );
				this.terrainMesh.scale.setScalar( gridScale );
				this.terrainMesh.chunk = this;
				this.terrainMesh.position.x += this.offset.x * ( gridSize - this.chunkOverlap ) * gridScale;
				this.terrainMesh.position.z += this.offset.z * ( gridSize - this.chunkOverlap ) * gridScale;

				this.terrainMesh.updateWorldMatrix();
				this.terrainMesh.matrixAutoUpdate = false;
				scene.add( this.terrainMesh );

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
	//                                      oooo
	//                                      `888
	// ooo. .oo.  .oo.    .ooooo.   .oooo.o  888 .oo.
	// `888P"Y88bP"Y88b  d88' `88b d88(  "8  888P"Y88b
	//  888   888   888  888ooo888 `"Y88b.   888   888
	//  888   888   888  888    .o o.  )88b  888   888
	// o888o o888o o888o `Y8bod8P' 8""888P' o888o o888o



	adjust( center, radius, val, checkNeighbors ) {

		return new Promise( resolve=>{

			//square loop around a sphere brush
			let loopRadius = floor( radius * PI );

			for ( let y = - loopRadius; y <= loopRadius; y ++ ) {

				for ( let z = - loopRadius; z <= loopRadius; z ++ ) {

					for ( let x = - loopRadius; x <= loopRadius; x ++ ) {

						//if within radius, add value to grid
						let d = x * x + y * y + z * z;
						if ( d < radius ) {

							//grid position in sphere around center (x y and z go from -looprad to +looprad)
							let newPosition = new THREE.Vector3( x, y, z ).add( center );

							if ( this.isInsideGrid( newPosition ) ) {

								//if not lower that 0 or height that gridsize, add value
								this.addValueToGrid( newPosition.x, newPosition.y, newPosition.z, val );

							}

						}

					}

				}

			}

			//put this chunk in the list of chunk that need updates
			updateChunks[ this.chunkKey ] = true;

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
		if ( center.x < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z } );
			let nCenter = center.clone();
			nCenter.x += gridSize - this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		} else if ( gridSize - center.x < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - gridSize + this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		}

		//z-axis
		if ( center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.z += gridSize - this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );


		} else if ( gridSize - center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.z = nCenter.z - gridSize + this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		}

		//diagonals
		if ( center.x < radius && center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.x += gridSize - this.chunkOverlap;
			nCenter.z += gridSize - this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( gridSize - center.x < radius && gridSize - center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - gridSize + this.chunkOverlap;
			nCenter.z = nCenter.z - gridSize + this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( center.x < radius && gridSize - center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.x += gridSize - this.chunkOverlap;
			nCenter.z = nCenter.z - gridSize + this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( gridSize - center.x < radius && center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - gridSize + this.chunkOverlap;
			nCenter.z += gridSize - this.chunkOverlap;
			chunks[ nChunk ].adjust( nCenter, radius, val );

		}

	}




	//  o8o                                                      .                             .
	//  `"'                                                    .o8                           .o8
	// oooo  ooo. .oo.  .oo.   oo.ooooo.   .ooooo.  oooo d8b .o888oo  .oooo.   ooo. .oo.   .o888oo
	// `888  `888P"Y88bP"Y88b   888' `88b d88' `88b `888""8P   888   `P  )88b  `888P"Y88b    888
	//  888   888   888   888   888   888 888   888  888       888    .oP"888   888   888    888
	//  888   888   888   888   888   888 888   888  888       888 . d8(  888   888   888    888 .
	// o888o o888o o888o o888o  888bod8P' `Y8bod8P' d888b      "888" `Y888""8o o888o o888o   "888"
	//                          888
	//                         o888o

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
	setValueToGrid( x, y, z, val ) {

		let gridOffset = this.gridIndex( x, y, z );
		this.grid[ gridOffset ] = val;

	}

	//convert 3d coordinate into 1D index.
	gridIndex( x, y, z ) {

		return ( ( z * ( gridSize * gridSizeY ) ) + ( y * gridSize ) + x );

	}

	//check if coordinate is inside grid
	isInsideGrid( coord ) {

		return ( coord.x >= 0 && coord.x < gridSize &&
			coord.y > 0 && coord.y < gridSizeY - 1 &&
			coord.z >= 0 && coord.z < gridSize );

	}

}
