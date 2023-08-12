import CachedInstancedLOD from '../cached/CachedInstancedLOD';
import { modelBank } from '../../modelloader/ModelLoader';

export default class Grass extends CachedInstancedLOD {

	constructor( terrain, viewDistance ) {

		super();
		this.terrain = terrain;
		this.viewDistance = viewDistance;
		this.loadObjects();
		app.scene.add( this );

	}

	animate( delta ) {

		let r = 1.0 + ( Math.random() * 0.5 );
		if ( this.levels[ 0 ].object[ 0 ].material.userData.shader ) {

			this.levels[ 0 ].object[ 0 ].material.userData.shader.uniforms.time.value += delta * r;

		}
		if ( this.levels[ 1 ].object[ 0 ].material.userData.shader ) {

			this.levels[ 1 ].object[ 0 ].material.userData.shader.uniforms.time.value += delta * r;

		}

	}

	addObjects( models ) {

		if ( models.grassModel && models.grassModelHigh ) {

			this.addLevel( models.grassModelHigh, 15000, 0 );
			this.addLevel( models.grassModel, 100000, this.terrain.chunkSize * this.terrain.grassHighViewDistance );
			for ( let child of this.levels[ 0 ].object ) {

				child.receiveShadow = true;

			}

		}

	}

	loadObjects() {

		const models = {};

		models.grassModel = modelBank.grass;
		models.grassModel.geometry.translate( 0, - 0.051, 0 );
		models.grassModel.geometry.scale( 1.45, 1.25, 1.45 );

		const grassMaterial = new THREE.MeshLambertMaterial( {
			alphaTest: 0.35,
			map: new THREE.TextureLoader().load( './resources/images/grass/grassdiff.png' ),
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



		models.grassModelHigh = modelBank.grassHigh;
		models.grassModelHigh.material.map = new THREE.TextureLoader().load( './resources/images/grass/grassdiffhigh.png' );
		models.grassModelHigh.material.map.alphaTest = 0.2;
		models.grassModelHigh.material.color.setStyle( 'rgb(210, 250, 210)' );

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

	}

	generateData( chunk ) {

		const surfaceSampler = chunk.sampler;
		const _position = new THREE.Vector3();
		const _normal = new THREE.Vector3();
		const dummy = new THREE.Object3D();
		dummy.rotation.order = "YXZ";

		const modelMatrices = [];

		for ( let i = 0; i < 900; i ++ ) {

			let d, terrainHeight, adjusted, up = new THREE.Vector3( 0, 1, 0 );
			let tries = 8;
			do {

				surfaceSampler.sample( _position, _normal );
				d = 1.0 - _normal.y;
				terrainHeight = chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
				adjusted = chunk.adjustedIndices[ chunk.gridIndex( Math.floor( _position.x ), Math.floor( _position.y ), Math.floor( _position.z ) ) ];
				tries --;

			} while ( tries > 0 && ( d < 0 || d > 0.12 || _position.y < terrainHeight || adjusted ) );

			if ( tries === 0 ) continue;

			if ( _position.y > terrainHeight ) {

				dummy.scale.set(
					1.2 + Math.random() * 0.6,
					1 + Math.random() * 0.1,
					1.2 + Math.random() * 0.6,
				);
				dummy.position
					.copy( chunk.position )
					.add( _position.multiply( this.terrain.terrainScale ) );
				dummy.quaternion.setFromUnitVectors( up, _normal );
				dummy.rotateY( Math.random() * Math.PI );
				dummy.updateMatrix();

				modelMatrices.push( dummy.matrix.clone() );

			}

		}

		return modelMatrices;

	}

}
