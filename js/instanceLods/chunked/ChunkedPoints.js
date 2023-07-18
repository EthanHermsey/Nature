class ChunkedPoints extends THREE.Points {

    constructor(...args){
        super(...args);
        this.chunkedData = {}
    }

    update( position ){

        const currentCoord = this.terrain.getCoordFromPosition( position );
        
        for( let key in this.chunkedData ) {
            const chunk = this.terrain.getChunk( key );
            if ( !chunk || 
                 Math.abs( chunk.offset.x - currentCoord.x) > this.viewDistance ||
                 Math.abs( chunk.offset.z - currentCoord.z) > this.viewDistance ){
                delete this.chunkedData[ key ];

            }

        }

    }

    addChunk( chunk, x, z ){
        
        if (x >= -this.viewDistance && 
            x <= this.viewDistance &&
            z >= -this.viewDistance && 
            z <= this.viewDistance ) {

            const chunkKey = chunk.chunkKey;

            
            if ( !this.chunkedData[chunkKey] ){
                
                this.chunkedData[chunkKey] = this.generateData( chunk );

            }
            
            this.addData( this.chunkedData[chunkKey] );

        }
    
    }

}