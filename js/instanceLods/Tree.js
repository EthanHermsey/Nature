
class Tree extends InstancedLOD {

    constructor( terrain ){

        super();
        this.loadObjects( terrain );

    }

    loadObjects( terrain ){

        const loader = new THREE.ObjectLoader();
        const models = {};
        const check = () => {
            if ( models.treeModel && models.treeModelHigh ) {

                this.addLevel( models.treeModelHigh, 1500, 0 );
                this.addLevel( models.treeModel, 50000, terrain.chunkSize * terrain.treeHighViewDistance );
                for (let child of this.levels[0].object){
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

            }
        }

        loader.load( './resources/trees/tree.json', model=>{

            model.material.alphaTest = 0.45;
			model.material.needsUpdate = true;
            model.material.blending = THREE.NoBlending;
			model.material.needsUpdate = true;
            
            model.geometry.scale( 11, 11, 11 );
			model.geometry.translate( 0, -0.1, 0 );
			models.treeModel = model;
            check();
            
        });

        loader.load( './resources/trees/treeHigh.json', model=>{

            const modelScale = 0.75;

            model.children[ 0 ].geometry.scale( modelScale, modelScale, modelScale );
            model.children[ 0 ].material.map.encoding = THREE.sRGBEncoding;            
            model.children[ 0 ].material.map.wrapT = model.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

            model.children[ 1 ].geometry.scale( modelScale, modelScale, modelScale );
            model.children[ 1 ].material.map.encoding = THREE.sRGBEncoding;
            model.children[ 1 ].material.blending = THREE.NoBlending;
            model.children[ 1 ].material.alphaTest = 0.075;
            model.children[ 1 ].material.opacity = 0.3;           
            
            //trunk
            model.children[ 0 ].material.onBeforeCompile = ( shader ) => {

                shader.uniforms.time = { value: 0 };

                shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
                shader.vertexShader.replace(
                    `#include <begin_vertex>`,
                    `
                    vec3 transformed = vec3( position );
                    if ( transformed.y > 0.5){
                        transformed.x += sin( time * 0.32) * 0.2;
                        transformed.z += sin( time * 0.2734 ) * 0.1;
                        transformed.y += sin( time * 0.23 ) * 0.015;
                    }
                    `
                );

                model.children[ 0 ].material.userData.shader = shader;

            };
            model.children[ 0 ].material.needsUpdate = true;

            //leaves
            model.children[ 1 ].material.onBeforeCompile = ( shader ) => {

                shader.uniforms.time = { value: 0 };

                shader.vertexShader = 'uniform float time;\nvarying float edge;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace(
                    `#include <begin_vertex>`,
                    `					
                    
                    vec3 transformed = vec3( position );
                    float r = rand( uv );
                    
                    transformed.x += sin( time * 0.62) * 0.2;
                    transformed.z += sin( time * 0.4734 ) * 0.1;
                    transformed.y += sin( time * 0.23 ) * 0.015;

                    transformed.x += sin( time * 0.7 ) * 0.02;
                    transformed.z += sin( time * 0.643734 * r ) * 0.02;
                    transformed.y += sin( time * 1.93 * r ) * 0.125;
                    
                    `
                );

                model.children[ 1 ].material.userData.shader = shader;

            };

            models.treeModelHigh = model;
            check();

        });

    }

    addChunk( chunk ){

        if ( this.modelMatrices[ 'tree' ] ) return;

		const geo = mesh.geometry;
		const dummy = new THREE.Object3D();

		const treeWorldNoiseScale = 0.005;
		const treeNarrowNoiseScale = 0.35;
		const v = new THREE.Vector3();
		const n = new THREE.Vector3();

		this.modelMatrices[ 'tree' ] = [];
		this.modelMatrices[ 'tree1' ] = [];

		for ( let i = 0; i < geo.attributes.position.array.length; i += 3 ) {

			v.set(
				geo.attributes.position.array[ i + 0 ],
				geo.attributes.position.array[ i + 1 ],
				geo.attributes.position.array[ i + 2 ]
			);
			n.set(
				geo.attributes.normal.array[ i + 0 ],
				geo.attributes.normal.array[ i + 1 ],
				geo.attributes.normal.array[ i + 2 ]
			);
			const d = 1.0 - scene.up.dot( n );

			let wp = v.clone()
				.multiply( this.terrain.gridScale )
				.add( this.position );


			if ( wp.y < this.upperTreeHeightLimit && v.y >= this.getTerrainHeight( Math.floor( v.x ), Math.floor( v.z ) ) ) {

				let worldNoise = noise(
					wp.x * treeWorldNoiseScale,
					wp.y * treeWorldNoiseScale,
					wp.z * treeWorldNoiseScale
				);

				if ( d < 0.09 && worldNoise > 0.4 ) {

					let narrowNoise = noise(
						wp.x * treeNarrowNoiseScale,
						wp.y * treeNarrowNoiseScale,
						wp.z * treeNarrowNoiseScale
					);

					if ( narrowNoise > 0.62 ) {

						dummy.rotation.y = Math.random() * Math.PI;
						dummy.rotation.x = Math.random() * 0.14 - 0.07;
						dummy.rotation.z = Math.random() * 0.14 - 0.07;

						let s = Math.random() * 1 + 2;
						dummy.scale.x = s;
						dummy.scale.y = s;
						dummy.scale.z = s;

						dummy.position.copy( wp );
						dummy.updateMatrix();

						if ( worldNoise < 0.55 ) {

							this.modelMatrices[ 'tree' ].push( dummy.matrix.clone() );

						} else {

							this.modelMatrices[ 'tree1' ].push( dummy.matrix.clone() );

						}


					}

				}

			}

		}

	}

}