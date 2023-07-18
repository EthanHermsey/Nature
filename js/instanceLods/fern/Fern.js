
class Fern extends InstancedLOD {

    constructor( terrain, viewDistance ){

        super();
        this.terrain = terrain;
        this.viewDistance = viewDistance;
        this.chunkedMatrices = {};
        this.loadObjects();
        scene.add( this );

    }

    animate( delta ){
        
        let r = 1.0 + ( Math.random() * 0.5 );

        if ( this.levels[0].object[0].material.userData.shader ) {
    
            this.levels[0].object[0].material.userData.shader.uniforms.time.value += delta * r;
        
        }

    }
    

    update( position ){

        super.update( position );        
        const currentCoord = this.terrain.getCoordFromPosition( position );

        for( let matrix in this.chunkedMatrices ) {

            const chunk = this.terrain.getChunk( this.chunkedMatrices[matrix].chunkKey);
            if ( !chunk || 
                 Math.abs( chunk.offset.x - currentCoord.x) > this.viewDistance ||
                 Math.abs( chunk.offset.z - currentCoord.z) > this.viewDistance ){

                delete this.chunkedMatrices[ matrix ];

            }

        }

    }

    addObjects( models ) {

        if ( models.fernModel ) {

            this.addLevel( models.fernModel, 2500, 0 );            
            
        }

    }

    addChunk( chunk, x, z ){
        
        if (x >= -this.viewDistance && 
            x <= this.viewDistance &&
            z >= -this.viewDistance && 
            z <= this.viewDistance ) {

            const chunkKey = chunk.chunkKey;
            if ( !this.chunkedMatrices[chunkKey] ){
                
                this.chunkedMatrices[chunkKey] = this.generateMatrices( chunk );
                this.chunkedMatrices[chunkKey].chunkKey = chunkKey;
            }

            this.addMatrices( this.chunkedMatrices[chunkKey] );

        }
    
    }

    loadObjects(){

        const loader = new THREE.ObjectLoader();
        const models = {};

        loader.load( './resources/fern/fern.json', model=>{

            // model.scale.set( 0.55, 0.5, 0.55 );
            model.scale.set( 0.35, 0.3, 0.35 );
            model.geometry.translate( 0, - 0.2, 0 );
            model.geometry.boundingSphere.radius = 128;
            model.material.map.encoding = THREE.sRGBEncoding;
        
            const mat1 = new THREE.MeshLambertMaterial().copy( model.material );
            mat1.onBeforeCompile = ( shader ) => {
        
                shader.uniforms.time = { value: 0 };
        
                shader.vertexShader = 'uniform float time;\n' +
                    shader.vertexShader.replace(
                        `#include <begin_vertex>`,
                        `
                        vec3 transformed = vec3( position );
                        float r = rand( uv );
        
                        if ( transformed.y > 0.5){
                            transformed.x += sin( time * r ) * 0.04;
                            transformed.y -= sin( time * 0.23 * r) * 0.05;
                            transformed.z += sin( time * 0.9734 * r) * 0.03;
                        }
                        `
                    );
        
                mat1.userData.shader = shader;
        
            };
        
            models.fernModel = model;
            models.fernModel.material = mat1;
            models.fernModel.material.needsUpdate = true;
        
            this.addObjects( models );
        
        });

    }

    generateMatrices( chunk ){

        const mesh = chunk.mesh;
        const surfaceSampler = new THREE.MeshSurfaceSampler( mesh )
            .build();
        
        const _position = new THREE.Vector3();
        const _normal = new THREE.Vector3();
        const dummy = new THREE.Object3D();
        dummy.rotation.order = "YXZ";

        const modelMatrices = [];

        for ( let i = 0; i < 20; i ++ ) {

            let d, terrainHeight;
            let tries = 100;
            do {

                surfaceSampler.sample( _position, _normal );
                d = 1.0 - scene.up.dot( _normal );
                terrainHeight = chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
                tries--;

            } while ( tries > 0 && d > 0.13 || _position.y < terrainHeight);

            if ( _position.y > chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) ) ){

                dummy.scale.set(
                    3 + Math.random(),
                    2 + Math.random(),
                    3 + Math.random()
                );
                dummy.position
                    .copy( chunk.position )
                    .add( _position.multiply( this.terrain.terrainScale ) );
                dummy.quaternion.setFromUnitVectors( scene.up, _normal );
                dummy.rotateY( Math.random() * Math.PI );
                dummy.updateMatrix();
    
                modelMatrices.push( dummy.matrix.clone() );
                
            }

        }
    
        return modelMatrices;

    }

}