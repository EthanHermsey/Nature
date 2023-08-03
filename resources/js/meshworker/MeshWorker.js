importScripts( "SurfaceNets.js" );
const surfaceNetEngine = new SurfaceNets();

// oooo d8b oooo  oooo  ooo. .oo.
// `888""8P `888  `888  `888P"Y88b
//  888      888   888   888   888
//  888      888   888   888   888
// d888b     `V88V"V8P' o888o o888o


self.onmessage = ( { data } ) => {

	if ( data.grid ) generateMesh( data );

};

function generateMesh( { grid, gridSize, terrainHeights, adjustedIndices } ) {

	surfaceNetEngine.createSurface( grid, [ gridSize.x, gridSize.y, gridSize.z ] ).then( generatedSurface => {

		const topvertmap = {};

		const indices = new Uint16Array( generatedSurface.faces.length * 6 );
		const vertices = new Float32Array( generatedSurface.vertices.length * 3 );
		const underground = new Float32Array( generatedSurface.vertices.length );
		const adjusted = new Int8Array( generatedSurface.vertices.length );


		let x, y, z, terrainHeight, smoothRange = 2, topIndex = 0;
		for ( let i = 0; i < generatedSurface.vertices.length; i ++ ) {

			let v = generatedSurface.vertices[ i ];

			// fix z-fighting
			if ( v[ 0 ] < 0.3 ) v[ 1 ] -= 0.01;
			if ( v[ 2 ] < 0.3 ) v[ 1 ] -= 0.01;

			vertices[ i * 3 + 0 ] = v[ 0 ];
			vertices[ i * 3 + 1 ] = v[ 1 ];
			vertices[ i * 3 + 2 ] = v[ 2 ];

			x = Math.round( v[ 0 ] );
			y = v[ 1 ];
			z = Math.round( v[ 2 ] );
			terrainHeight = terrainHeights[ z * gridSize.x + x ];
			adjusted[ i ] = adjustedIndices[ ( z * ( gridSize.x * gridSize.y ) ) + ( Math.round( y ) * gridSize.z ) + x ];

			if ( y < terrainHeight ) {

				underground[ i ] = ( y > terrainHeight - smoothRange ) ? ( terrainHeight - y ) / smoothRange : 1;

			} else {

				underground[ i ] = 0;
				topvertmap[ i ] = topIndex ++;

			}

		}


		let topindices = [];
		const topvertices = new Float32Array( Object.keys( topvertmap ).length * 3 );

		for ( let i = 0; i < generatedSurface.faces.length; i ++ ) {

			const f = generatedSurface.faces[ i ];
			indices[ i * 6 + 0 ] = f[ 1 ];
			indices[ i * 6 + 1 ] = f[ 0 ];
			indices[ i * 6 + 2 ] = f[ 2 ];

			indices[ i * 6 + 3 ] = f[ 3 ];
			indices[ i * 6 + 4 ] = f[ 2 ];
			indices[ i * 6 + 5 ] = f[ 0 ];


			if ( topvertmap[ f[ 0 ] ] || topvertmap[ f[ 1 ] ] || topvertmap[ f[ 2 ] ] || topvertmap[ f[ 3 ] ] ) {

				const i0 = topvertmap[ f[ 0 ] ];
				const i1 = topvertmap[ f[ 1 ] ];
				const i2 = topvertmap[ f[ 2 ] ];
				const i3 = topvertmap[ f[ 3 ] ];

				topindices.push( i1, i0, i2 );
				topindices.push( i3, i2, i0 );

			}

		}

		for ( let key of Object.keys( topvertmap ) ) {

			const v = generatedSurface.vertices[ key ];
			topvertices[ topvertmap[ key ] * 3 + 0 ] = v[ 0 ];
			topvertices[ topvertmap[ key ] * 3 + 1 ] = v[ 1 ];
			topvertices[ topvertmap[ key ] * 3 + 2 ] = v[ 2 ];

		}

		topindices = new Uint16Array( topindices );

		self.postMessage(
			{
				indices,
				vertices,
				underground,
				topindices,
				topvertices,
				adjusted
			},
			[
				indices.buffer,
				vertices.buffer,
				underground.buffer,
				topindices.buffer,
				topvertices.buffer,
				adjusted.buffer
			]
		);

	} );

}
