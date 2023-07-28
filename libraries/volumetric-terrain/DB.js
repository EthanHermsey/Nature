class DB{

    constructor(){

        this.dbName = 'world';        
        this.keyPath = 'id';
        this.version = 1;
        this.updateVersion();

    }

    updateVersion(){

        const DBRequest = indexedDB.open(this.dbName );
        DBRequest.onupgradeneeded = () => this.setVersion( DBRequest.result.version );
        DBRequest.onsuccess = () => this.setVersion(DBRequest.result.version);
        DBRequest.onerror = () => this.setVersion(DBRequest.result.version);

    }

    setVersion( version ){

        if ( version > this.version ) this.version = version;

    }

    getConnection( chunkKey ){

        return new Promise( ( resolve, reject ) => {

            console.log( 'connection v ' + this.version );
            
            const DBRequest = indexedDB.open(this.dbName, this.version );
            DBRequest.onupgradeneeded = () => {
                
                const db = DBRequest.result;      
                if ( !db.objectStoreNames.contains( chunkKey ) ) {
                    console.log( chunkKey, this.version );
                    db.createObjectStore( chunkKey, { keyPath: this.keyPath } );
                }    

            }
            DBRequest.onsuccess = () => resolve( DBRequest.result );
            DBRequest.onerror = () => reject( DBRequest.error );

        });  

    }

    request( type, chunkKey, data, second ){

        if ( second ) console.log(type, chunkKey, data, 'SECOND');
        
        if ( type !== 'get' && type !== 'getAll' && type !== 'put' && type !== 'clear' ) return;

        return new Promise( async ( resolve ) => {

            const DBConnection = await this.getConnection( chunkKey );
            const chunkKeyExists = DBConnection.objectStoreNames.contains( chunkKey );

            if ( ( type === 'get' || type === 'getAll' ) && !chunkKeyExists ) {

                resolve();
                return;

            }

            if ( !chunkKeyExists ){

                console.log(type, chunkKey, data);
                DBConnection.close();
                this.version ++;
                resolve( await this.request( type, chunkKey, data, true ) );

            } else {

                const transaction = DBConnection.transaction(chunkKey, "readwrite");            
                const request = transaction.objectStore(chunkKey)[type]( data );
                request.onsuccess = () => resolve( request.result );
                request.onerror = () => resolve();

            }

        })

    }

    async get( chunkKey, index ){
        
        return await this.request( 'get', chunkKey, index ) || [];

    }

    async getAll( chunkKey ){
        
        return await this.request( 'getAll', chunkKey ) || [];

    }

    add( chunkKey, index, value ) {

       return this.request( 'put', chunkKey, { [this.keyPath]: index, value } );

    }

    clear( chunkKey ){

        return this.request( 'clear', chunkKey );

    }
    
}