
class Fern extends CachedInstancedLOD {

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

	}

	addObjects( models ) {

		if ( models.fernModel ) {

			this.addLevel( models.fernModel, 2500, 0 );

		}

	}

	loadObjects() {

		modelBank.fern.scale.set( 0.25, 0.2, 0.25 );
		modelBank.fern.geometry.translate( 0, - 0.2, 0 );
		modelBank.fern.geometry.boundingSphere.radius = 128;
		modelBank.fern.material.map.encoding = THREE.sRGBEncoding;

		const mat1 = new THREE.MeshLambertMaterial().copy( modelBank.fern.material );
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
		modelBank.fern.material = mat1;
		modelBank.fern.material.needsUpdate = true;

		this.addObjects( { fernModel: modelBank.fern } );

	}

	generateData( chunk ) {

		const surfaceSampler = chunk.sampler;
		const _position = new THREE.Vector3();
		const _normal = new THREE.Vector3();
		const dummy = new THREE.Object3D();
		dummy.rotation.order = "YXZ";

		const modelMatrices = [];

		for ( let i = 0; i < 20; i ++ ) {

			let d, terrainHeight;
			let tries = 20;
			do {

				surfaceSampler.sample( _position, _normal );
				d = 1.0 - _normal.y;
				terrainHeight = chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) );
				tries --;

			} while ( tries > 0 && d > 0.13 || _position.y < terrainHeight );

			if ( _position.y > chunk.getTerrainHeight( Math.floor( _position.x ), Math.floor( _position.z ) ) ) {

				dummy.scale.set(
					2 + Math.random(),
					1 + Math.random(),
					2 + Math.random()
				);
				dummy.position
					.copy( chunk.position )
					.add( _position.multiply( this.terrain.terrainScale ) );
				dummy.quaternion.setFromUnitVectors( app.scene.up, _normal );
				dummy.rotateY( Math.random() * Math.PI );
				dummy.updateMatrix();

				modelMatrices.push( dummy.matrix.clone() );

			}

		}

		return modelMatrices;

	}

}
