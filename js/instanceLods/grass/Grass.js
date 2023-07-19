
class Grass extends ChunkedInstancedLOD {

    constructor( terrain, viewDistance ){

        super();
        this.terrain = terrain;
        this.viewDistance = viewDistance;        
        this.loadObjects();
        scene.add( this );

    }

    animate( delta ){

        let r = 1.0 + ( Math.random() * 0.5 );        	
        if ( this.levels[0].object[0].material.userData.shader ) {
            
            this.levels[0].object[0].material.userData.shader.uniforms.time.value += delta * r;
            
        }
        
    }

    addObjects( models ) {

        if ( models.grassModel && models.grassModelHigh ) {

            this.addLevel( models.grassModelHigh, 15000, 0 );
            this.addLevel( models.grassModel, 100000, this.terrain.chunkSize * this.terrain.grassHighViewDistance );
            for (let child of this.levels[0].object){
                child.castShadow = true;
                child.receiveShadow = true;
            }

        }

    }

    loadObjects(){

        const loader = new THREE.ObjectLoader();
        const models = {};

        loader.load( './resources/grass/grass.json', model=>{

            models.grassModel = model.clone();
            models.grassModel.geometry.translate( 0, - 0.051, 0 );
            models.grassModel.geometry.scale( 1.5, 1.5, 1.5 );

            const grassMaterial = new THREE.MeshLambertMaterial( {
                alphaTest: 0.35,
                map: new THREE.TextureLoader().load( './resources/grass/grassdiff.png' ),
                side: THREE.DoubleSide
            } );
            grassMaterial.onBeforeCompile = ( shader ) => {

                shader.uniforms.time = { value: 0 };

                shader.vertexShader = 'uniform float time;\n' +
                    shader.vertexShader.replace(
                        `#include <begin_vertex>`,
                        `
                        vec3 transformed = vec3( position );
                        if ( transformed.y > 0.5){
                            transformed.x += sin( time ) * 0.06;
                            transformed.z += sin( time * 0.9734 ) * 0.04;
                        }
                        `
                    );

                grassMaterial.userData.shader = shader;

            };
            models.grassModel.material = grassMaterial;
            models.grassModel.material.needsUpdate = true;

            this.addObjects( models );

        });


        loader.load( './resources/grass/grassHigh.json', model=>{

            models.grassModelHigh = model.clone();
            // models.grassModelHigh.geometry.scale( 0.43, 0.65, 0.35 );
            models.grassModelHigh.geometry.scale( 0.4, 0.55, 0.4 );

            model.material.map = new THREE.TextureLoader().load( './resources/grass/grassdiffhigh.png' );
            model.material.map.alphaTest = 0.2;

            models.grassModelHigh.material.onBeforeCompile = ( shader ) => {

                shader.uniforms.time = { value: 0 };

                shader.vertexShader = 'uniform float time;\n' +
                    shader.vertexShader.replace(
                        `#include <begin_vertex>`,
                        `
                        vec3 transformed = vec3( position );
                        float r = rand( transformed.xz );
                        if ( transformed.y > 0.5){
                            transformed.x += sin( time * r ) * 0.06;
                            transformed.z += sin( time * r * 0.9734 ) * 0.04;
                        }
                        `
                    );

                models.grassModelHigh.material.userData.shader = shader;

            };
            models.grassModelHigh.material.needsUpdate = true;
            this.addObjects( models );

        });

    }

    generateData( chunk ){

        const mesh = chunk.mesh;
        const surfaceSampler = new THREE.MeshSurfaceSampler( mesh )
            .build();
        
        const _position = new THREE.Vector3();
		const _normal = new THREE.Vector3();
		const dummy = new THREE.Object3D();
		dummy.rotation.order = "YXZ";

		const modelMatrices = [];

		for ( let i = 0; i < 500; i ++ ) {

			let d, terrainHeight;
            let tries = 50;
			do {
                surfaceSampler.sample( _position, _normal );
				d = 1.0 - scene.up.dot( _normal );
                terrainHeight = chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
                tries--;
			} while ( tries > 0 && ( d > 0.12 || _position.y < terrainHeight ) );

            if ( _position.y > terrainHeight ){
                dummy.scale.set(
                    5 + Math.random(),
                    1 + Math.random() * 0.5,
                    5 + Math.random()
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