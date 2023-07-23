
class Pedestal extends CachedMesh {

    constructor( terrain, viewDistance ){

        super();
        this.terrain = terrain;
        this.viewDistance = viewDistance;        
        this.frustumCulled = false;
        this.scale.copy( this.terrain.terrainScale );
        this.receiveShadow = true;
        this.castShadow = true;
        this.raycast = acceleratedRaycast;
        app.scene.add( this );

        this.pedestalPositions = {
            '0:0': true
        };

        this.loadObjects();

    }

    animate(){

        for( let key of Object.keys( this.cachedData ) ){

            if ( this.cachedData[ key ].mesh ){

                const mesh = this.cachedData[ key ].mesh;

                if ( mesh.children[0].visible ){

                    if ( player.grabbingGem && mesh.worldPosition.distanceTo( player.position ) < 5 ){

                        player.gems++;
                        uiController.elements.gem.innerHTML = player.gems;
                        mesh.children[0].visible = false;
                        mesh.children[2].visible = false;
                        break;

                    }

                    mesh.children[0].rotation.y += 0.005;
                    mesh.children[0].position.y = sin( mesh.count ) * 0.2;
                    mesh.count += random( 0.01, 0.08 );


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
    
    removeMatricesOnDistanceFromPoint(){}

    loadObjects(){
         
        this.model = modelBank.pedestal;
        this.model.position.y -= 2.05;
        this.model.scale.setScalar( 0.042 );
        this.model.children[0].scale.setScalar( 1.05 );
        this.model.children[0].children[0].renderOrder = 1;

        const highlight = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 500),
            new THREE.MeshBasicMaterial({ color: 'rgb(50, 10, 10)', transparent: true, opacity: 0.5 })
        )
        highlight.geometry.translate(0, 270, 0);
        this.model.add( highlight );

    }
    
    generateData( chunk ){

        let mesh;

        if ( this.pedestalPositions[ chunk.chunkKey ] ){
            
            const surfaceSampler = new THREE.MeshSurfaceSampler( chunk.farMesh ).build();
            const _position = new THREE.Vector3();
            const _normal = new THREE.Vector3();

            let dot, tries = 500;
            do {
                surfaceSampler.sample( _position, _normal );
                dot = 1.0 - app.scene.up.dot( _normal );
                tries--;

            } while ( tries > 0 && dot > 0.05 );

            mesh = this.model.clone();
            mesh.position.copy(_position);
            mesh.worldPosition = mesh.position.clone().multiply( this.terrain.terrainScale ).add( chunk.position );
            mesh.count = 0;    

            return { mesh };

        }

    }

}