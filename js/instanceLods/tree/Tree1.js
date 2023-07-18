
class Tree1 extends InstancedLOD {

    constructor( terrain ){

        super();
        this.terrain = terrain;
        this.loadObjects();

    }

    addObjects( models ){        
        if ( models.treeModel && models.treeModelHigh ) {

            this.addLevel( models.treeModelHigh, 1500, 0 );
            this.addLevel( models.treeModel, 50000, this.terrain.chunkSize * this.terrain.treeHighViewDistance );
            for (let child of this.levels[0].object){
                child.castShadow = true;
                child.receiveShadow = true;
            }
            
        }
    }

    
    loadObjects(){

        const loader = new THREE.ObjectLoader();
        const models = {};
        
        loader.load( './resources/trees/tree1.json', model=>{
            
            model.material.alphaTest = 0.45;
            model.material.needsUpdate = true;
            model.material.blending = THREE.NoBlending;
            model.material.needsUpdate = true;
            
            model.geometry.scale( 9, 9, 9 );
            model.geometry.translate( 0, -0.1, 0 );
            models.treeModel = model;
            this.addObjects( models );

        });

        loader.load( './resources/trees/treeHigh1.json', model=>{

            const modelScale = 0.75;

            model.children[ 0 ].geometry.scale( modelScale, modelScale, modelScale );
            model.children[ 0 ].material.map.encoding = THREE.sRGBEncoding;
            model.children[ 0 ].material.map.wrapT = model.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

            model.children[ 1 ].geometry.scale( modelScale, modelScale, modelScale );
            model.children[ 1 ].material.map.encoding = THREE.sRGBEncoding;
            model.children[ 1 ].material.blending = THREE.NoBlending;            
            model.children[ 1 ].material.transparent = true;
            model.children[ 1 ].material.opacity = 0.3;
            model.children[ 1 ].material.alphaTest = 0.075;			

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
            models.treeModelHigh = model;
            this.addObjects( models );
            
        });
    }

}
