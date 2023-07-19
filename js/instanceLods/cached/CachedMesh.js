class CachedMesh extends THREE.Mesh{

    constructor( geometry, material ){
        super( geometry, material );
        this.cachedData = {}
    }

    animate(){}    
    clearMatrices(){}
    addData(){}
    removeData(){}

    update( position ){

        const currentCoord = this.terrain.getCoordFromPosition( position );
        
        for( let key in this.cachedData ) {
            const chunk = this.terrain.getChunk( key );
            if ( !chunk || 
                 Math.abs( chunk.offset.x - currentCoord.x) > this.viewDistance ||
                 Math.abs( chunk.offset.z - currentCoord.z) > this.viewDistance ){
                
                this.removeData( key );
                delete this.cachedData[ key ];

            }

        }

    }

    addChunk( chunk, x, z ){
        
        if (x >= -this.viewDistance && 
            x <= this.viewDistance &&
            z >= -this.viewDistance && 
            z <= this.viewDistance ) {

            const chunkKey = chunk.chunkKey;

            
            if ( !this.cachedData[chunkKey] ){
                
                const data = this.generateData( chunk );
                if ( data ) this.cachedData[chunkKey] = data

            }
            
            this.addData( this.cachedData[chunkKey] );

        }
    
    }

    removeMatricesOnDistanceFromPoint( chunkKey, point, distance ){

        if ( !this.cachedData[ chunkKey ] ) return;
        
		const p = new THREE.Vector3();
        let changes = false;

		function checkData( array ) {

			return array.filter( data =>{

                p.copy( data.boundingSphere.center ).multiply( terrainController.terrainScale );
                const keep = ( p.distanceToSquared( point ) > distance * distance * 50 );
                if ( !keep ) {
                    changes = true;
                }
				return keep;

			} );

		}

        this.cachedData[ chunkKey ] = checkData( this.cachedData[ chunkKey ] );
        
        return changes;
        
    }

}