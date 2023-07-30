



// oooo d8b oooo  oooo  ooo. .oo.
// `888""8P `888  `888  `888P"Y88b
//  888      888   888   888   888
//  888      888   888   888   888
// d888b     `V88V"V8P' o888o o888o


self.onmessage = ( { data } ) => {

	if ( data.options ) return;

	generateGrid( data );

};

function generateGrid( { gridSize, offset } ) {

	const grid = new Float32Array( gridSize.x * gridSize.y * gridSize.z ).fill( - 0.5 );
	const terrainHeights = new Float32Array( gridSize.x * gridSize.z );

	const setGridValue = ( x, y, z, value ) => {

		const gridOffset = ( ( z * ( gridSize.x * gridSize.y ) ) + ( y * gridSize.z ) + x );
		grid[ gridOffset ] = value;

	};

	for ( var x = 0; x < gridSize.x; x ++ ) {

		for ( var z = 0; z < gridSize.z; z ++ ) {

			terrainHeights[ z * gridSize.x + x ] = gridSize.y * 0.5;

			let px = ( x + offset.x * ( gridSize.x - 1 ) - offset.x );
			let pz = ( z + offset.z * ( gridSize.z - 1 ) - offset.z );

			for ( var y = 0; y < gridSize.y; y ++ ) {

				const value = getValue( px, y, pz, gridSize );
				setGridValue( x, y, z, value );

			}

		}

	}

	self.postMessage( { grid, terrainHeights }, [ grid.buffer, terrainHeights.buffer ] );


}

function getValue( x, y, z, gridSize ) {

	let xs = Math.sin( x * 0.1 ) * 5;
	let zs = Math.sin( z * 0.1 ) * 5;
	let terrainheight = gridSize.y * 0.5 + xs + zs;

	return y < terrainheight ? 0.5 : - 0.5;

}
