
class Tree extends InstancedLOD {

    constructor( terrain ){

        super();
        this.terrain = terrain;
        this.loadObjects();

    }

    addObjects( models ) {

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

        const models = {};
        
        modelBank.tree.material.alphaTest = 0.45;
        modelBank.tree.material.needsUpdate = true;
        modelBank.tree.material.blending = THREE.NoBlending;
        modelBank.tree.material.needsUpdate = true;            
        modelBank.tree.geometry.scale( 11, 11, 11 );
        modelBank.tree.geometry.translate( 0, -0.1, 0 );
        models.treeModel = modelBank.tree;
           

        

        modelBank.treeHigh.children[ 0 ].geometry.scale( 0.75, 0.75, 0.75 );
        modelBank.treeHigh.children[ 0 ].material.map.encoding = THREE.sRGBEncoding;            
        modelBank.treeHigh.children[ 0 ].material.map.wrapT = modelBank.treeHigh.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

        modelBank.treeHigh.children[ 1 ].geometry.scale( 0.75, 0.75, 0.75 );
        modelBank.treeHigh.children[ 1 ].material.map.encoding = THREE.sRGBEncoding;
        modelBank.treeHigh.children[ 1 ].material.blending = THREE.NoBlending;
        modelBank.treeHigh.children[ 1 ].material.alphaTest = 0.075;
        modelBank.treeHigh.children[ 1 ].material.opacity = 0.3;           
        
        //trunk
        modelBank.treeHigh.children[ 0 ].material.onBeforeCompile = ( shader ) => {

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

            modelBank.treeHigh.children[ 0 ].material.userData.shader = shader;

        };
        modelBank.treeHigh.children[ 0 ].material.needsUpdate = true;

        //leaves
        modelBank.treeHigh.children[ 1 ].material.onBeforeCompile = ( shader ) => {

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

            modelBank.treeHigh.children[ 1 ].material.userData.shader = shader;

        };

        models.treeModelHigh = modelBank.treeHigh;
        
        this.addObjects( models );

    }

}