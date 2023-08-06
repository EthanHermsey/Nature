import DB from "../terrain/DB";

export default class UIController {

	constructor() {

		this.elements = {
			threeDiv: document.getElementById( 'three-div' ),
			mainMenu: document.getElementById( 'main-menu' ),

			menuContent: document.getElementById( 'menu-content' ),
			continueButton: document.getElementById( 'continue-button' ),
			startButton: document.getElementById( 'start-button' ),
			settingsButton: document.getElementById( 'settings-button' ),

			loadingContent: document.getElementById( 'loading-content' ),
			loadingGrid: document.getElementById( 'loading-grid' ),
			loadingText: document.getElementById( 'loading-text' ),

			settingsContent: document.getElementById( 'settings-content' ),
			viewDetail: document.getElementById( 'view-detail' ),
			viewDistance: document.getElementById( 'view-distance' ),
			shadows: document.getElementById( 'shadows' ),
			mouseSensitivity: document.getElementById( 'mouse_sensitivity' ),
			saveProgress: document.getElementById( 'save_progress' ),
			backButton: document.getElementById( 'back-button' ),

			compass: document.getElementById( 'compass' ),
			sprint: document.getElementById( 'sprint-level' ),
			crystalAmount: document.getElementById( 'crystal-amount' ),
			berryAmount: document.getElementById( 'berry-amount' ),
			foodAmount: document.getElementsByClassName( 'food-level' ),

		};

		this.addEvents();
		this.loadOptions();

	}

	addEvents() {

		window.addEventListener( 'resize', this.windowResized, true );

		this.elements.continueButton.addEventListener( 'click', ()=>this.setFullscreen(), true );
		this.elements.continueButton.addEventListener( 'click', ()=>this.loadFromStorage(), true );

		this.elements.startButton.addEventListener( 'click', ()=>this.setFullscreen(), true );
		this.elements.startButton.addEventListener( 'click', ()=>this.loadNew(), true );

		this.elements.settingsButton.addEventListener( 'click', ()=>this.showSettings( true ), true );
		this.elements.backButton.addEventListener( 'click', ()=>this.showSettings( false ), true );

		this.elements.mouseSensitivity.addEventListener( 'input', this.updateValueLabel, true );

	}

	loadFromStorage() {

		this.showLoading( true );

		this.lockPointer();

		const viewDistance = this.getViewDistance();
		const viewDistanceChanged = ( viewDistance.viewHigh !== app.terrainController?.viewDistanceHigh ||
                                      viewDistance.viewLow !== app.terrainController?.viewDistanceLow );

		if ( ! viewDistanceChanged && app.loaded ) {

			this.loadSettings();
			app.start( true );
			this.showGame( true );

		} else {

			const { position, offset, crystals, berries, food } = JSON.parse( localStorage.getItem( 'position' ) );
			console.log( JSON.parse( localStorage.getItem( 'position' ) ) );

			app.startLoading( offset, viewDistance, this.getSaveProgress() )
				.then( () => {

					app.player.position.fromArray( position );
					app.player.position.y += 10;
					if ( crystals != null ) {

						app.player.crystals = crystals;
						app.player.berries = berries;
						app.player.food = food;
						this.updateCrystalDisplay();
						this.updateBerryDisplay();
						this.updateFoodDisplay();

					}

					this.loadSettings();

					app.terrainController.updateInstancedObjects();

					setTimeout( () => this.showGame( true ), 500 );


				} );

		}

	}

	loadNew() {

		this.showLoading( true );

		this.lockPointer();

		const db = new DB();
		db.clear();

		if ( app.terrainController ) {

			app.terrainController.clearChunks();
			app.terrainController = undefined;

		}

		app.startLoading( undefined, this.getViewDistance(), this.getSaveProgress() )
			.then( () => {

				this.loadSettings();
				app.terrainController.updateInstancedObjects();
				this.showGame( true );

			} );

	}

	getViewDistance() {

		const viewHigh = Number( this.elements.viewDetail.querySelector( 'input:checked' ).value );
		const viewLow = Number( this.elements.viewDistance.querySelector( 'input:checked' ).value );
		return { viewHigh, viewLow };

	}

	getSaveProgress() {

		return this.elements.saveProgress.checked;

	}

	loadSettings() {


		const shadows = this.elements.shadows.querySelector( 'input:checked' ).value;
		const mouseSensitivity = Number( this.elements.mouseSensitivity.value );

		switch ( shadows ) {

			case 'off':
				app.player.shadowLight.shadow.camera.far = 2;
				break;
			case 'on':
				app.player.shadowLight.shadow.camera.far = app.player.defaultShadowLightFar;
				break;

		}
		app.player.shadowLight.shadow.camera.updateProjectionMatrix();

		app.player.mouseSensitivity = app.player.defaultMouseSensitivity * 2 * mouseSensitivity;

		app.terrainController.setDB( this.elements.saveProgress.checked );

	}

	loadOptions() {

		const position = localStorage.getItem( 'position' );
		if ( position ) {

			this.elements.continueButton.classList.remove( 'hidden' );
			this.elements.startButton.textContent = 'new';
			this.elements.startButton.classList.add( 'new' );

		}

		let options = localStorage.getItem( 'options' );
		if ( options ) {

			options = JSON.parse( options );

			const viewDetailOptions = this.elements.viewDetail.querySelectorAll( 'input' );
			const viewDistanceOptions = this.elements.viewDistance.querySelectorAll( 'input' );
			const shadowsOptions = this.elements.shadows.querySelectorAll( 'input' );

			for ( let option of viewDetailOptions ) option.checked = false;

			for ( let option of viewDistanceOptions ) option.checked = false;

			for ( let option of shadowsOptions ) option.checked = false;

			document.getElementById( 'view-detail-' + options.viewDetail ).checked = true;
			document.getElementById( 'view-distance-' + options.viewDistance ).checked = true;
			document.getElementById( 'shadow-' + options.shadows ).checked = true;

			this.elements.mouseSensitivity.value = options.mouseSensitivity;
			this.updateValueLabel( { target: this.elements.mouseSensitivity } );

			this.elements.saveProgress.checked = options.saveProgress != undefined ? options.saveProgress : true;

		}

	}

	saveOptions() {

		const viewDetail = Number( this.elements.viewDetail.querySelector( 'input:checked' ).value );
		const viewDistance = Number( this.elements.viewDistance.querySelector( 'input:checked' ).value );
		const shadows = this.elements.shadows.querySelector( 'input:checked' ).value;
		const mouseSensitivity = Number( this.elements.mouseSensitivity.value );
		const saveProgress = this.elements.saveProgress.checked;
		localStorage.setItem( 'options', JSON.stringify( { viewDetail, viewDistance, shadows, mouseSensitivity, saveProgress } ) );

	}

	stopGame() {

		app.stop();
		this.showGame( false );

		this.exitFullscreen();
		this.exitPointerLock();

		this.elements.mainMenu.classList.remove( 'hidden' );
		this.elements.menuContent.classList.remove( 'hidden' );
		this.elements.loadingContent.classList.add( 'hidden' );
		this.elements.continueButton.classList.remove( 'hidden' );
		this.elements.startButton.textContent = 'new';


	}



	showLoading( show ) {

		this.elements.loadingContent.classList.toggle( 'hidden', ! show );
		this.elements.menuContent.classList.toggle( 'hidden', show );

	}

	showSettings( show ) {

		this.elements.settingsContent.classList.toggle( 'hidden', ! show );
		this.elements.menuContent.classList.toggle( 'hidden', show );

		if ( ! show ) this.saveOptions();

	}

	showGame( show ) {

		this.elements.mainMenu.classList.toggle( 'hidden', show );

	}

	updateCrystalDisplay() {

		this.elements.crystalAmount.innerHTML = app.player.crystals;

	}

	updateBerryDisplay() {

		this.elements.berryAmount.innerHTML = app.player.berries;

	}

	updateFoodDisplay() {

		for ( let i = 0; i < app.player.food.length; i ++ ) {

			this.elements.foodAmount[ i ].style.height = `${ app.player.food[ i ] * 100 }%`;

		}

	}

	updateSprintDisplay() {

		if ( app.player.sprint == 0 ) {

			this.elements.sprint.parentElement.style.opacity = 0;

		} else {

			this.elements.sprint.parentElement.style.opacity = 1;
			this.elements.sprint.style.width = `${ app.player.sprint * 100 }%`;

		}

	}

	updateValueLabel( e ) {

		e.target.nextElementSibling.textContent = e.target.value;

	}

	lockPointer() {

		document.addEventListener( "mousemove", onMouseMove, false );
		app.renderer.domElement.requestPointerLock();
		if ( 'pointerLockElement' in document ) document.addEventListener( 'pointerlockchange', this.pointerLockChangeCallback.bind( this ), false );

	}

	exitPointerLock() {

		document.removeEventListener( "mousemove", onMouseMove, false );

		if ( 'pointerLockElement' in document ) document.removeEventListener( 'pointerlockchange', this.pointerLockChangeCallback.bind( this ), false );

	}

	windowResized() {

		window.resizeCanvas( window.innerWidth, window.innerHeight );
		app.renderer.setSize( window.innerWidth, window.innerHeight );
		app.player.camera.aspect = window.innerWidth / window.innerHeight;
		app.player.camera.updateProjectionMatrix();

	}

	setFullscreen( e ) {

		document.body.requestFullscreen();
		setTimeout( ()=>this.lockPointer( e ), 400 );

	}

	exitFullscreen() {

		document.exitFullscreen();

	}

	pointerLockChangeCallback() {

		if ( ! document.pointerLockElement ) this.stopGame();

	}

}
