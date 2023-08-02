- loadfromstorage no instancedobject lod update?

- new does not generate new chunks after viewdistance change

- checkbox; save progress

- efficiently save/load from db ( alleen changed, mischien alleen changed indexes..) ?
    db -> nature-grids
    objectStore -> chunkKey
    documents -> gridindex: value

    bij aanpassen grid -> elke aangepastte positie opslaan in objectstore in db

    bij genereren van chunk -> getall van objectstore -> overschrijven in grid

    !!!!!!!!!!!!!!!!!!!!   extra array met aangepastte indices, zodat er geen vegetation groeit? + dirt texture als aangepast boven underground    !!!!!!!!!!!!!!!!!!!!!!!



- multi ?
    spelers id name chunkKey - bij verplaatsen van x chunks -> nieuwe connecties ophalen
    server kan spelers dichtbij speler zoeken om aan elkaar te koppelen 