importScripts("SurfaceNets.js");
const surfaceNetEngine = new SurfaceNets();




self.onmessage = ( { data } ) => {

    if ( data.grid ) generateMesh( data );

}

function generateMesh( { grid, gridSize, terrainHeights } ) {

    surfaceNetEngine.createSurface( grid, [ gridSize.x, gridSize.y, gridSize.z ] ).then( generatedSurface => {

        const indices = new Uint16Array( generatedSurface.faces.length * 6 );
        const vertices = new Float32Array( generatedSurface.vertices.length * 3 );
        
        for(let i = 0; i < generatedSurface.vertices.length; i++){

            const v = generatedSurface.vertices[i];
            vertices[ i * 3 + 0 ] = v[ 0 ];
            vertices[ i * 3 + 1 ] = v[ 1 ];
            vertices[ i * 3 + 2 ] = v[ 2 ];
        
        };
        
        for(let i = 0; i < generatedSurface.faces.length; i++){
        
            const f = generatedSurface.faces[ i ];
            indices[ i * 6 + 0 ] = f[ 1 ];
            indices[ i * 6 + 1 ] = f[ 0 ];
            indices[ i * 6 + 2 ] = f[ 2 ];

            indices[ i * 6 + 3 ] = f[ 3 ];
            indices[ i * 6 + 4 ] = f[ 2 ];
            indices[ i * 6 + 5 ] = f[ 0 ];
        
        };
        
        self.postMessage( 
            {
                indices,
                vertices                
            }, 
            [
                indices.buffer,
                vertices.buffer
            ] 
        );

    } );

}