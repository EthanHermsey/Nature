import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const modelBank = {};

const preloadModels = () => {

	const ObjectLoader = new THREE.ObjectLoader();
	const gltfLoader = new GLTFLoader();
	let num_objects = 11;

	return new Promise( resolve => {

		const check = () => {

			num_objects --;
			if ( num_objects == 0 ) resolve();

		};

		gltfLoader.load( './resources/models/knight/knight.gltf', ( model ) => {

			modelBank.knight = model.scene.children[ 0 ];
			modelBank.knight.animations = model.animations;
			check();

		} );

		gltfLoader.load( './resources/models/pedestal/archedPedestal.gltf', ( model ) => {

			modelBank.pedestal = model.scene.children[ 0 ];
			check();

		} );

		gltfLoader.load( './resources/models/berrybush/BerryBush2.gltf', model => {

			modelBank.bush = model.scene;
			check();

		} );

		ObjectLoader.load( './resources/models/boulders/boulders.json', model => {

			modelBank.boulder = model;
			check();

		} );

		ObjectLoader.load( './resources/models/trees/tree.json', model => {

			modelBank.tree = model;
			check();

		} );

		ObjectLoader.load( './resources/models/trees/tree1.json', model => {

			modelBank.tree1 = model;
			check();

		} );

		ObjectLoader.load( './resources/models/trees/treeHigh.json', model => {

			modelBank.treeHigh = model;
			check();

		} );


		ObjectLoader.load( './resources/models/trees/treeHigh1.json', model => {

			modelBank.treeHigh1 = model;
			check();

		} );

		ObjectLoader.load( './resources/models/grass/grass.json', model => {

			modelBank.grass = model;
			check();

		} );


		ObjectLoader.load( './resources/models/grass/grassHigh.json', model => {

			modelBank.grassHigh = model;
			check();

		} );

		ObjectLoader.load( './resources/models/fern/fern.json', model => {

			modelBank.fern = model;
			check();

		} );

	} );

};

export default { preloadModels };
