const modelBank = {};

const preloadModels = () => {
    
    const ObjectLoader = new THREE.ObjectLoader();
    const GLTFLoader = new THREE.GLTFLoader();                
    let num_objects = 10;

    return new Promise( resolve => {

        const check = () => {
            num_objects--;
            if ( num_objects == 0) resolve();
        };

        GLTFLoader.load( './resources/model/knight.gltf', ( model ) => {
    
            modelBank.knight = model.scene.children[ 0 ];
            modelBank.knight.animations = model.animations;
            check();

        } );

        GLTFLoader.load( './resources/pedestal/pedestal.gltf', ( model ) => {
    
            modelBank.pedestal = model.scene.children[2];
            check();
            
        } );

        ObjectLoader.load( './resources/boulders/boulders.json', model=>{

            modelBank.boulder = model;
            check();

        });

		ObjectLoader.load( './resources/trees/tree.json', model=>{

			modelBank.tree = model;
            check();

        });

        ObjectLoader.load( './resources/trees/tree1.json', model=>{

            modelBank.tree1 = model;
            check();

        });

        ObjectLoader.load( './resources/trees/treeHigh.json', model=>{

            modelBank.treeHigh = model;
            check();

        });


        ObjectLoader.load( './resources/trees/treeHigh1.json', model=>{

            modelBank.treeHigh1 = model;
            check();
            
        });

        ObjectLoader.load( './resources/grass/grass.json', model=>{

            modelBank.grass = model.clone();
            check();

        });


        ObjectLoader.load( './resources/grass/grassHigh.json', model=>{

            modelBank.grassHigh = model.clone();           
            check();

        });

        ObjectLoader.load( './resources/fern/fern.json', model=>{

            modelBank.fern = model;
            check();

        });

    });							

}