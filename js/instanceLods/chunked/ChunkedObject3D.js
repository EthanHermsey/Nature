class ChunkedObject3D extends THREE.Object3D{

    constructor(){
        super();
        this.chunkedData = {}
    }

    animate(){}    
    clearMatrices(){}
    addData(){}
    removeData(){}

    update( position ){

        const currentCoord = this.terrain.getCoordFromPosition( position );
        
        for( let key in this.chunkedData ) {
            const chunk = this.terrain.getChunk( key );
            if ( !chunk || 
                 Math.abs( chunk.offset.x - currentCoord.x) > this.viewDistance ||
                 Math.abs( chunk.offset.z - currentCoord.z) > this.viewDistance ){
                
                this.removeData( key );
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
                
                const data = this.generateData( chunk );
                if ( data ) this.chunkedData[chunkKey] = data

            }
            
            this.addData( this.chunkedData[chunkKey] );

        }
    
    }

}