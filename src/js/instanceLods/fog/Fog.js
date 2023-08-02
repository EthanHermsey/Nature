import CachedPoints from '../cached/CachedPoints';

export default class Fog extends CachedPoints {

	constructor( terrain, viewDistance ) {

		let fogGeo = new THREE.BufferGeometry();
		let fogMat = new THREE.PointsMaterial( {
			map: new THREE.TextureLoader().load( './src/resources/fog.png' ),
			size: 500,
			transparent: true,
			opacity: 0.08,
			alphaTest: 0.02
		} );
		fogMat.onBeforeCompile = ( shader ) => {

			shader.uniforms.time = { value: 0 };

			shader.vertexShader = 'uniform float time;\n' +
				shader.vertexShader.replace(
					`#include <begin_vertex>`,
					`
					vec3 transformed = vec3( position );
                    float r = rand( position.xz );

					if ( transformed.y > 0.5){
						transformed.x += sin( time * 0.008 * r ) * 250.0;
						transformed.y -= sin( time * 0.0013 * r) * 250.0;
						transformed.z += sin( time * 0.00734 * r) * 250.0;
					}
					`
				);

			fogMat.userData.shader = shader;

		};
		super( fogGeo, fogMat );

		this.renderOrder = 1;
		this.frustumCulled = false;
		this.terrain = terrain;
		this.viewDistance = viewDistance;
		this.positionBuffer = [];
		app.scene.add( this );

	}

	removeMatricesOnDistanceFromPoint() {}

	animate( delta ) {

		if ( this.material.userData.shader ) {

			this.material.userData.shader.uniforms.time.value += delta * 0.8;

		}

	}


	update( position ) {

		super.update( position );
		this.geometry.setFromPoints( this.positionBuffer );

	}

	clearData() {

		this.positionBuffer.length = 0;

	}

	addData( data ) {

		this.positionBuffer = [
			...this.positionBuffer,
			...data
		];

	}

	generateData( chunk ) {

		const mesh = chunk.mesh;
		const geo = mesh.geometry.attributes.position;
		const dummy = new THREE.Vector3();

		const modelPositions = [];
		let r = Math.floor( Math.random() * 2 );

		for ( let i = 0; i < r; i ++ ) {

			let r = Math.floor( Math.random() * geo.count ) * 3;
			dummy.set(
				geo.array[ r + 0 ],
				geo.array[ r + 1 ] + 20,
				geo.array[ r + 2 ],
			);
			dummy.multiply( this.terrain.terrainScale );
			dummy.add( chunk.position );

			modelPositions.push( dummy.clone() );

		}


		return modelPositions;

	}

}
