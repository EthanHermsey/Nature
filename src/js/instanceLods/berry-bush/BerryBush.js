import CachedInstancedLOD from '../cached/CachedInstancedLOD';
import { modelBank } from '../../modelloader/ModelLoader';

export default class BerryBush extends CachedInstancedLOD {

	constructor( terrain, viewDistance ) {

		super();
		this.terrain = terrain;
		this.viewDistance = viewDistance;
		this.loadObjects();
		app.scene.add( this );

	}

	animate( delta ) {


		for ( let child of this.children ) {

			if ( child.material.userData.shader ) {

				let r = 1.0 + ( Math.random() * 0.5 );
				child.material.userData.shader.uniforms.time.value += delta * r;

			}

		}


		if ( app.player.grabbing ) {

			let changed = false;
			const dummy = new THREE.Object3D();
			dummy.rotation.order = "YXZ";

			for ( let terrain of this.terrain.castables ) {

				if ( terrain.name === 'terrain' ) {

					const data = this.cachedData[ terrain.chunk.chunkKey ];
					if ( data ) {

						for ( let matrix of data ) {

							if ( ! matrix.picked ) {

								dummy.position.multiplyScalar( 0 );
								dummy.applyMatrix4( matrix );

								if ( dummy.position.distanceTo( app.player.position ) < 6 ) {

									matrix.picked = true;
									changed = true;

									app.player.berries ++;
									app.uiController.updateBerryDisplay();
									break;


								}

							}

						}

						this.cachedData[ terrain.chunk.chunkKey ] = data;

					}

				}

			}

			if ( changed ) {

				this.needsUpdate = true;
				super.update( app.player.position );

			}

		}

	}

	_setMatrixAt( level, index, matrix ) {

		    for ( let [ i, instancedMesh ] of this.levels[ level ].object.entries() ) {

			if ( i === 4 ) {

				instancedMesh.setMatrixAt( index, matrix.picked ? new THREE.Matrix4() : matrix );

			} else {

				instancedMesh.setMatrixAt( index, matrix );

			}

		    }

	}

	addObjects( models ) {

		if ( models.bushModel ) {

			this.addLevel( models.bushModel, 2500, 0 );

		}

	}

	loadObjects() {

		for ( let child of modelBank.bush.children ) {

			child.geometry.scale( 0.08, 0.085, 0.08 );
			child.geometry.rotateX( - HALF_PI );
			child.material.map.encoding = THREE.sRGBEncoding;
			child.castShadow = true;
			child.receiveShadow = true;

			if ( child.name == 'Object_7' || child.name == 'Object_17' ) {

				child.material.onBeforeCompile = ( shader ) => {

                	shader.uniforms.time = { value: 0 };

                	shader.vertexShader = 'uniform float time;\n' +
                        shader.vertexShader.replace(
                        	`#include <begin_vertex>`,
                        	`
                            vec3 transformed = vec3( position );
                            float r = rand( uv );

                            if ( transformed.y > 0.5){
                                transformed.x += sin( time * 0.1 * r ) * 0.005;
                                transformed.y -= sin( time * 0.1 * r) * 0.01;
                                transformed.z += sin( time * 0.334 * r) * 0.005;
                            }
                            `
                        );

					child.material.userData.shader = shader;

				};
				child.material.needsUpdate = true;

			}

		}

		this.addObjects( { bushModel: modelBank.bush } );

	}

	generateData( chunk ) {

		const surfaceSampler = chunk.sampler;
		const _position = new THREE.Vector3();
		const _normal = new THREE.Vector3();
		const dummy = new THREE.Object3D();
		dummy.rotation.order = "YXZ";

		const modelMatrices = [];

		for ( let i = 0; i < 4; i ++ ) {

			let d, terrainHeight, adjusted, up = new THREE.Vector3( 0, 1, 0 );
			let tries = 20;
			do {

				surfaceSampler.sample( _position, _normal );
				d = 1.0 - _normal.y;
				terrainHeight = chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
				adjusted = chunk.adjustedIndices[ chunk.gridIndex( Math.floor( _position.x ), Math.floor( _position.y ), Math.floor( _position.z ) ) ];
				tries --;

			} while ( tries > 0 && ( d > 0.13 || _position.y < terrainHeight || adjusted ) );

			if ( _position.y > chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) ) ) {

				dummy.scale.set(
					2 + Math.random(),
					1 + Math.random(),
					2 + Math.random()
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
