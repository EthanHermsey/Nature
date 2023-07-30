class Chunk extends VolumetricChunk {

	constructor( ...args ) {

		super( ...args );

		this.lodLevel = 0;
		this.sampler;
		this.firstRender = true;

	}

	flipMesh() {

		super.flipMesh();
		this.sampler = new THREE.MeshSurfaceSampler( this.mesh ).build();
		this.showLevel();

	}


	generateMesh( data ) {

		const {
			indices,
			vertices,
			underground,
			topindices,
			topvertices
		} = data;

		const geo = new THREE.BufferGeometry();
		const topgeo = new THREE.BufferGeometry();

		geo.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geo.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geo.setAttribute( 'force_stone', new THREE.Float32BufferAttribute( underground, 1 ) );
		geo.computeVertexNormals();
		geo.computeBoundsTree = computeBoundsTree;
		geo.disposeBoundsTree = disposeBoundsTree;
		geo.computeBoundsTree();


		topgeo.setIndex( new THREE.BufferAttribute( topindices, 1 ) );
		topgeo.setAttribute( 'position', new THREE.Float32BufferAttribute( topvertices, 3 ) );
		topgeo.computeVertexNormals();

		//create new mesh with preapp.loadedmaterial
		this.meshBuffer.mesh = new THREE.Mesh( geo, this.terrain.material );
		this.meshBuffer.mesh.scale.set( this.terrain.terrainScale.x, this.terrain.terrainScale.y, this.terrain.terrainScale.z );
		this.meshBuffer.mesh.raycast = acceleratedRaycast;
		this.meshBuffer.mesh.chunk = this;
		this.meshBuffer.mesh.position.x = this.position.x;
		this.meshBuffer.mesh.position.z = this.position.z;
		this.meshBuffer.mesh.castShadow = true;
		this.meshBuffer.mesh.receiveShadow = true;
		this.meshBuffer.mesh.material.needsUpdate = true;

		this.meshBuffer.mesh.updateWorldMatrix();
		this.meshBuffer.mesh.matrixAutoUpdate = false;
		this.meshBuffer.mesh.name = "terrain";

		this.meshBuffer.LODMesh = new THREE.Mesh( topgeo, this.terrain.material );
		this.meshBuffer.LODMesh.scale.set( this.terrain.terrainScale.x, this.terrain.terrainScale.y, this.terrain.terrainScale.z );
		this.meshBuffer.LODMesh.position.x = this.position.x;
		this.meshBuffer.LODMesh.position.z = this.position.z;

		this.meshBuffer.LODMesh.updateWorldMatrix();
		this.meshBuffer.LODMesh.matrixAutoUpdate = false;
		this.meshBuffer.LODMesh.name = "terrainTop";

	}

	showLevel( level ) {

		if ( level ) this.lodLevel = level;

		if ( this.lodLevel == 1 ) {

			if ( this.mesh ) this.terrain.add( this.mesh );
			if ( this.LODMesh ) this.terrain.remove( this.LODMesh );

		} else {

			if ( this.mesh ) this.terrain.remove( this.mesh );
			if ( this.LODMesh ) this.terrain.add( this.LODMesh );

		}

	}

	async adjust( center, radius, val, checkNeighbors ) {

		super.adjust( center, radius, val, checkNeighbors );
		this.terrain.adjustInstancedObjects( this.chunkKey, center, radius );

	}

	dispose() {

		super.dispose();

		if ( this.LODMesh ) {

			this.LODMesh.geometry.dispose();
			this.terrain.remove( this.LODMesh );
			this.LODMesh = undefined;

		}

	}

}
