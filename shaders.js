// eslint-disable-next-line no-unused-vars
let shaders = {
	netMesh: {
		vertexShader: `
		
			varying vec3 vPos;
			varying vec3 vNormal;
			
			#include <common>
    		
			#include <fog_pars_vertex>
			#include <logdepthbuf_pars_vertex>
			#include <shadowmap_pars_vertex>

			void main(){

				#include <beginnormal_vertex>    
				#include <defaultnormal_vertex>
				#include <begin_vertex> 
				#include <project_vertex>
				#include <worldpos_vertex>

				// vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;

				vPos = vec3(modelMatrix * vec4( position, 1.0 ));
				
				vNormal = normalize(normal);        

				#include <fog_vertex>
				#include <logdepthbuf_vertex>
				#include <shadowmap_vertex>

			}
		
		`,
		fragmentShader: `
		
			const bool receiveShadow = true;

			uniform sampler2D tDiff[2];
			varying vec3 vNormal;
			varying vec3 vPos;		

			#include <common>			
			#include <packing>

			#include <fog_pars_fragment>
			#include <logdepthbuf_pars_fragment>
			#include <shadowmap_pars_fragment>
			#include <shadowmask_pars_fragment>

			vec3 getTriPlanarBlend(vec3 _wNorm){
				// in wNorm is the world-space normal of the fragment
				vec3 blending = abs( _wNorm );
				blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
				float b = (blending.x + blending.y + blending.z);
				blending /= vec3(b, b, b);
				return blending;
			}

			void main(){
				
				float normalRepeat = 0.015;

				vec3 blending = getTriPlanarBlend(vNormal);
				blending *= blending;			

				vec3 xaxis = texture2D( tDiff[0], mod(vPos.yz * normalRepeat, 1.0) ).rgb;			
				vec3 yaxis = (0.8 * texture2D( tDiff[1], mod(vPos.xz * normalRepeat * 5.5, 1.0)).rgb) * 1.2;
				vec3 zaxis = texture2D( tDiff[0], mod(vPos.xy * normalRepeat, 1.0)).rgb;

				if ( vPos.y > 555.0 ){

					float mix = smoothstep(555.0, 625.0, vPos.y);
					yaxis -= mix * yaxis;
					yaxis += mix * 0.8 * texture2D( tDiff[0], mod(vPos.xz * normalRepeat, 1.0)).rgb;

				}
				
				vec3 normalTex = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;

				vec3 norm = normalize(vNormal);
				vec3 lightDir = normalize(vec3(1000.0, 1000.0, 0.0) - vPos);
				float diff = 0.5 + max(dot(norm, lightDir), 0.0) * 0.5;
				float shadow = getShadowMask();
				
				gl_FragColor = vec4( diff * normalTex * shadow, 1.0 );

				#include <fog_fragment>
				#include <logdepthbuf_fragment>
			}
	
		`
	},
	cliffs: {
		vertexShader: `
		
			varying vec3 vPos;
			varying vec3 vNormal;
			
			#include <common>
			#include <fog_pars_vertex>
			#include <logdepthbuf_pars_vertex>

			

			void main(){

				vPos = vec3(modelMatrix * vec4( position, 1.0 ));				
				vNormal = normalize(normal);
				
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;

				#include <fog_vertex>
				#include <logdepthbuf_vertex>

			}
		
		`,
		fragmentShader: `
		
			uniform sampler2D tDiff[2];
			uniform sampler2D tNorm;
			varying vec3 vNormal;
			varying vec3 vPos;		

			#include <common>
			#include <fog_pars_fragment>
			#include <logdepthbuf_pars_fragment>

			vec3 getTriPlanarBlend(vec3 _wNorm){
				// in wNorm is the world-space normal of the fragment
				vec3 blending = abs( _wNorm );
				blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
				float b = (blending.x + blending.y + blending.z);
				blending /= vec3(b, b, b);
				return blending;
			}

			vec3 getTriPlanarTexture(){
				float triRepeat = 0.016;

				vec3 blending = getTriPlanarBlend(vNormal);
				blending *= blending;			

				vec3 xaxis = texture2D( tDiff[0], mod(vPos.zy * triRepeat, 1.0) ).rgb;			
				vec3 yaxis = texture2D( tDiff[1], mod(vPos.zx * triRepeat, 1.0) ).rgb;
				vec3 zaxis = texture2D( tDiff[0], mod(vPos.yx * triRepeat, 1.0) ).rgb;

				// if ( vPos.y > 555.0 ){

				// 	float mix = smoothstep(555.0, 625.0, vPos.y);
				// 	yaxis -= mix * yaxis;
				// 	yaxis += mix * 0.8 * texture2D( tDiff[0], mod(vPos.xz * triRepeat, 1.0)).rgb;

				// }

				return xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;
			}

			vec3 getTriPlanarNormal(){
				float triRepeat = 0.016;

				vec3 blending = getTriPlanarBlend(vNormal);
				blending *= blending;			

				vec3 xaxis = texture2D( tNorm, mod(vPos.zy * triRepeat, 1.0) ).rgb;			
				vec3 yaxis = texture2D( tNorm, mod(vPos.zx * triRepeat, 1.0) ).rgb;
				vec3 zaxis = texture2D( tNorm, mod(vPos.yx * triRepeat, 1.0) ).rgb;

				// if ( vPos.y > 555.0 ){

				// 	float mix = smoothstep(555.0, 625.0, vPos.y);
				// 	yaxis -= mix * yaxis;
				// 	yaxis += mix * 0.8 * texture2D( tDiff[0], mod(vPos.xz * triRepeat, 1.0)).rgb;

				// }

				return xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;
			}

			void main(){
				
				vec3 triNorm = getTriPlanarNormal();
				vec3 triTex = getTriPlanarTexture();

				vec3 norm = normalize( vNormal * triNorm );
				vec3 lightDir = normalize(vec3(1000.0, 1000.0, 0.0) - vPos);
				float diff = 0.4 + max(dot(norm, lightDir), 0.0) * 0.6;
				
				gl_FragColor = vec4( diff * triTex, 1.0 );

				#include <fog_fragment>
				#include <logdepthbuf_fragment>
			}
	
		`
	}
};
