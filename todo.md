
- multi ?
    spelers id name chunkKey - bij verplaatsen van x chunks -> nieuwe connecties ophalen
    server kan spelers dichtbij speler zoeken om aan elkaar te koppelen 
   
- efficiently save/load from db ( alleen changed, mischien alleen changed indexes..) ?
    db -> nature-grids
    objectStore -> chunkKey
    documents -> gridindex: value

    bij aanpassen grid -> elke aangepastte positie opslaan in objectstore in db

    bij genereren van chunk -> getall van objectstore -> overschrijven in grid

    extra array met aangepastte indices, zodat er geen vegetation groeit?
