
import * as THREE from 'three';
import App from './js/app/App';

console.warn = () => {};

window.THREE = THREE;
window.app = new App();

window.setup = () => app.setup();
window.render = () => app.render();
window.keyPressed = ( e ) => {

	if ( app.running && e.code == 'KeyC' ) app.zoom( true );
	if ( app.running && e.code == 'Escape' ) app.stopGame();

};
window.keyReleased = ( e ) => {

	if ( app.running && e.code == 'KeyC' ) app.zoom( false );

};
window.onMouseMove = ( e ) => {

	if ( app.running ) app.player.mouseMoved( e );

};
window.mouseWheel = ( e ) => {

	if ( app.running ) app.player.mouseWheel( e );

};

