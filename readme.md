# Nature 

### Endless deformable volumetric terrain and instanced lod's
I am not a graphics artist, this is programmer art. A test started in 2018, turned into a world generator that 
creates deformable terrain filled with trees, grass, ferns, boulders and pedstals that hold crystals that the
player can grab. It adds a little gameplay to entice the player to explore the plain, hills, mountains and even
caves the player can dig through.
I tried to create a simplistic style, using pixelized textures, pulled together with Reinhard tonemapping to have
a nice environment to relax, dig around and collect crystals.


## p5.js
Used for lifecycle, math library and for drawing the hud.


## three.js
Used for rendering the game. I updated it, but it's still an older version that is compatible with the custom shader for the terrain.


## three-raycast-bvh
Insanely efficient raycast library for three.js. It really is mind boggling how fast it is. 


## Volumetric-terrain
When you instanciate a new VolumetricTerrain, you can give it some options; 

- gridsize          - the size of the grid. default 16, 256, 16
- terrainscale      - the scale of the terrain - default 5, 5, 5
- fps               - framerate at which the terrain generation clock should run at.
- currentCoord      - initial center chunk coordinate.
- viewDistance      - view distance of the terrain, the value is used as the radius, plus the center chunk.
- material          - the material used for the generated surface
- workers           - amount of workers
- gridWorkerScript  - worker script to determine grid values of a 3d grid it generates ( in a 1d typed array )
- meshWorkerScript  - worker script to generate the attributes for the mesh, a material used for the surface
- gridWorkerOptions - {} an object that hold initial data send to the webworker at startup. There is a check in the webworker ( if the message has .options ),
- meshWorkerOptions - {} an object that hold initial data send to the webworker at startup. There is a check in the webworker ( if the message has .options ),
- chunkClass        - the chunk class used to generate new chunks. This project extens the original chunk class and uses that.

#### SurfaceNets
The webworkers fill a 3d grid and creates a mesh surface using the SurfaceNets algorithm. The algorithm is similar to 
marching squares but a bit faster. The terrain is generated using web workers to first initialize the grid and 
create the attributes for the mesh.

#### Triplanar texture
In this project the volumetric-terrain has a material that uses tri-planar mapping to project rock and grass
textures onto the surface. It is a customized shader that makes sure there's no grass on the undersides and there 
are only stone textures when you are underground.

#### MeshSurfaceSampler
The matrices can be generated on the terrain using the THREE.MeshSurfaceSampler that is available in every chunk.


## TerrainController wrapper
The project uses a wrapper around Volumetric-terrain to be able to have LODed chunks. It uses a custom meshWorker that 
duplicates and returns the vertices and faces of the top surface of the mesh, without the caves that are generated.
Every time a chunk update is started, the appropriate level is shown, so that chunks that are far away are a lot 
faster to render without geometry that you'd normally never see.

#### cached instanced mesh / pointcloud / instancedLod
The wrapper also allows to add instanced meshes and pointclouds. Because they are tied to the generation of the 
surface there had to be a way to make sure not to generate new meshes everytime the terrain updates due to a 
player digging. ( Volumetric-terrain does provide a hook that enabled this project to remove grass, trees and 
boulders when terrain is changed around them ). 
To create each instanced object ( grass, ferns, boulders, crystals ) an extended mesh/pointcloud/instancedLOD is used to
be able to keep a cache for all the visible chunks, where it can grab the existing data for that object from, so it 
won't be regenerated. That data is then used for the matrices of an instanced lod or mesh. 

Instanced Lod's can be animated and even have mechanics as being picked up like the crystals in the project.


## Instanced LOD
To combine lod's and instanced meshes to create a instancedLod. It shows instanced meshes ( with more or less geometry ) based on distance from the camera. 
Every level is associated with an object, and rendering can be switched between them at the distances specified. Typically you would create, say, three meshes, one for far away (low detail), one for mid range (medium detail) and one for close up (high detail).

    const generated_trees = treeGenerator.create(); // returns array of matrices
    
    const tree = new InstancedLOD();
    tree.setMatrices( generated_trees );
    tree.animate = function(){
        this.children[0].material.uniforms.time.value += 0.2;
    }
    tree.addLevel( treeModel, 50000, 500 ) // object, amount, distance (shown from 500 units)
    tree.addLevel( treeHighModel, 50000, 0 ) // object, amount, distance (shown from 0 units)    
    scene.add( tree );


    function render(){
        tree.animate();
        if ( app.player.hasWalked > 500 ){
            tree.update( app.player.position );
            app.player.hasWalked = 0;
        }
    }
















