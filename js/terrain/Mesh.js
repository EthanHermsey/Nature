const Mesh = async ( generatedSurface, chunk ) => {

    //create new geometry
    const geo = new THREE.BufferGeometry();
    const vertices = []
    const indices = []
    const underground = [];

    //top geomtery
    const topvertmap = {};                
    const topgeo = new THREE.BufferGeometry();
    const topvertices = []
    const topindices = []

    let x, y, z, terrainHeight, smoothRange = 2, topIndex = 0;
    for(let i = 0; i < generatedSurface.vertices.length; i++){

        const v = generatedSurface.vertices[i];
        vertices.push( v[ 0 ], v[ 1 ], v[ 2 ] );

        x = round( v[0] );
        y = v[1]
        z = round( v[2] );
        terrainHeight = chunk.getTerrainHeight( x, z );

        if ( y < terrainHeight ) {
            underground.push(( y > terrainHeight - smoothRange ) ? ( terrainHeight - y ) / smoothRange : 1);
        } else {
            underground.push(0);
            topvertmap[ i ] = topIndex++;
        }

    };

    for(let i = 0; i < generatedSurface.faces.length; i++){

        const f = generatedSurface.faces[i];
        indices.push( f[ 1 ], f[ 0 ], f[ 2 ] );
        indices.push( f[ 3 ], f[ 2 ], f[ 0 ] );

        //per face, check if any vertex is higher than terrainheight  * 0.95
        //add to topmesh
        if ( topvertmap[ f[ 0 ] ] || topvertmap[ f[ 1 ] ] || topvertmap[ f[ 2 ] ] || topvertmap[ f[ 3 ] ] ){

            const i0 = topvertmap[f[ 0 ]];
            const i1 = topvertmap[f[ 1 ]];
            const i2 = topvertmap[f[ 2 ]];
            const i3 = topvertmap[f[ 3 ]];
            
            topindices.push( i1, i0, i2 );
            topindices.push( i3, i2, i0 );

        }

    };

    for(let key of Object.keys(topvertmap)){
        const v = generatedSurface.vertices[ key ];
        topvertices.push( v[ 0 ], v[ 1 ], v[ 2 ] )
    }

    geo.setIndex( indices );
    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geo.setAttribute( 'force_stone', new THREE.Float32BufferAttribute( underground, 1 ) );				
    geo.computeVertexNormals();
    geo.computeBoundsTree = computeBoundsTree;
    geo.disposeBoundsTree = disposeBoundsTree;
    geo.computeBoundsTree();


    topgeo.setIndex( topindices );
    topgeo.setAttribute( 'position', new THREE.Float32BufferAttribute( topvertices, 3 ) );				
    topgeo.computeVertexNormals();

    //create new mesh with preloaded material
    chunk.mesh = new THREE.Mesh( geo, chunk.terrain.material );
    chunk.mesh.scale.set( terrainController.terrainScale.x, terrainController.terrainScale.y, terrainController.terrainScale.z );
    chunk.mesh.raycast = acceleratedRaycast;
    chunk.mesh.chunk = chunk;
    chunk.mesh.position.x = chunk.position.x;
    chunk.mesh.position.z = chunk.position.z;
    chunk.mesh.castShadow = true;
    chunk.mesh.receiveShadow = true;
    chunk.mesh.material.needsUpdate = true;

    chunk.mesh.updateWorldMatrix();
    chunk.mesh.matrixAutoUpdate = false;
    chunk.mesh.name = "terrain";

    chunk.farMesh = new THREE.Mesh( topgeo, chunk.terrain.material );
    chunk.farMesh.scale.set( terrainController.terrainScale.x, terrainController.terrainScale.y, terrainController.terrainScale.z );
    chunk.farMesh.position.x = chunk.position.x;
    chunk.farMesh.position.z = chunk.position.z;

    chunk.farMesh.updateWorldMatrix();
    chunk.farMesh.matrixAutoUpdate = false;
    chunk.farMesh.name = "terrainTop";

}