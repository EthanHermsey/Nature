
class Boulder extends ChunkedObject3D {

    constructor( terrain, viewDistance ){

        super();
        this.frustumCulled = false;
        this.terrain = terrain;
        this.viewDistance = viewDistance;
        this.loadObjects();
        scene.add( this );

    }
    
    update( position ){

        super.update( position );

        const object = this.children[0];
        if ( object ) {
            object.geometry.dispose();
            this.remove( object );
        }
        
        this.add( this.generateBoulders() );        
        
    }

    removeData( key ){
        for( let geo of this.chunkedData[ key ] ){
            geo.dispose();
        }
    }

    loadObjects(){

        const loader = new THREE.ObjectLoader();

        loader.load( './resources/rocks/rocks.json', model=>{

            this.model = model;
            this.model.children[ 0 ].material.color = new THREE.Color( 'rgb(180, 180, 180)' );
            this.model.children[ 0 ].material.map.encoding = THREE.sRGBEncoding;

        });

    }

    generateBoulders(){

        //merge all cliff parts together
        const geometries = Object.values(this.chunkedData).flat();
        const boulderGeo = THREE.BufferGeometryUtils.mergeBufferGeometries( geometries, true );
        
        boulderGeo.computeBoundsTree = computeBoundsTree;
        boulderGeo.disposeBoundsTree = disposeBoundsTree;
        boulderGeo.computeBoundsTree();

        const boulders = new THREE.Mesh( 
            boulderGeo, 
            this.model.children[ 0 ].material
        );
        boulders.frustumCulled = false;
        boulders.scale.copy( this.terrain.terrainScale );
        boulders.receiveShadow = true;
        boulders.castShadow = true;
        boulders.raycast = acceleratedRaycast;

        return boulders;

    }

    generateData( chunk ){

        const mesh = chunk.mesh;
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
			if ( d > 0.5 && d < 0.7 && abs( v.y - chunk.getTerrainHeight( Math.floor( v.x ), Math.floor( v.z ) ) ) < 15 ) {

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
        const scaledChunkPosition = chunk.position.clone().divide(this.terrain.terrainScale);
        let dummy = new THREE.Object3D();
        let geometries = [];
        for(let i = 0; i < chunked.length; i++){
            
            const cChunk = chunked[i];
			const verts = [];
			const c = new THREE.Vector3();
			const n = new THREE.Vector3();

			for ( let vert of cChunk ) {

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

			c.divideScalar( cChunk.length );
			n.divideScalar( cChunk.length );
			chunked[ i ] = { verts: verts, center: c, normal: n };

            if ( verts.length > 6 ) {

                //dummy rotation
				dummy.quaternion.setFromUnitVectors( scene.up, n );
				dummy.rotateY( Math.random() * Math.PI );
				if ( Math.random() > 0.6 ) dummy.rotateX( Math.PI );

                //dummy position
				dummy.position.copy( c );
                dummy.position.add( scaledChunkPosition );

                //dummy scale
                new THREE.Box3().setFromPoints( verts ).getSize( dummy.scale );
                
				dummy.updateMatrix();

				let r = Math.floor( Math.random() * 4 );
				let rock = this.model.children[ r ].geometry.clone();
				rock.applyMatrix4( dummy.matrix );

				geometries.push( rock );

			}

		};

		return geometries.length > 0 ? geometries : undefined;
    }

}