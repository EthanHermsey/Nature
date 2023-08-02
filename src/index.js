
import * as THREE from 'three';
import App from './js/app/App';

window.THREE = THREE;
window.app = new App();
window.setup = app.setup;
window.render = app.render;


window.keyPressed = ( e ) => {

	if ( app.running && e.code == 'KeyC' ) app.uiController.zoom( true );

};
window.keyReleased = ( e ) => {

	if ( app.running && e.code == 'KeyC' ) app.uiController.zoom( false );

};
window.onMouseMove = ( e ) => {

	if ( app.running ) app.player.mouseMoved( e );

};
window.mouseWheel = ( e ) => {

	if ( app.running ) app.player.mouseWheel( e );

};

