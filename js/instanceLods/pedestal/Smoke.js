
class Smoke extends THREE.Points {

    constructor(){

        let fogGeo = new THREE.BufferGeometry();
		let fogMat = new THREE.PointsMaterial({
            color: 'rgb(5, 40, 5)',
            size: 3,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: false
		})		
        super( fogGeo, fogMat );
        this.frustumCulled = false;
        this.renderOrder = 1;
        this.positionBuffer = []; 
        app.scene.add( this );

        this.count = 0;
        this.generateData();

    }

    removeMatricesOnDistanceFromPoint(){}

    animate( delta ){

        let addParticle = ++this.count % floor( random( 45, 55 ) ) == 0;
        const vertices = new Float32Array(200*3);

        for(let i = 0; i < 200; i++){

            const particle = this.positionBuffer[i];
            if ( particle.active ){

                const m = map( particle.position.y, 0, 30, 0, 1);
                particle.velocity.x += random( -0.95 * m, 1 * m ) * delta;
                particle.velocity.z += random( -1 * m, 1 * m ) * delta;

                let velocity = particle.velocity.clone();
                if ( m === 0 ){
                    particle.velocity.x *= 0.4;
                    particle.velocity.z *= 0.4;
                }

                particle.position.add( velocity.multiplyScalar( delta ) );
                
    
                if ( particle.position.length() > 1000){
                    particle.position.multiplyScalar(0);
                    particle.velocity.set( 1.2, random( 5, 8 ), 0);
                    particle.active = false;
                }
                
                vertices[i * 3 + 0 ] = particle.position.x;
                vertices[i * 3 + 1 ] = particle.position.y;
                vertices[i * 3 + 2 ] = particle.position.z;
    
                this.positionBuffer[i] = particle;

            } else if ( addParticle ){

                particle.active = true;
                addParticle = false;
                this.positionBuffer[i] = particle;

            }

            
        }

        this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    }
    
    generateData(){

        const vertices = new Float32Array(200*3);
        for(let i = 0; i < 200; i++){
            this.positionBuffer.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3( 1.2, random( 5, 8 ), 0),
                active: false
            });
            vertices[i * 3 + 0 ] = 0;
            vertices[i * 3 + 1 ] = 0;
            vertices[i * 3 + 2 ] = 0;
        }

        this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    }

}