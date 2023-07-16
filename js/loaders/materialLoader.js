const materials = {};



//     .                                          o8o              
//   .o8                                          `"'              
// .o888oo  .ooooo.  oooo d8b oooo d8b  .oooo.   oooo  ooo. .oo.   
//   888   d88' `88b `888""8P `888""8P `P  )88b  `888  `888P"Y88b  
//   888   888ooo888  888      888      .oP"888   888   888   888  
//   888 . 888    .o  888      888     d8(  888   888   888   888  
//   "888" `Y8bod8P' d888b    d888b    `Y888""8o o888o o888o o888o 
let rocktex = new THREE.TextureLoader().load( './resources/terrain/rock.jpg' );
let grasstex = new THREE.TextureLoader().load( './resources/terrain/grass.png' );
rocktex.anisotropy = 8;
grasstex.anisotropy = 8;

materials['terrain'] = new THREE.MeshLambertMaterial( {
    color: 'rgb(100, 100, 100)',
    dithering: true,
    map: rocktex
} );
materials['terrain'].onBeforeCompile = ( shader ) => {
    
    shader.uniforms.tDiff = {
        value: [
            rocktex,
            grasstex
        ]
    };

    shader.vertexShader = 'attribute float force_stone;\nvarying float vFs;\nvarying vec3 vPos;\nvarying vec3 vNormal2;\n' + shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vPos = vec3( worldPosition );
        vNormal2 = normal;
        vFs = force_stone;
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_pars_fragment>',
        `
        uniform sampler2D tDiff[2];
        varying vec3 vPos;
        varying vec3 vNormal2;
        varying float vFs;

        vec3 getTriPlanarBlend(vec3 _wNorm){
            vec3 blending = vec3( _wNorm );                
            blending = abs(blending);

            blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
            float b = (blending.x + blending.y + blending.z);
            blending /= vec3(b, b, b);
            return blending * blending;
        }

        vec4 getTriPlanarTexture(){
                                
            //mesh scaled
            float rockRepeat = 0.015;
            float grassRepeat = 0.03;

            vec3 blending = getTriPlanarBlend( vNormal2 );
            vec3 xaxis = texture2D( tDiff[0], mod(vPos.yz * rockRepeat, 1.0) ).rgb;
            vec3 yaxis;

            if ( vNormal2.y < 0.2){
                yaxis = texture2D( tDiff[0], mod(vPos.xz * rockRepeat, 1.0) ).rgb;
            } else {
                yaxis = mix(
                    texture2D( tDiff[1], mod(vPos.xz * grassRepeat, 1.0) ).rgb,
                    texture2D( tDiff[0], mod(vPos.xz * rockRepeat, 1.0) ).rgb,
                    vFs
                );
            }
            vec3 zaxis = texture2D( tDiff[0], mod(vPos.xy * rockRepeat, 1.0) ).rgb;

            return vec4( xaxis * blending.x + yaxis * blending.y + zaxis * blending.z, 1.0 );
        }
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace( '#include <map_fragment>',`` );

    shader.fragmentShader = shader.fragmentShader.replace( 
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `
        vec3 norm = normalize(vNormal2);
        vec3 lightDir = normalize(vec3(1000.0, 1000.0, 0.0) - vPos);
        float diff = 0.9 + max(dot(norm, lightDir), 0.0) * 0.1;
        vec4 diffuseColor =  vec4( getTriPlanarTexture().rgb * diff, opacity );
        `			
    );

};