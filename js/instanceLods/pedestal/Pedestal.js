
class Pedestal extends CachedMesh {

    constructor( terrain, viewDistance ){

        super();
        this.terrain = terrain;
        this.viewDistance = viewDistance;        
        this.frustumCulled = false;        
        this.receiveShadow = true;
        this.castShadow = true;
        this.raycast = acceleratedRaycast;
        app.scene.add( this );

        this.spreadRange = 4;

        this.loadObjects();

    }

    animate( delta ){

        for( let key of Object.keys( this.cachedData ) ){

            if ( this.cachedData[ key ].mesh ){

                const mesh = this.cachedData[ key ].mesh;

                if ( mesh.children[0].visible ){

                    if ( player.grabbingGem && mesh.position.distanceTo( player.position ) < 5 ){

                        player.gems++;
                        uiController.elements.gem.innerHTML = player.gems;
                        mesh.children[0].visible = false;
                        mesh.children[3].visible = false;
                        break;

                    }

                    mesh.children[0].rotation.y += 0.41 * delta;
                    mesh.children[0].position.y = sin( mesh.count ) * 0.2;
                    mesh.count += random( 0.4, 2.5 ) * delta;

                    mesh.smoke.animate( delta );

                }


            }

        }           

    }
    
    update( position ){

        super.update( position );

        while(this.children.length > 0){             

            this.remove( this.children[0] );

        }

        for( let key of Object.keys( this.cachedData ) ){

            if ( this.cachedData[ key ].mesh ) {

                this.add( this.cachedData[ key ].mesh );

            }
            
        }
        
    }
    
    removeMatricesOnDistanceFromPoint(  chunkKey, point, distance ){
        
        const data = this.cachedData[ chunkKey ];
        if ( !data || !data.mesh || data.mesh.children[0].visible ) return;

        const dist = data.mesh.position.distanceToSquared( point );
        if ( dist < distance * distance * 50 ){

            this.remove( data.mesh );
            delete this.cachedData[chunkKey];
            this.cachedData[chunkKey] = true;
        }

    }

    loadObjects(){
         
        this.model = modelBank.pedestal;
        this.model.children[0].children[0].renderOrder = 1;
        this.model.children[2].geometry.computeBoundsTree = computeBoundsTree;
        this.model.children[2].geometry.disposeBoundsTree = disposeBoundsTree;
        this.model.children[2].geometry.computeBoundsTree();

    }

    addData(chunkKey){

        this.add( this.cachedData[ chunkKey ].mesh );

    }
    
    generateData( chunk ){

        const rx = noise( 
            2001056667 + chunk.offset.x * 0.4, 
            2001056667 + chunk.offset.z * 0.4 
        );

        
        if ( ( chunk.offset.x == 0 && chunk.offset.z == 0 ) ||
             ( abs( chunk.offset.x ) % this.spreadRange == 0 && abs( chunk.offset.z ) % this.spreadRange == 0 && rx < 0.4 ) ){
            
            const surfaceSampler = new THREE.MeshSurfaceSampler( chunk.LODMesh ).build();
            const _position = new THREE.Vector3();
            const _normal = new THREE.Vector3();

            let dot, terrainHeight, tries = 500;
            do {

                surfaceSampler.sample( _position, _normal );
                dot = 1.0 - app.scene.up.dot( _normal );
                terrainHeight = chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
                tries--;

            } while ( tries > 0 && dot > 0.05 && _position.y > terrainHeight );

            if ( tries > 0 ){

                const mesh = this.model.clone();
                mesh.rotation.y = random( TWO_PI );
                mesh.position.copy(_position).multiply( this.terrain.terrainScale ).add( chunk.position );
                mesh.count = 0;
                mesh.children[2].raycast = acceleratedRaycast;

                mesh.smoke = new Smoke();
                for ( let i = 0; i < 2000; i++ ) mesh.smoke.animate(0.01);
                mesh.smoke.position.y += 30;                
                mesh.smoke.rotation.y = mesh.rotation.y * -1;
                mesh.add( mesh.smoke );
    
                return { mesh };

            } else {

                console.log('could not place pedestal ' + chunk.chunkKey);

            }


        }

    }

}