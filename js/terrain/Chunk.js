class Chunk extends VolumetricChunk{

    constructor(...args){
        
        super(...args);
        
        this.lodLevel = 0;
        this.sampler;
		this.newMesh = {};
        this.firstRender = true;
                
    }

    flipMesh(){

        if ( this.newMesh.mesh ){

            this.dispose();
            this.mesh = this.newMesh.mesh;
            this.LODMesh = this.newMesh.LODMesh;
            this.newMesh = {};
            this.sampler = new THREE.MeshSurfaceSampler( this.mesh ).build();
            this.showLevel();
            
        }

    }


    generateMesh( data ){

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
        this.newMesh.mesh = new THREE.Mesh( geo, this.terrain.material );
        this.newMesh.mesh.scale.set( this.terrain.terrainScale.x, this.terrain.terrainScale.y, this.terrain.terrainScale.z );
        this.newMesh.mesh.raycast = acceleratedRaycast;
        this.newMesh.mesh.chunk = this;
        this.newMesh.mesh.position.x = this.position.x;
        this.newMesh.mesh.position.z = this.position.z;
        this.newMesh.mesh.castShadow = true;
        this.newMesh.mesh.receiveShadow = true;
        this.newMesh.mesh.material.needsUpdate = true;

        this.newMesh.mesh.updateWorldMatrix();
        this.newMesh.mesh.matrixAutoUpdate = false;
        this.newMesh.mesh.name = "terrain";

        this.newMesh.LODMesh = new THREE.Mesh( topgeo, this.terrain.material );
        this.newMesh.LODMesh.scale.set( this.terrain.terrainScale.x, this.terrain.terrainScale.y, this.terrain.terrainScale.z );
        this.newMesh.LODMesh.position.x = this.position.x;
        this.newMesh.LODMesh.position.z = this.position.z;

        this.newMesh.LODMesh.updateWorldMatrix();
        this.newMesh.LODMesh.matrixAutoUpdate = false;
        this.newMesh.LODMesh.name = "terrainTop";

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