
class UIController{

    constructor(){

        this.elements = {
            threeDiv: document.getElementById( 'three-div' ),
            mainMenu: document.getElementById( 'main-menu' ),

            menuContent: document.getElementById( 'menu-content' ),
            continueButton: document.getElementById( 'continue-button' ),
            startButton: document.getElementById( 'start-button' ),
            settingsButton: document.getElementById( 'settings-button' ),
                        
            loadingContent: document.getElementById( 'loading-content' ),
            loadingGrid: document.getElementById('loading-grid'),
            loadingText: document.getElementById( 'loading-text' ),
            
            settingsContent: document.getElementById( 'settings-content' ),
            viewDetail: document.getElementById( 'view-detail' ),
            viewDistance: document.getElementById( 'view-distance' ),
            shadows: document.getElementById( 'shadows' ),
            mouseSensitivity: document.getElementById( 'mouse_sensitivity' ),
            backButton: document.getElementById( 'back-button' ),

        }
        
        window.addEventListener('resize', this.windowResized, true );

        this.elements.continueButton.addEventListener('click', ()=>this.setFullscreen(), true);
        this.elements.continueButton.addEventListener('click', ()=>this.loadFromStorage(), true);
        
        this.elements.startButton.addEventListener('click', ()=>this.setFullscreen(), true);
        this.elements.startButton.addEventListener('click', ()=>this.loadNew(), true);

        this.elements.settingsButton.addEventListener('click', ()=>this.showSettings(true), true);
        this.elements.backButton.addEventListener('click', ()=>this.showSettings(false), true);
                
        this.elements.mouseSensitivity.addEventListener('input', this.updateValueLabel, true);

        this.loadOptions();

    }

    loadFromStorage(){

        this.showLoading( true );
        
        this.lockPointer();

        if ( app.loaded ){
         
            this.loadSettings();
            app.start( true );
            this.showGame( true );
    
        } else {
    
            const {position, offset} = JSON.parse(localStorage.getItem('position'));
            app.startLoading( offset, this.getViewDistance() )
                .then(() => {
                    
                    player.position.fromArray( position );
                    player.position.y += 10;

                    this.loadSettings();
                    terrainController.updateInstancedObjects();                    
                    this.showGame( true );

                });
    
        }

        this.saveOptions();
    
    }
    
    loadNew(){

        this.showLoading( true );
        
        this.lockPointer();

        app.startLoading( undefined, this.getViewDistance() )
            .then(() => {

                this.loadSettings();
                terrainController.updateInstancedObjects();
                this.showGame( true );

            });

        this.saveOptions();

    }

    getViewDistance(){

        const viewDetail = Number( this.elements.viewDetail.querySelector('input:checked').value );
        const viewDistance = Number( this.elements.viewDistance.querySelector('input:checked').value );
        return { viewDetail, viewDistance };

    }

    loadSettings(){

        
        const shadows = this.elements.shadows.querySelector('input:checked').value;
        const mouseSensitivity = Number( this.elements.mouseSensitivity.value );
        
        switch( shadows ){

            case 'off':
                player.shadowLight.shadow.camera.far = 2;
                break;
            case 'on':
                player.shadowLight.shadow.camera.far = player.defaultShadowLightFar;
                break;

        }
        player.shadowLight.shadow.camera.updateProjectionMatrix();

        player.mouseSensitivity = player.defaultMouseSensitivity * 2 * mouseSensitivity;        
        
    }

    loadOptions(){

        const position = localStorage.getItem('position');
        if ( position ){        
            this.elements.continueButton.classList.remove( 'hidden' );
            this.elements.startButton.textContent = 'new';
            this.elements.startButton.classList.add('new');
        };

        let options = localStorage.getItem('options');
        if ( options ){
            
            options = JSON.parse( options );

            const viewDetailOptions = this.elements.viewDetail.querySelectorAll('input');
            const viewDistanceOptions = this.elements.viewDistance.querySelectorAll('input');
            const shadowsOptions = this.elements.shadows.querySelectorAll('input');

            for(let option of viewDetailOptions) option.checked = false;

            for(let option of viewDistanceOptions) option.checked = false;
            
            for(let option of shadowsOptions) option.checked = false;

            document.getElementById( 'view-detail-' + options.viewDetail ).checked = true;
            document.getElementById( 'view-distance-' + options.viewDistance ).checked = true;
            document.getElementById( 'shadow-' + options.shadows ).checked = true;
            
            this.elements.mouseSensitivity.value = options.mouseSensitivity;
            this.updateValueLabel({target: this.elements.mouseSensitivity });

        }

    }

    saveOptions(){

        const viewDetail = Number( this.elements.viewDetail.querySelector('input:checked').value );
        const viewDistance = Number( this.elements.viewDistance.querySelector('input:checked').value );        
        const shadows = this.elements.shadows.querySelector('input:checked').value;
        const mouseSensitivity = Number( this.elements.mouseSensitivity.value );
        localStorage.setItem( 'options', JSON.stringify( { viewDetail, viewDistance, shadows, mouseSensitivity } ) );

    }

    stopGame(){

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

    

    showLoading( show ){
        this.elements.loadingContent.classList.toggle( 'hidden', !show );
        this.elements.menuContent.classList.toggle( 'hidden', show );
    }
    
    showSettings( show ){
        this.elements.settingsContent.classList.toggle( 'hidden', !show );
        this.elements.menuContent.classList.toggle( 'hidden', show );
    }
    
    showGame( show ){
        this.elements.mainMenu.classList.toggle( 'hidden', show );
    }

    
    updateValueLabel( e ){
    
        e.target.nextElementSibling.textContent = e.target.value;
    
    }


    lockPointer(){
        
        document.addEventListener( "mousemove", onMouseMove, false );
        app.renderer.domElement.requestPointerLock();    
        if ( 'pointerLockElement' in document ) document.addEventListener( 'pointerlockchange', this.pointerLockChangeCallback.bind(this), false );

    }

    exitPointerLock(){

        document.removeEventListener( "mousemove", onMouseMove, false );

        if ( 'pointerLockElement' in document ) document.removeEventListener( 'pointerlockchange', this.pointerLockChangeCallback.bind(this), false );

    }

    windowResized() {
    
        resizeCanvas( windowWidth, windowHeight );
        
        app.renderer.setSize( windowWidth, windowHeight );
        player.camera.aspect = windowWidth / windowHeight;
        player.camera.updateProjectionMatrix();
        
    }
    
    setFullscreen( e ){
    
        document.body.requestFullscreen();
        setTimeout(()=>this.lockPointer(e), 400);
    
    }

    exitFullscreen(){

        document.exitFullscreen();

    }

    pointerLockChangeCallback() {

        if ( !document.pointerLockElement ) this.stopGame();

    }

}