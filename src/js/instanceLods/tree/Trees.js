import Cached from '../cached/Cached';
import Tree from './Tree';
import Tree1 from './Tree1';

export default class Trees extends Cached {

	constructor( terrain, viewDistance ) {

		super();
		this.terrain = terrain;
		this.viewDistance = viewDistance;
		this.needsUpdate = true;

		this.tree = new Tree( this.terrain );
		this.tree1 = new Tree1( this.terrain );
		app.scene.add( this.tree );
		app.scene.add( this.tree1 );

	}

	animate( delta ) {

		let r = 1.0 + ( Math.random() * 0.5 );

		if ( this.tree.levels[ 1 ].object[ 0 ].material.userData.shader ) this.tree.levels[ 1 ].object[ 0 ].material.userData.shader.uniforms.time.value += delta * r;
		if ( this.tree1.levels[ 1 ].object[ 0 ].material.userData.shader ) this.tree1.levels[ 1 ].object[ 0 ].material.userData.shader.uniforms.time.value += delta * r;

		for ( let child of this.tree.levels[ 0 ].object ) {

			//update tree1 animation
			if ( child.material.userData.shader ) child.material.userData.shader.uniforms.time.value += delta * r;

		}

		for ( let child of this.tree1.levels[ 0 ].object ) {

			//update tree1 animation
			if ( child.material.userData.shader ) child.material.userData.shader.uniforms.time.value += delta * r;

		}

	}

	update( position ) {

		this.tree.update( position );
		this.tree1.update( position );

		const currentCoord = this.terrain.getCoordFromPosition( position );
		for ( let key in this.cachedMatrices ) {

			const chunk = this.terrain.getChunk( this.cachedMatrices[ key ].chunkKey );
			if ( ! chunk ||
                 Math.abs( chunk.offset.x - currentCoord.x ) > this.viewDistance ||
                 Math.abs( chunk.offset.z - currentCoord.z ) > this.viewDistance ) {

				delete this.cachedMatrices[ key ];

			}

		}

		this.needsUpdate = false;

	}

	clearData() {

		this.tree.clearData();
		this.tree1.clearData();

	}

	removeCachedData( chunkKey ) {

		this.tree.removeCachedData( chunkKey );
		this.tree1.removeCachedData( chunkKey );

	}

	dispose() {

		this.tree.dispose();
		this.tree1.dispose();

	}

	addData( data ) {

		if ( ! data ) return;
		const { tree, tree1 } = data;
		this.tree.addMatrices( tree );
		this.tree1.addMatrices( tree1 );

	}

	generateData( chunk ) {

		const mesh = chunk.mesh;
		if ( ! mesh ) return;

		const geo = mesh.geometry;
		const dummy = new THREE.Object3D();

		const treeWorldNoiseScale = 0.005;
		const treeNarrowNoiseScale = 0.35;
		const v = new THREE.Vector3();
		const n = new THREE.Vector3();
		const wp = new THREE.Vector3();
		let d, adjusted;

		const modelMatrices = {};
		modelMatrices[ 'tree' ] = [];
		modelMatrices[ 'tree1' ] = [];

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

			d = 1.0 - n.y;

			wp.copy( v )
				.multiply( this.terrain.terrainScale )
				.add( chunk.position );

			adjusted = chunk.adjustedIndices[ chunk.gridIndex( Math.floor( v.x ), Math.floor( v.y ), Math.floor( v.z ) ) ];

			if ( ! adjusted && wp.y < this.terrain.upperTreeHeightLimit && v.y >= chunk.getTerrainHeight( Math.floor( v.x ), Math.floor( v.z ) ) ) {

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

						let s = Math.random() * 1 + 1.26;
						dummy.scale.x = s;
						dummy.scale.y = s;
						dummy.scale.z = s;

						dummy.position.copy( wp );
						dummy.updateMatrix();

						if ( worldNoise < 0.55 ) {

							modelMatrices[ 'tree' ].push( dummy.matrix.clone() );

						} else {

							modelMatrices[ 'tree1' ].push( dummy.matrix.clone() );

						}


					}

				}

			}

		}

		return modelMatrices;

	}

	removeMatricesOnDistanceFromPoint( chunkKey, point, distance ) {

		const p = new THREE.Vector3();
		let changes = false;

		function checkData( array ) {

			return array.filter( data =>{

				p.setFromMatrixPosition( data );
				const keep = ( p.distanceToSquared( point ) > distance * distance * 25 );
				if ( ! keep ) {

					changes = true;

				}
				return keep;

			} );

		}

		this.cachedData[ chunkKey ].tree = checkData( this.cachedData[ chunkKey ].tree );
		this.cachedData[ chunkKey ].tree1 = checkData( this.cachedData[ chunkKey ].tree1 );

		this.needsUpdate = changes;

	}

}
