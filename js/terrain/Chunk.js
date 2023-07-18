class Chunk extends VolumetricChunk{

    constructor(...args){
        
        super(...args);
        
        this.lodLevel = 0;
		this.modelMatrices = {};
        this.firstRender = true;
                
    }

    getTerrainHeight(x, z){
        return this.terrainHeights[ z * this.terrain.gridSize.x + x];
    }

	async generateMesh() {

		await super.generateMesh();
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
        // this.adjustVegetation( center, radius );
    }

    adjustVegetation( center, radius ) {

		// const worldCenter = this.position.clone().add( center.clone().multiply( this.terrain.terrainScale ) );
		// const p = new THREE.Vector3();
        // let changes = false;

		// function checkMatrices( matrices ) {

		// 	return matrices.filter( matrix =>{

		// 		p.setFromMatrixPosition( matrix );
        //         const keep = ( p.distanceToSquared( worldCenter ) > radius * radius * 25 );
        //         if ( !keep ) changes = true;
		// 		return keep;

		// 	} );

		// }

		// this.modelMatrices[ 'ferns' ] = checkMatrices( this.modelMatrices[ 'ferns' ] );
		// this.modelMatrices[ 'grass' ][ 0 ] = checkMatrices( this.modelMatrices[ 'grass' ][ 0 ] );
		// this.modelMatrices[ 'grass' ][ 1 ] = checkMatrices( this.modelMatrices[ 'grass' ][ 1 ] );
		// this.modelMatrices[ 'tree' ] = checkMatrices( this.modelMatrices[ 'tree' ] );
		// this.modelMatrices[ 'tree1' ] = checkMatrices( this.modelMatrices[ 'tree1' ] );

        // if ( changes ) this.terrain.generateInstancedObjects();
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

}