
- doordat mesh in worker is, zit er update verschil in neighbors. misschien alle afgemaaktte meshes per batch releasen?
    - alleen als updatechunks.length 0 is? Zo was het eerder geloof ik

- multi
    spelers id name chunkKey - bij verplaatsen van x chunks -> nieuwe connecties ophalen
    server kan spelers dichtbij speler zoeken om aan elkaar te koppelen 
   
- efficiently save/load from db ( alleen changed, mischien alleen changed indexes..)
    db -> nature-grids
    objectStore -> chunkKey
    documents -> gridindex: value

    bij aanpassen grid -> elke aangepastte positie opslaan in objectstore in db

    bij genereren van chunk -> getall van objectstore -> overschrijven in grid

    extra array met aangepastte indices, zodat er geen vegetation groeit?

<!-- {"position":[2581.7406015628853,980.6652195632854,-1359.391215912829],"offset":{"x":18,"y":-10}} -->
<!-- {"position":[2752.7925935303933,1027.3258721815296,-1328.781806245274],"offset":{"x":19,"z":-10}} -->