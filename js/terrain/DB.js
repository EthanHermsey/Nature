class DB{

    constructor( name, store, key ){
        this.dbName = name;    
        this.storeKey = store;
        this.keyPath = key || 'id';
    }

    connect(){

        return new Promise( ( resolve, reject ) => {

            const DBRequest = indexedDB.open(this.dbName, 1);
            DBRequest.onupgradeneeded = () => {

                const db = DBRequest.result;      
                if (!db.objectStoreNames.contains(this.storeKey)) {
                    db.createObjectStore(this.storeKey, {keyPath: this.keyPath});
                }
    
            }
            DBRequest.onsuccess = () => resolve( DBRequest.result )
            DBRequest.onerror = () => reject( DBRequest.error )

        });  

    }

    request( type, data ){
        
        if ( type !== 'get' && type !== 'add' && type !== 'put') return;

        return new Promise( async ( resolve ) => {

            const DBRequest = await this.connect();
            const transaction = DBRequest.transaction(this.storeKey, "readwrite");

            const request = transaction.objectStore(this.storeKey)[type]( data );
            request.onsuccess = () => resolve( request.result );
            request.onerror = () => resolve();            

        })
    }


    get( id ){
        
        return this.request( 'get', id );

    }

    add( id, data ) {

       return this.request( 'add', { [this.keyPath]: id, ...data } );

    }

    put( id, data ){
        
        return this.request( 'put', { [this.keyPath]: id, ...data } );

    }

    clear(){

        return this.request( 'clear' );

    }
    
}