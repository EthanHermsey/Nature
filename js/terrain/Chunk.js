class Chunk extends VolumetricChunk{

    constructor(...args){
        
        super(...args);
        
        this.lodLevel = 0;
		this.modelMatrices = {};
        this.upperTreeHeightLimit = this.terrain.gridSize.y * this.terrain.gridScale.y * 0.7;
        this.firstRender = true;
                
    }

    getTerrainHeight(x, z){
        return this.terrainHeights[ z * this.terrain.gridSize.x + x];
    }

	async generateMesh() {

		await super.generateMesh();
        this.showLevel();
        if ( this.firstRender ){
            this.generateVegetation();
            this.firstRender = false;
        }
        
	}

    showLevel( level ) {

        if ( level ) this.lodLevel = level;

		if ( this.lodLevel == 1 ) {

			if ( this.mesh ) this.terrain.add( this.mesh );
            if ( this.farMesh ) this.terrain.remove( this.farMesh );

		} else {
            
			if ( this.mesh ) this.terrain.remove( this.mesh );
			if ( this.farMesh ) this.terrain.add( this.farMesh );

		}

	}

    async adjust( center, radius, val, checkNeighbors ) {
        super.adjust( center, radius, val, checkNeighbors );
        this.adjustVegetation( center, radius );
    }

    adjustVegetation( center, radius ) {

		const worldCenter = this.position.clone().add( center.clone().multiply( this.terrain.gridScale ) );
		const p = new THREE.Vector3();
        let changes = false;

		function checkMatrices( matrices ) {

			return matrices.filter( matrix =>{

				p.setFromMatrixPosition( matrix );
                const keep = ( p.distanceToSquared( worldCenter ) > radius * radius * 25 );
                if ( !keep ) changes = true;
				return keep;

			} );

		}

		this.modelMatrices[ 'ferns' ] = checkMatrices( this.modelMatrices[ 'ferns' ] );
		this.modelMatrices[ 'grass' ][ 0 ] = checkMatrices( this.modelMatrices[ 'grass' ][ 0 ] );
		this.modelMatrices[ 'grass' ][ 1 ] = checkMatrices( this.modelMatrices[ 'grass' ][ 1 ] );
		this.modelMatrices[ 'tree' ] = checkMatrices( this.modelMatrices[ 'tree' ] );
		this.modelMatrices[ 'tree1' ] = checkMatrices( this.modelMatrices[ 'tree1' ] );

        if ( changes ) this.terrain.generateInstancedObjects();
	}

    dispose() {

		if ( this.mesh ) {
            this.mesh.geometry.dispose();
            this.terrain.remove( this.mesh );
            this.mesh = undefined;
        }

        if ( this.farMesh ) {
            this.farMesh.geometry.dispose();
            this.terrain.remove( this.farMesh );
            this.farMesh = undefined;
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

        return new Promise( resolve => {

            const mesh = this.mesh;
            const surfaceSampler = new THREE.MeshSurfaceSampler( mesh )
                .build();
    
            this.generateGrassMatrices( surfaceSampler );
            this.generateFernMatrices( surfaceSampler );
            this.generateTreeMatrices( mesh );
            this.generateFogMatrices( mesh );
            this.generateCliffs( mesh );

            resolve();
            
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

		for ( let i = 0; i < 500; i ++ ) {

			let d, terrainHeight;
            let tries = 50;
			do {
                surfaceSampler.sample( _position, _normal );
				d = 1.0 - scene.up.dot( _normal );
                terrainHeight = this.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
                tries--;
			} while ( tries > 0 && ( d > 0.12 || _position.y < terrainHeight ) );

            if ( _position.y > terrainHeight ){
                dummy.scale.set(
                    5 + Math.random(),
                    1 + Math.random() * 0.5,
                    5 + Math.random()
                );
                dummy.position
                    .copy( this.position )
                    .add( _position.multiply( this.terrain.gridScale ) );
                dummy.quaternion.setFromUnitVectors( scene.up, _normal );
                dummy.rotateY( Math.random() * Math.PI );
                dummy.updateMatrix();
    
                const grassType = ( Math.random() < 0.875 ) ? 0 : 1;
    
                this.modelMatrices[ 'grass' ][ grassType ].push( dummy.matrix.clone() );
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

			let d, terrainHeight;
            let tries = 100;
			do {

				surfaceSampler.sample( _position, _normal );
				d = 1.0 - scene.up.dot( _normal );
                terrainHeight = this.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
                tries--;

			} while ( tries > 0 && d > 0.13 || _position.y < terrainHeight);

            if ( _position.y > this.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) ) ){

                dummy.scale.set(
                    3 + Math.random(),
                    2 + Math.random(),
                    3 + Math.random()
                );
                dummy.position
                    .copy( this.position )
                    .add( _position.multiply( this.terrain.gridScale ) );
                dummy.quaternion.setFromUnitVectors( scene.up, _normal );
                dummy.rotateY( Math.random() * Math.PI );
                dummy.updateMatrix();
    
                this.modelMatrices[ 'ferns' ].push( dummy.matrix.clone() );
                
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

	generateTreeMatrices( mesh ) {

		if ( this.modelMatrices[ 'tree' ] ) return;

		const geo = mesh.geometry;
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
				.multiply( this.terrain.gridScale )
				.add( this.position );


			if ( wp.y < this.upperTreeHeightLimit && v.y >= this.getTerrainHeight( Math.floor( v.x ), Math.floor( v.z ) ) ) {

				let worldNoise = noise(
					wp.x * treeWorldNoiseScale,
					wp.y * treeWorldNoiseScale,
					wp.z * treeWorldNoiseScale
				);

				if ( d < 0.09 && worldNoise > 0.4 ) {

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
	generateFogMatrices( mesh ) {

		if ( this.modelMatrices[ 'fog' ] ) return;

		const geo = mesh.geometry.attributes.position;
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
			dummy.multiply( this.terrain.gridScale );
			dummy.add( this.position );

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
	generateCliffs( mesh ) {

		if ( this.boulders ) {
			// this.terrainMesh.add( this.boulders );
			return;

		}

		const geo = mesh.geometry;
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
			const d = scene.up.dot( n );

			//check to see if slope is steep enough
			//check to see if not underground
			if ( d > 0.5 && d < 0.7 && abs( v.y - this.getTerrainHeight( Math.floor( v.x ), Math.floor( v.z ) ) ) < 15 ) {

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
        let d = new THREE.Object3D();
        let geometries = [];
        for(let i = 0; i < chunked.length; i++){
            
            const chunk = chunked[i];
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
			chunked[ i ] = { verts: verts, center: c, normal: n };

            if ( verts.length > 6 ) {

				new THREE.Box3().setFromPoints( verts ).getSize( d.scale );

				d.quaternion.setFromUnitVectors( scene.up, n );
				d.rotateY( Math.random() * Math.PI );
				if ( Math.random() > 0.6 ) d.rotateX( Math.PI );

				d.position.copy( c );
				d.updateMatrix();

				let r = Math.floor( Math.random() * 4 );
				let rock = modelBank.rocks.children[ r ].geometry.clone();
				rock.applyMatrix4( d.matrix );

				geometries.push( rock );

			}

		};

		//merge all cliff parts together
		let boulderGeo = THREE.BufferGeometryUtils.mergeBufferGeometries( geometries, true );
		if ( boulderGeo ) {

			this.boulders = new THREE.Mesh( 
                boulderGeo, 
				modelBank.rocks.children[ 0 ].material
            );
            this.boulders.receiveShadow = true;
            this.boulders.castShadow = true;
			this.mesh.add( this.boulders );

		}

        //dispose temp geo's
        for(let geo of geometries){
            geo.dispose();
        }


	}

}