class Chunk {

	constructor( x, z, parent, callback ) {

		//controller
		this.parent = parent;

		//offset coordinates
		this.offset = { x: x, z: z };
		this.chunkKey = getChunkKey( { x: this.offset.x, y: this.offset.z } );
		this.chunkOverlap = 2;
		this.noiseScale = 0.0045;
		this.lodLevel = 0;

		const playerChunk = ( player ) ? player.currentChunkCoord : { x: 0, y: 0 };

		if ( x > playerChunk.x - parent.chunkViewDistance && x < playerChunk.x + parent.chunkViewDistance &&
			z > playerChunk.y - parent.chunkViewDistance && z < playerChunk.y + parent.chunkViewDistance ) {

			this.lodLevel = 1;

		}

		//hd
		this.gridSize = {
			x: 32,
			y: 128, //200
			z: 32
		};
		this.gridScale = new THREE.Vector3(
			6,
			8,
			6
		);

		//terrain generation vars
		this.chunkSize = this.gridSize.x * this.gridScale.x;
		this.chunkPosition = new THREE.Vector3(
			this.offset.x * ( this.gridSize.x - this.chunkOverlap ) * this.gridScale.x,
			0,
			this.offset.z * ( this.gridSize.z - this.chunkOverlap ) * this.gridScale.z
		);
		this.terrainLowPoint = this.gridSize.y * 0.1;
		this.terrainHillRange = this.gridSize.y; //0.62
		this.terrainRockRange = this.gridSize.y * 0.25; //0.2
		this.upperTreeHeightLimit = this.gridSize.y * this.gridScale.y * 0.7;


		// the 3D array with the grid of values [ -1, 1 ].
		// initialize with -0.5, not filled. ( > 0 is solid )
		this.grid = new Float32Array( this.gridSize.x * this.gridSize.y * this.gridSize.z ).fill( - 0.5 );
		this.modelMatrices = {};
		this.terrainHeights = [];
		for ( let i = 0; i < this.gridSize.x; i ++ ) {

			this.terrainHeights.push( [] );

		}


		//initialize the grid
		this.initGrid();



		//the terrain mesh
		this.terrainMesh = null;
		this.terrainPlaneMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(
				this.chunkSize,
				this.chunkSize,
				this.gridSize.x,
				this.gridSize.z
			),
			new THREE.MeshLambertMaterial( { color: 'rgb(18, 44, 8)' } )
		);
		this.terrainPlaneMesh.geometry.rotateX( Math.PI * - 0.5 );

		const arr = this.terrainPlaneMesh.geometry.attributes.position.array;
		const count = this.terrainPlaneMesh.geometry.attributes.position.count;
		for ( let i = 0; i < count; i ++ ) {

			let x = Math.floor( ( ( arr[ i * 3 + 0 ] + this.chunkSize * 0.5 ) / this.chunkSize ) * ( this.gridSize.x - 1 ) );
			let z = Math.floor( ( ( arr[ i * 3 + 2 ] + this.chunkSize * 0.5 ) / this.chunkSize ) * ( this.gridSize.z - 1 ) );

			arr[ i * 3 + 1 ] = this.terrainHeights[ x ][ z ] * this.gridScale.y - 8;

		}

		this.terrainPlaneMesh.position.copy( this.chunkPosition );
		this.terrainPlaneMesh.position.x += this.chunkSize * 0.5;
		this.terrainPlaneMesh.position.z += this.chunkSize * 0.5;

		// generate the mesh and execute the callback
		this.generateMesh().then( ()=>{

			this.generateVegetation();
			this.generateCliffs();
			this.showLevel( this.lodLevel );
			callback( this );

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
			scene.remove( this.terrainPlaneMesh );
			if ( this.cliff ) this.terrainMesh.attach( this.cliff );

		} else {

			if ( this.terrainMesh ) scene.remove( this.terrainMesh );
			scene.add( this.terrainPlaneMesh );
			if ( this.cliff ) this.terrainPlaneMesh.attach( this.cliff );

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

		for ( var z = 0; z < this.gridSize.z; z ++ ) {

			for ( var x = 0; x < this.gridSize.x; x ++ ) {

				//low frequency noise
				let lowN = noise(
					5999754664 + ( x + this.offset.x * ( this.gridSize.x - 1 ) - this.offset.x ) * this.noiseScale,
					5999754664 + ( z + this.offset.z * ( this.gridSize.z - 1 ) - this.offset.z ) * this.noiseScale,
				);
				lowN *= lowN;

				//high frequency noise
				let highN = noise(
					5999755664 + ( x + this.offset.x * ( this.gridSize.x - 1 ) - this.offset.x ) * this.noiseScale * 5,
					5999755664 + ( z + this.offset.z * ( this.gridSize.z - 1 ) - this.offset.z ) * this.noiseScale * 5,
				);
				highN *= highN;

				//multiply with hill and rock range
				let terrainHeight = this.terrainLowPoint + this.terrainHillRange * lowN +
									this.terrainRockRange * highN * ( 0.5 + lowN );

				//extra peaks on mountains
				if ( terrainHeight > this.gridSize.y * 0.6 ) {

					let v = ( terrainHeight - this.gridSize.y * 0.6 ) / this.gridSize.y * 0.4;
					terrainHeight += v * this.terrainRockRange * 15 * ( highN * highN );

				}

				const smoothRange = 2;
				for ( var y = 0; y < terrainHeight + smoothRange; y ++ ) {

					//smooth the terrain, only under gridsizeY level 80%..
					let v = ( y > terrainHeight ) ? ( y - terrainHeight ) / smoothRange : 0;
					if ( terrainHeight > this.gridSize.y * 0.7 ) {

						v = ( y - terrainHeight );

					}
					if ( y >= this.gridSize.y - 1 ) v = - 1;

					
					this.setGridValue( x, y, z, 0.5 - v );

				}

				this.terrainHeights[ x ][ z ] = terrainHeight + smoothRange;

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
			this.parent.surfaceNetEngine.createSurface( this.grid, [ this.gridSize.x, this.gridSize.y, this.gridSize.z ] ).then( generatedSurface =>{

				//create new geometry
				const geo = new THREE.BufferGeometry();
				const vertices = []
                const indices = []
                const underground = [];

                let x, y, z, terrainHeight, smoothRange = 5;
				generatedSurface.vertices.map( v =>{

					vertices.push( v[ 0 ], v[ 1 ], v[ 2 ] );

                    x = round( v[0] );
                    y = v[1]
                    z = round( v[2] );
                    terrainHeight = this.terrainHeights[x][z];

                    if ( y < terrainHeight ) {
                        underground.push(( y > terrainHeight - smoothRange ) ? ( terrainHeight - y ) / smoothRange : 1);                            
                    } else {
                        underground.push(0);
                    }

				} );

				generatedSurface.faces.map( ( f )=>{

					indices.push( f[ 1 ], f[ 0 ], f[ 2 ] );
					indices.push( f[ 3 ], f[ 2 ], f[ 0 ] );

				} );

				geo.setIndex( indices );
				geo.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
				geo.setAttribute( 'force_stone', new THREE.Float32BufferAttribute( underground, 1 ) );

				//update new geometry and create a buffergeometry from it
				geo.computeVertexNormals();

				//remove old mesh
				this.remove();

				//create new mesh with preloaded material
				this.terrainMesh = new THREE.Mesh( geo, this.parent.terrainMaterial );
				this.terrainMesh.scale.set( this.gridScale.x, this.gridScale.y, this.gridScale.z );
				this.terrainMesh.chunk = this;
				this.terrainMesh.position.x = this.chunkPosition.x;
				this.terrainMesh.position.z = this.chunkPosition.z;
				this.terrainMesh.castShadow = true;
				this.terrainMesh.receiveShadow = true;
				this.terrainMesh.material.needsUpdate = true;

				this.terrainMesh.updateWorldMatrix();
				this.terrainMesh.matrixAutoUpdate = false;
				this.terrainMesh.name = "terrain";

				resolve();

			} );

		} );

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

	//                                                .                 .    o8o
	//                                              .o8               .o8    `"'
	// oooo    ooo  .ooooo.   .oooooooo  .ooooo.  .o888oo  .oooo.   .o888oo oooo   .ooooo.  ooo. .oo.
	//  `88.  .8'  d88' `88b 888' `88b  d88' `88b   888   `P  )88b    888   `888  d88' `88b `888P"Y88b
	//   `88..8'   888ooo888 888   888  888ooo888   888    .oP"888    888    888  888   888  888   888
	//    `888'    888    .o `88bod8P'  888    .o   888 . d8(  888    888 .  888  888   888  888   888
	//     `8'     `Y8bod8P' `8oooooo.  `Y8bod8P'   "888" `Y888""8o   "888" o888o `Y8bod8P' o888o o888o
	//                       d"     YD
	//                       "Y88888P'
	generateVegetation() {

		const surfaceSampler = new THREE.MeshSurfaceSampler( this.terrainMesh )
			.build();

		this.generateGrassMatrices( surfaceSampler );
		this.generateFernMatrices( surfaceSampler );
		this.generateTreeMatrices( );
		this.generateFogMatrices( );

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
	getGrassMatrices() {

		return this.modelMatrices[ 'grass' ];

	}

	generateGrassMatrices( surfaceSampler ) {

		const _position = new THREE.Vector3();
		const _normal = new THREE.Vector3();
		const dummy = new THREE.Object3D();
		dummy.rotation.order = "YXZ";

		this.modelMatrices[ 'grass' ] = [[], []];

		for ( let i = 0; i < 1500; i ++ ) {

			let d;
			do {

				surfaceSampler.sample( _position, _normal );
				d = 1.0 - scene.up.dot( _normal );

			} while ( d > 0.12 );

			dummy.scale.set(
				5 + Math.random(),
				1 + Math.random() * 0.5,
				5 + Math.random()
			);
			dummy.position
				.copy( this.chunkPosition )
				.add( _position.multiply( this.gridScale ) );
			dummy.quaternion.setFromUnitVectors( scene.up, _normal );
			dummy.rotateY( Math.random() * Math.PI );
			dummy.updateMatrix();

			const grassType = ( Math.random() < 0.875 ) ? 0 : 1;

			this.modelMatrices[ 'grass' ][ grassType ].push( dummy.matrix.clone() );

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

	//  .o88o.
	//  888 `"
	// o888oo   .ooooo.  oooo d8b ooo. .oo.    .oooo.o
	//  888    d88' `88b `888""8P `888P"Y88b  d88(  "8
	//  888    888ooo888  888      888   888  `"Y88b.
	//  888    888    .o  888      888   888  o.  )88b
	// o888o   `Y8bod8P' d888b    o888o o888o 8""888P'

	getFernMatrices() {

		return this.modelMatrices[ 'ferns' ];

	}

	generateFernMatrices( surfaceSampler ) {

		const _position = new THREE.Vector3();
		const _normal = new THREE.Vector3();
		const dummy = new THREE.Object3D();
		dummy.rotation.order = "YXZ";

		this.modelMatrices[ 'ferns' ] = [];

		for ( let i = 0; i < 20; i ++ ) {

			let d;
			do {

				surfaceSampler.sample( _position, _normal );
				d = 1.0 - scene.up.dot( _normal );

			} while ( d > 0.13 );

			dummy.scale.set(
				3 + Math.random(),
				2 + Math.random(),
				3 + Math.random()
			);
			dummy.position
				.copy( this.chunkPosition )
				.add( _position.multiply( this.gridScale ) );
			dummy.quaternion.setFromUnitVectors( scene.up, _normal );
			dummy.rotateY( Math.random() * Math.PI );
			dummy.updateMatrix();

			this.modelMatrices[ 'ferns' ].push( dummy.matrix.clone() );

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

	//     .
	//   .o8
	// .o888oo oooo d8b  .ooooo.   .ooooo.   .oooo.o
	//   888   `888""8P d88' `88b d88' `88b d88(  "8
	//   888    888     888ooo888 888ooo888 `"Y88b.
	//   888 .  888     888    .o 888    .o o.  )88b
	//   "888" d888b    `Y8bod8P' `Y8bod8P' 8""888P'


	getTreeMatrices() {

		return [ this.modelMatrices[ 'tree' ], this.modelMatrices[ 'tree1' ] ];

	}

	generateTreeMatrices( ) {

		if ( this.modelMatrices[ 'tree' ] ) return;

		const geo = this.terrainMesh.geometry;
		const dummy = new THREE.Object3D();

		const treeWorldNoiseScale = 0.005;
		const treeNarrowNoiseScale = 0.35;
		const v = new THREE.Vector3();
		const n = new THREE.Vector3();

		this.modelMatrices[ 'tree' ] = [];
		this.modelMatrices[ 'tree1' ] = [];

		for ( let i = 0; i < geo.attributes.position.array.length; i += 3 ) {

			v.set(
				geo.attributes.position.array[ i + 0 ],
				geo.attributes.position.array[ i + 1 ],
				geo.attributes.position.array[ i + 2 ]
			);
			n.set(
				geo.attributes.normal.array[ i + 0 ],
				geo.attributes.normal.array[ i + 1 ],
				geo.attributes.normal.array[ i + 2 ]
			);
			const d = 1.0 - scene.up.dot( n );

			let wp = v.clone()
				.multiply( this.gridScale )
				.add( this.chunkPosition );


			if ( wp.y < this.upperTreeHeightLimit ) {

				let worldNoise = noise(
					wp.x * treeWorldNoiseScale,
					wp.y * treeWorldNoiseScale,
					wp.z * treeWorldNoiseScale
				);

				if ( d < 0.1 && worldNoise > 0.4 ) {

					let narrowNoise = noise(
						wp.x * treeNarrowNoiseScale,
						wp.y * treeNarrowNoiseScale,
						wp.z * treeNarrowNoiseScale
					);

					if ( narrowNoise > 0.62 ) {

						dummy.rotation.y = Math.random() * Math.PI;
						dummy.rotation.x = Math.random() * 0.14 - 0.07;
						dummy.rotation.z = Math.random() * 0.14 - 0.07;

						let s = Math.random() * 10 + 20;
						dummy.scale.x = s;
						dummy.scale.y = s;
						dummy.scale.z = s;

						dummy.position.copy( wp );
						dummy.updateMatrix();

						if ( worldNoise < 0.55 ) {

							this.modelMatrices[ 'tree' ].push( dummy.matrix.clone() );

						} else {

							this.modelMatrices[ 'tree1' ].push( dummy.matrix.clone() );

						}


					}

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

	//  .o88o.
	//  888 `"
	// o888oo   .ooooo.   .oooooooo
	//  888    d88' `88b 888' `88b
	//  888    888   888 888   888
	//  888    888   888 `88bod8P'
	// o888o   `Y8bod8P' `8oooooo.
	//                   d"     YD
	//                   "Y88888P'

	getFogMatrices() {

		return this.modelMatrices[ 'fog' ] || [];

	}
	generateFogMatrices() {

		if ( this.modelMatrices[ 'fog' ] ) return;

		const geo = this.terrainMesh.geometry.attributes.position;
		const dummy = new THREE.Vector3();

		this.modelMatrices[ 'fog' ] = [];
		let r = Math.floor( Math.random() * 2 );

		for ( let i = 0; i < r; i ++ ) {

			let r = Math.floor( Math.random() * geo.count ) * 3;
			dummy.set(
				geo.array[ r + 0 ],
				geo.array[ r + 1 ] + 20,
				geo.array[ r + 2 ],
			);
			dummy.multiply( this.gridScale );
			dummy.add( this.chunkPosition );

			this.modelMatrices[ 'fog' ].push( dummy.clone() );

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

	//           oooo   o8o   .o88o.  .o88o.
	//           `888   `"'   888 `"  888 `"
	//  .ooooo.   888  oooo  o888oo  o888oo   .oooo.o
	// d88' `"Y8  888  `888   888     888    d88(  "8
	// 888        888   888   888     888    `"Y88b.
	// 888   .o8  888   888   888     888    o.  )88b
	// `Y8bod8P' o888o o888o o888o   o888o   8""888P'
	generateCliffs() {

		if ( this.cliff ) {

			// this.terrainMesh.add( this.cliff );
			return;

		}

		const geo = this.terrainMesh.geometry;
		const v = new THREE.Vector3();
		const n = new THREE.Vector3();
		let placedVerts = [];

		// check each vertex
		for ( let i = 0; i < geo.attributes.position.array.length; i += 3 ) {

			v.set(
				geo.attributes.position.array[ i + 0 ],
				geo.attributes.position.array[ i + 1 ],
				geo.attributes.position.array[ i + 2 ]
			);
			n.set(
				geo.attributes.normal.array[ i + 0 ],
				geo.attributes.normal.array[ i + 1 ],
				geo.attributes.normal.array[ i + 2 ]
			);
			const d = 1.0 - scene.up.dot( n );

			//check to see if slope is steep enough
			//check to see if not underground
			if ( d > 0.20 && v.y < this.terrainHeights[ Math.floor( v.x ) ][ Math.floor( v.z ) ] ) {

				placedVerts.push( { v: v.clone(), n: n.clone() } );

			}

		}

		//first, randomize verts
		placedVerts = placedVerts.sort( ()=> ( Math.random() > 0.5 ) ? 1 : - 1 );

		//group verts
		let chunked = [];

		for ( let vert of placedVerts ) {

			let found = false;
			for ( let i = 0; i < chunked.length; i ++ ) {

				let c = chunked[ i ].filter( c=>{

					let v1 = vert.v.clone();
					let v2 = c.v.clone();
					return ( v1.distanceToSquared( v2 ) <= 3.5 );

				} );

				if ( c.length > 0 ) {

					chunked[ i ].push( vert );
					found = true;
					break;

				}

			}

			if ( ! found ) {

				chunked.push( [ vert ] );

			}

		}

		//add extra verts to make it a 3d shape
		chunked.map( ( chunk, index ) =>{

			const verts = [];
			const c = new THREE.Vector3();
			const n = new THREE.Vector3();

			for ( let vert of chunk ) {

				let revN = vert.n.clone().multiplyScalar( - 1 )
					.add(
						new THREE.Vector3().random().subScalar( 0.5 ).multiplyScalar( 1 + Math.random() )
					);
				verts.push( vert.v.clone().add( revN ) );

				let rV = vert.n.clone()
					.multiplyScalar( 0.1 + Math.random() * 0.6 )
					.add(
						new THREE.Vector3().random().subScalar( 0.5 ).multiplyScalar( Math.random() )
					);

				verts.push( vert.v.clone().add( rV ) );
				c.add( vert.v );
				n.add( vert.n );

			}

			c.divideScalar( chunk.length );
			n.divideScalar( chunk.length );
			chunked[ index ] = { verts: verts, center: c, normal: n };

		} );

		//convert the groups into rock meshes
		let d = new THREE.Object3D();
		let geometries = [];
		chunked.map( verts => {

			if ( verts.verts.length > 6 ) {

				new THREE.Box3().setFromPoints( verts.verts ).getSize( d.scale );

				d.quaternion.setFromUnitVectors( scene.up, verts.normal );
				d.rotateY( Math.random() * Math.PI );
				if ( Math.random() > 0.6 ) d.rotateX( Math.PI );

				d.position.copy( verts.center );
				d.updateMatrix();

				let r = Math.floor( Math.random() * 4 );
				let rock = modelBank.rocks.children[ r ].geometry.clone();
				rock.applyMatrix4( d.matrix );

				geometries.push( rock );


			}

		} );

		//merge all cliff parts together
		let cliffGeo = THREE.BufferGeometryUtils.mergeBufferGeometries( geometries, true );
		if ( cliffGeo ) {

			this.cliff = new THREE.Mesh( cliffGeo, [
				modelBank.rocks.children[ 0 ].material,
				modelBank.rocks.children[ 1 ].material,
				modelBank.rocks.children[ 2 ].material,
				modelBank.rocks.children[ 3 ].material
			] );
			this.terrainMesh.add( this.cliff );

		}


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
			this.parent.updateChunks[ this.chunkKey ] = true;

			this.adjustVegetation( center, radius );

			// if the player clicks near a chunk edge, make sure to
			// check the neighbors for terrain adjusting
			if ( checkNeighbors ) this.adjustNeighbors( center, radius, val );

			resolve();

		} );

	}



	adjustVegetation( center, radius ) {

		const worldCenter = this.chunkPosition.clone().add( center.clone().multiply( this.gridScale ) );
		const p = new THREE.Vector3();

		function checkMatrices( matrices ) {

			return matrices.filter( matrix =>{

				p.setFromMatrixPosition( matrix );
				return ( p.distanceToSquared( worldCenter ) > radius * radius * 10 );

			} );

		}

		this.modelMatrices[ 'ferns' ] = checkMatrices( this.modelMatrices[ 'ferns' ] );
		this.modelMatrices[ 'grass' ][ 0 ] = checkMatrices( this.modelMatrices[ 'grass' ][ 0 ] );
		this.modelMatrices[ 'grass' ][ 1 ] = checkMatrices( this.modelMatrices[ 'grass' ][ 1 ] );
		this.modelMatrices[ 'tree' ] = checkMatrices( this.modelMatrices[ 'tree' ] );
		this.modelMatrices[ 'tree1' ] = checkMatrices( this.modelMatrices[ 'tree1' ] );

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
			nCenter.x += this.gridSize.x - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		} else if ( this.gridSize.x - center.x < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - this.gridSize.x + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}

		//z-axis
		if ( center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.z += this.gridSize.z - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );


		} else if ( this.gridSize.z - center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.z = nCenter.z - this.gridSize.z + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}

		//diagonals
		if ( center.x < radius && center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.x += this.gridSize.x - this.chunkOverlap;
			nCenter.z += this.gridSize.z - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( this.gridSize.x - center.x < radius && this.gridSize.z - center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - this.gridSize.x + this.chunkOverlap;
			nCenter.z = nCenter.z - this.gridSize.z + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( center.x < radius && this.gridSize.x - center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x - 1, y: this.offset.z + 1 } );
			let nCenter = center.clone();
			nCenter.x += this.gridSize.x - this.chunkOverlap;
			nCenter.z = nCenter.z - this.gridSize.z + this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

		}
		if ( this.gridSize.x - center.x < radius && center.z < radius ) {

			let nChunk = getChunkKey( { x: this.offset.x + 1, y: this.offset.z - 1 } );
			let nCenter = center.clone();
			nCenter.x = nCenter.x - this.gridSize.x + this.chunkOverlap;
			nCenter.z += this.gridSize.z - this.chunkOverlap;
			this.parent.chunks[ nChunk ].adjust( nCenter, radius, val );

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
	setGridValue( x, y, z, val ) {

		let gridOffset = this.gridIndex( x, y, z );
		this.grid[ gridOffset ] = val;

	}

	//convert 3d coordinate into 1D index.
	gridIndex( x, y, z ) {

		return ( ( z * ( this.gridSize.x * this.gridSize.y ) ) + ( y * this.gridSize.z ) + x );

	}

	//check if coordinate is inside grid
	isInsideGrid( coord ) {

		return ( coord.x >= 0 && coord.x < this.gridSize.x &&
			coord.y > 0 && coord.y < this.gridSize.y - 1 &&
			coord.z >= 0 && coord.z < this.gridSize.z );

	}

	remove() {

		if ( this.terrainMesh ) {
            this.terrainMesh.geometry.dispose();
            scene.remove( this.terrainMesh );
        }

	}

}
