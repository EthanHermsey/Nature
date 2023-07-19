class ChunkedInstancedLOD extends InstancedLOD {

    constructor(){
        super();
        this.chunkedData = {}
    }

    update( position ){

        super.update( position );
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

    addData( data ){

        this.addMatrices( data );

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