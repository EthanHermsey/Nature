import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const modelBank = {};

const preloadModels = () => {

	const ObjectLoader = new THREE.ObjectLoader();
	const gltfLoader = new GLTFLoader();
	let num_objects = 10;

	return new Promise( resolve => {

		const check = () => {

			num_objects --;
			if ( num_objects == 0 ) resolve();

		};

		gltfLoader.load( './src/resources/model/knight.gltf', ( model ) => {

			modelBank.knight = model.scene.children[ 0 ];
			modelBank.knight.animations = model.animations;
			check();

		} );

		gltfLoader.load( './src/resources/pedestal/archedPedestal.gltf', ( model ) => {

			modelBank.pedestal = model.scene.children[ 0 ];
			check();

		} );

		ObjectLoader.load( './src/resources/boulders/boulders.json', model=>{

			modelBank.boulder = model;
			check();

		} );

		ObjectLoader.load( './src/resources/trees/tree.json', model=>{

			modelBank.tree = model;
			check();

		} );

		ObjectLoader.load( './src/resources/trees/tree1.json', model=>{

			modelBank.tree1 = model;
			check();

		} );

		ObjectLoader.load( './src/resources/trees/treeHigh.json', model=>{

			modelBank.treeHigh = model;
			check();

		} );


		ObjectLoader.load( './src/resources/trees/treeHigh1.json', model=>{

			modelBank.treeHigh1 = model;
			check();

		} );

		ObjectLoader.load( './src/resources/grass/grass.json', model=>{

			modelBank.grass = model.clone();
			check();

		} );


		ObjectLoader.load( './src/resources/grass/grassHigh.json', model=>{

			modelBank.grassHigh = model.clone();
			check();

		} );

		ObjectLoader.load( './src/resources/fern/fern.json', model=>{

			modelBank.fern = model;
			check();

		} );

	} );

};

export default { preloadModels };
