export default class DB {

	constructor() {

		this.dbName = 'world';
		this.keyPath = 'index';
		this.version = 1;
		this.updateVersion();

	}

	updateVersion() {

		const DBRequest = indexedDB.open( this.dbName, this.version );
		DBRequest.onupgradeneeded = () => this.setVersion( DBRequest.result.version );
		DBRequest.onsuccess = () => this.setVersion( DBRequest.result.version );
		DBRequest.onerror = (err) => this.setVersion( Number( err.target.error.message.split(') is')[1].match(/\((\d+)\)/)[1] ) );

	}

	setVersion( version ) {

		if ( version > this.version ) this.version = version;

	}

	getTransaction( chunkKey, connection ) {

		return connection?.transaction ? connection.transaction( chunkKey, "readwrite" ).objectStore( chunkKey ) : undefined;

	}

	getConnection( chunkKey, createObjectStore ) {

		return new Promise( ( resolve, reject ) => {


			const DBRequest = indexedDB.open( this.dbName, this.version );
			DBRequest.onupgradeneeded = () => {

				const db = DBRequest.result;
				if ( ! db.objectStoreNames.contains( chunkKey ) ) db.createObjectStore( chunkKey, { keyPath: this.keyPath } );

			};
			DBRequest.onsuccess = async () => {

				const db = DBRequest.result;
				if ( ! db.objectStoreNames.contains( chunkKey ) ) {

					if ( createObjectStore ) {

						db.close();
						this.version ++;
						resolve( await this.getConnection( chunkKey ) );

					} else {

						resolve();

					}

				}

				resolve( db );

			};
			DBRequest.onerror = () => reject( DBRequest.error );

		} );

	}

	request( type, chunkKey, data ) {

		if ( type !== 'get' && type !== 'getAll' && type !== 'put' && type !== 'clear' ) return;

		return new Promise( async ( resolve ) => {

			const DBConnection = await this.getConnection( chunkKey );
			const transaction = this.getTransaction( chunkKey, DBConnection );
			if ( transaction ) {

				const request = transaction[ type ]( data );
				request.onsuccess = () => resolve( request.result );
				request.onerror = () => resolve();

			} else {

				resolve();

			}

		} );

	}

	async get( chunkKey, index ) {

		return await this.request( 'get', chunkKey, index ) || [];

	}

	async getAll( chunkKey ) {

		return await this.request( 'getAll', chunkKey ) || [];

	}

	async add( chunkKey, data ) {

		const DBConnection = await this.getConnection( chunkKey, true );
		const transaction = this.getTransaction( chunkKey, DBConnection );

		for ( let { index, value } of data ) {

			transaction.put( { [ this.keyPath ]: index, value } );

		}

		DBConnection.close();

	}

	clear() {

		indexedDB.deleteDatabase( this.dbName );

	}

}
