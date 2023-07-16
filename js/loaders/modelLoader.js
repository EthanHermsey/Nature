const modelBank = {};

const preloadModels = () => {
    
    let loader = new THREE.ObjectLoader();
    let num_objects = 8;

    return new Promise((resolve, reject) => {

        const check = () => {
            num_objects--;
            if ( num_objects == 0) resolve();
        };

        loader.load( './resources/rocks/rocks.json', model=>{

            modelBank.rocks = model;
            model.children[ 0 ].material.color = new THREE.Color( 'rgb(220, 220, 220)' );
            modelBank.rocks.children[0].material.map.encoding = THREE.sRGBEncoding;
            check();

        });

		loader.load( './resources/trees/tree.json', model=>{

			model.material.opacity = 1.0;
            model.material.alphaTest = 0.2;
			model.geometry.translate( 0, -0.1, 0 );
			modelBank.treeModel = model;
            check();

        });

        loader.load( './resources/trees/tree2.json', model=>{

            model.material.opacity = 1.0;
            model.material.alphaTest = 0.2;
            model.geometry.translate( 0, -0.1, 0 );
            modelBank.treeModel1 = model;
            check();

        });

        loader.load( './resources/trees/treeHigh.json', model=>{

            model.children[ 0 ].material.map.encoding = THREE.sRGBEncoding;            
            model.children[ 0 ].material.map.wrapT = model.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

            model.children[ 1 ].material.map.encoding = THREE.sRGBEncoding;
            model.children[ 1 ].material.blending = THREE.NoBlending;
            model.children[ 1 ].material.alphaTest = 0.2;
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

            modelBank.treeModelHigh = model;
            check();

        });


        loader.load( './resources/trees/treeHigh2.json', model=>{

            model.children[ 0 ].material.map.wrapT = model.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

            model.children[ 1 ].material.blending = THREE.NoBlending;
            model.children[ 1 ].material.alphaTest = 0.3;            
            model.children[ 1 ].material.opacity = 0.3;

            //trunk
            model.children[ 0 ].material.onBeforeCompile = ( shader ) => {

                shader.uniforms.time = { value: 0 };

                shader.vertexShader = 'uniform float time;\n' +
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

                shader.vertexShader = 'uniform float time;\n' +
                shader.vertexShader.replace(
                    `#include <begin_vertex>`,
                    `
                    
                    
                    vec3 transformed = vec3( position );
                    float r = rand( uv );
                    
                    // transformed.x += sin( time * 0.32) * 0.06;
                    // transformed.z += sin( time * 0.2734 ) * 0.04;
                    // transformed.y += sin( time * 0.23 ) * 0.02;
                    transformed.x += sin( time * 0.32) * 0.2;
                    transformed.z += sin( time * 0.2734 ) * 0.1;
                    transformed.y += sin( time * 0.23 ) * 0.015;

                    transformed.x += sin( time * 0.5 ) * 0.02;
                    transformed.z += sin( time * 0.43734 * r ) * 0.02;
                    transformed.y += sin( time * 1.93 * r ) * 0.125;
                    
                    `
                );

                model.children[ 1 ].material.userData.shader = shader;

            };

            model.children[ 1 ].material.needsUpdate = true;
            modelBank.treeModelHigh2 = model;
            check();
            
        });

        loader.load( './resources/grass/grass.json', model=>{

            modelBank.grassModel1 = model.clone();
            modelBank.grassModel2 = model.clone();

            modelBank.grassModel2.geometry = new THREE.BufferGeometry()
                .copy( modelBank.grassModel1.geometry );

            modelBank.grassModel1.geometry.translate( 0, - 0.051, 0 );
            modelBank.grassModel2.geometry.translate( 0, - 0.051, 0 );

            modelBank.grassModel2.geometry.scale( 1.5, 1.25, 1.5 );


            //grass
            const mat1 = new THREE.MeshLambertMaterial( {
                alphaTest: 0.35,
                map: new THREE.TextureLoader().load( './resources/grass/grassdiff.png' ),
                side: THREE.DoubleSide
            } );
            mat1.onBeforeCompile = ( shader ) => {

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

                mat1.userData.shader = shader;

            };
            modelBank.grassModel1.material = mat1;
            modelBank.grassModel1.material.needsUpdate = true;

            //grass2
            const mat2 = new THREE.MeshLambertMaterial( {
                alphaTest: 0.47,
                map: new THREE.TextureLoader().load( './resources/grass/grassdiff2.png' ),
                side: THREE.DoubleSide
            } );
            mat2.onBeforeCompile = ( shader ) => {

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

                mat2.userData.shader = shader;

            };
            modelBank.grassModel2.material = mat2;
            modelBank.grassModel2.material.needsUpdate = true;
            check();

        });


        loader.load( './resources/grass/grassHigh.json', model=>{

            modelBank.grassModelHigh = model.clone();
            modelBank.grassModelHigh.geometry.scale( 0.45, 0.85, 0.45 );

            model.material.map = new THREE.TextureLoader().load( './resources/grass/grassdiffhigh.png' );
            model.material.map.alphaTest = 0.2

            modelBank.grassModelHigh.material.onBeforeCompile = ( shader ) => {

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

                modelBank.grassModelHigh.material.userData.shader = shader;

            };
            modelBank.grassModelHigh.material.needsUpdate = true;
            check();

        });

        loader.load( './resources/fern/fern.json', model=>{

            model.scale.set( 0.55, 0.5, 0.55 );
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

            modelBank.fernModel = model;
            modelBank.fernModel.material = mat1;
            modelBank.fernModel.material.needsUpdate = true;

            check();

        });

    });							

}