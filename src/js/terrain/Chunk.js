import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from '../../libraries/raycast-bvh/RaycastBVH';
import VolumetricChunk from '../../libraries/volumetric-terrain/VolumetricChunk';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';

export default class Chunk extends VolumetricChunk {

	constructor( ...args ) {

		super( ...args );

		this.lodLevel = 0;
		this.sampler;
		this.adjustedBuffer = [];
		this.adjustedIndices = new Int8Array( this.terrain.gridSize.x * this.terrain.gridSize.y * this.terrain.gridSize.z );

	}

	flipMesh() {

		super.flipMesh();
		this.sampler = new MeshSurfaceSampler( this.mesh ).build();
		this.showLevel();

	}


	generateMeshData() {

		return new Promise( resolve =>{

			this.terrain.meshWorkerBank.work(
				{
					grid: this.grid,
					gridSize: this.terrain.gridSize,
					terrainHeights: this.terrainHeights,
					adjustedIndices: this.adjustedIndices
				},
				async ( { data } ) => {

					this.generateMesh( data );

					resolve( this.chunkKey );

				}
			);

		} );

	}


	generateMesh( data ) {

		const {
			indices,
			vertices,
			underground,
			topindices,
			topvertices,
			adjusted
		} = data;

		const geo = new THREE.BufferGeometry();
		const topgeo = new THREE.BufferGeometry();

		geo.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geo.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geo.setAttribute( 'force_stone', new THREE.Float32BufferAttribute( underground, 1 ) );
		geo.setAttribute( 'adjusted', new THREE.BufferAttribute( adjusted, 1 ) );
		geo.computeVertexNormals();
		geo.computeBoundsTree = computeBoundsTree;
		geo.disposeBoundsTree = disposeBoundsTree;
		geo.computeBoundsTree();


		topgeo.setIndex( new THREE.BufferAttribute( topindices, 1 ) );
		topgeo.setAttribute( 'position', new THREE.Float32BufferAttribute( topvertices, 3 ) );
		topgeo.computeVertexNormals();

		//create new mesh with preapp.loadedmaterial
		this.meshBuffer.mesh = new THREE.Mesh( geo, this.terrain.material );
		this.meshBuffer.mesh.scale.set( this.terrain.terrainScale.x, this.terrain.terrainScale.y, this.terrain.terrainScale.z );
		this.meshBuffer.mesh.raycast = acceleratedRaycast;
		this.meshBuffer.mesh.chunk = this;
		this.meshBuffer.mesh.position.x = this.position.x;
		this.meshBuffer.mesh.position.z = this.position.z;
		this.meshBuffer.mesh.castShadow = true;
		this.meshBuffer.mesh.receiveShadow = true;
		this.meshBuffer.mesh.material.needsUpdate = true;

		this.meshBuffer.mesh.updateWorldMatrix();
		this.meshBuffer.mesh.matrixAutoUpdate = false;
		this.meshBuffer.mesh.name = "terrain";

		this.meshBuffer.LODMesh = new THREE.Mesh( topgeo, this.terrain.material );
		this.meshBuffer.LODMesh.scale.set( this.terrain.terrainScale.x, this.terrain.terrainScale.y, this.terrain.terrainScale.z );
		this.meshBuffer.LODMesh.position.x = this.position.x;
		this.meshBuffer.LODMesh.position.z = this.position.z;

		this.meshBuffer.LODMesh.updateWorldMatrix();
		this.meshBuffer.LODMesh.matrixAutoUpdate = false;
		this.meshBuffer.LODMesh.name = "terrainTop";

	}

	showLevel( level ) {

		if ( level ) this.lodLevel = level;

		if ( this.lodLevel == 1 ) {

			if ( this.mesh ) this.terrain.add( this.mesh );
			if ( this.LODMesh ) this.terrain.remove( this.LODMesh );

		} else {

			if ( this.mesh ) this.terrain.remove( this.mesh );
			if ( this.LODMesh ) this.terrain.add( this.LODMesh );

		}

	}

	generateGrid() {

		return new Promise( resolve => {

			this.terrain.gridWorkerBank.work(
				{
					offset: this.offset,
					gridSize: this.terrain.gridSize
				},
				async ( { data } ) => {

					this.grid = data.grid;
					this.terrainHeights = data.terrainHeights;

					if ( this.terrain.DB ) {

						const data = await this.terrain.DB.getAll( this.chunkKey );
						for ( let { index, value } of data ) {

							this.grid[ index ] = value;
							this.adjustedIndices[ index ] = 1;

						}

					}

					resolve();

				}
			);

		} );

	}

	async adjustGrid( ...args ) {

		super.adjustGrid( ...args );

		if ( this.terrain.DB && this.adjustedBuffer.length > 0 ) {

			this.terrain.DB.add( this.chunkKey, this.adjustedBuffer )
				.then( () => {

					this.adjustedBuffer.length = 0;

				} );

		}

	}

	saveGridPosition( gridPosition ) {

		const index = this.gridIndex( gridPosition.x, gridPosition.y, gridPosition.z );
		this.adjustedIndices[ this.gridIndex( gridPosition.x, gridPosition.y, gridPosition.z ) ] = 1;
		if ( this.terrain.DB ) this.adjustedBuffer.push( { index, value: this.grid[ index ] } );

	}


	async adjust( center, radius, val, checkNeighbors ) {

		super.adjust( center, radius, val, checkNeighbors );
		this.terrain.adjustInstancedObjects( this.chunkKey, center, radius );

	}

	dispose() {

		super.dispose();

		if ( this.LODMesh ) {

			this.LODMesh.geometry.dispose();
			this.terrain.remove( this.LODMesh );
			this.LODMesh = undefined;

		}

	}

}
