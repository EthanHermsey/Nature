
import * as THREE from 'three';
import App from './js/app/App';

console.warn = () => {};

window.THREE = THREE;
window.app = new App();

window.setup = () => app.setup();
window.render = () => app.render();
window.keyPressed = ( e ) => app.player.keyPressed( e );
window.keyReleased = ( e ) => app.player.keyReleased( e );
window.onMouseMove = ( e ) => app.player.mouseMoved( e );
window.mouseWheel = ( e ) => app.player.mouseWheel( e );

