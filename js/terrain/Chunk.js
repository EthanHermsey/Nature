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
            if ( this.farMesh ) this.terrain.remove( this.farMesh );

		} else {
            
			if ( this.mesh ) this.terrain.remove( this.mesh );
			if ( this.farMesh ) this.terrain.add( this.farMesh );

		}

	}

    async adjust( center, radius, val, checkNeighbors ) {
        super.adjust( center, radius, val, checkNeighbors );
        this.terrain.adjustInstancedObjects( this.chunkKey, center, radius );
    }

    dispose() {

		super.dispose();

        if ( this.farMesh ) {
            this.farMesh.geometry.dispose();
            this.terrain.remove( this.farMesh );
            this.farMesh = undefined;
        }

	}

}