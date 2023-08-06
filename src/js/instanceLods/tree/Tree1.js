import InstancedLOD from '../../../libraries/instanced-lod/InstancedLOD';
import { modelBank } from '../../modelloader/ModelLoader';

export default class Tree1 extends InstancedLOD {

	constructor( terrain ) {

		super();
		this.terrain = terrain;
		this.loadObjects();

	}

	addObjects( models ) {

		if ( models.treeModel && models.treeModelHigh ) {

			this.addLevel( models.treeModelHigh, 1500, 0 );
			this.addLevel( models.treeModel, 50000, this.terrain.chunkSize * this.terrain.treeHighViewDistance );
			for ( let child of this.levels[ 0 ].object ) {

				child.castShadow = true;
				child.receiveShadow = true;

			}

		}

	}


	loadObjects() {

		const models = {};

		models.treeModel = modelBank.tree1.clone();
		models.treeModelHigh = modelBank.treeHigh1.clone();

		models.treeModel.material.alphaTest = 0.45;
		models.treeModel.material.needsUpdate = true;
		models.treeModel.material.blending = THREE.NoBlending;
		models.treeModel.material.needsUpdate = true;


		models.treeModelHigh.children[ 0 ].geometry.scale( 0.75, 0.75, 0.75 );
		models.treeModelHigh.children[ 0 ].material.map.encoding = THREE.sRGBEncoding;
		models.treeModelHigh.children[ 0 ].material.map.wrapT = models.treeModelHigh.children[ 0 ].material.map.wrapS = THREE.RepeatWrapping;

		models.treeModelHigh.children[ 1 ].geometry.scale( 0.75, 0.75, 0.75 );
		models.treeModelHigh.children[ 1 ].material.map.encoding = THREE.sRGBEncoding;
		models.treeModelHigh.children[ 1 ].material.blending = THREE.NoBlending;
		models.treeModelHigh.children[ 1 ].material.transparent = true;
		models.treeModelHigh.children[ 1 ].material.opacity = 0.3;
		models.treeModelHigh.children[ 1 ].material.alphaTest = 0.075;
		models.treeModelHigh.children[ 1 ].material.color.setStyle( 'rgb(200, 255, 200)' );

		//trunk
		models.treeModelHigh.children[ 0 ].material.onBeforeCompile = ( shader ) => {

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

			models.treeModelHigh.children[ 0 ].material.userData.shader = shader;

		};
		models.treeModelHigh.children[ 0 ].material.needsUpdate = true;

		//leaves
		models.treeModelHigh.children[ 1 ].material.onBeforeCompile = ( shader ) => {

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

			models.treeModelHigh.children[ 1 ].material.userData.shader = shader;

		};
		models.treeModelHigh.children[ 1 ].material.needsUpdate = true;


		this.addObjects( models );

	}

}
