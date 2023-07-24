class Chunk extends VolumetricChunk{

    constructor(...args){
        
        super(...args);
        
        this.lodLevel = 0;
        this.sampler;
		this.modelMatrices = {};
        this.firstRender = true;
                
    }

    getTerrainHeight(x, z){
        return this.terrainHeights[ z * this.terrain.gridSize.x + x];
    }

	async generateMesh() {

		await super.generateMesh();
        this.sampler = new THREE.MeshSurfaceSampler( this.mesh ).build();
        this.showLevel();
        
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