


// oooo d8b oooo  oooo  ooo. .oo.   
// `888""8P `888  `888  `888P"Y88b  
//  888      888   888   888   888  
//  888      888   888   888   888  
// d888b     `V88V"V8P' o888o o888o                                 
                                 
                                 
self.onmessage = async ( data ) => {

    const griddata = await generateGrid( data );
    this.postMessage( griddata );

}

function generateGrid( {offset, gridSize }) {

    const grid = new Float32Array( gridSize.x * gridSize.y * gridSize.z ).fill( - 0.5 );
    const terrainHeights = [];
    for ( let i = 0; i < gridSize.x; i ++ ) {
        terrainHeights.push( [] );
    }

    const setGridValue = (x, y, z, value) => {
        const gridOffset = ( ( z * ( gridSize.x * gridSize.y ) ) + ( y * gridSize.z ) + x );
		grid[ gridOffset ] = value;
    }

    return new Promise( resolve => {

        for ( var x = 0; x < gridSize.x; x ++ ) {             
             for ( var z = 0; z < gridSize.z; z ++ ) {

                const cX = ( x + offset.x * ( gridSize.x - 1 ) - offset.x );
                const xZ = ( z + offset.z * ( gridSize.z - 1 ) - offset.z );
                 
                for ( var y = 0; y < gridSize.y; y ++ ) {
                     
                    const value = getValue(x, y, z);
                    setGridValue( x, y, z, value );
                     
                }
                    
            }

        }

        resolve( { grid, terrainHeights } );
    })

}

function getValue(x, y, z){
    let terrainHeightValue = y < gridSize.y * 0.5 ? 0.5 : -0.5;
    return terrainHeightValue;

}