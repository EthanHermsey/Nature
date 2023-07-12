









// Ripped and modified From THREE.js Mesh raycast
// https://github.com/mrdoob/three.js/blob/0aa87c999fe61e216c1133fba7a95772b503eddf/src/objects/Mesh.js#L115
var vA = new THREE.Vector3();
var vB = new THREE.Vector3();
var vC = new THREE.Vector3();

var uvA = new THREE.Vector2();
var uvB = new THREE.Vector2();
var uvC = new THREE.Vector2();

var intersectionPoint = new THREE.Vector3();
var intersectionPointWorld = new THREE.Vector3();

function checkIntersection( object, material, raycaster, ray, pA, pB, pC, point ) {

	var intersect;
	if ( material.side === THREE.BackSide ) {

		intersect = ray.intersectTriangle( pC, pB, pA, true, point );

	} else {

		intersect = ray.intersectTriangle( pA, pB, pC, material.side !== THREE.DoubleSide, point );

	}

	if ( intersect === null ) return null;

	intersectionPointWorld.copy( point );
	intersectionPointWorld.applyMatrix4( object.matrixWorld );

	var distance = raycaster.ray.origin.distanceTo( intersectionPointWorld );

	if ( distance < raycaster.near || distance > raycaster.far ) return null;

	return {
		distance: distance,
		point: intersectionPointWorld.clone(),
		object: object
	};

}

function checkBufferGeometryIntersection( object, raycaster, ray, position, uv, a, b, c ) {

    vA.fromBufferAttribute( position, a )
    vB.fromBufferAttribute( position, b )
    vC.fromBufferAttribute( position, c )

	var intersection = checkIntersection( object, object.material, raycaster, ray, vA, vB, vC, intersectionPoint );

	if ( intersection ) {

		if ( uv ) {

			uvA.fromBufferAttribute( uv, a );
			uvB.fromBufferAttribute( uv, b );
			uvC.fromBufferAttribute( uv, c );

			intersection.uv = THREE.Triangle.getUV( intersectionPoint, vA, vB, vC, uvA, uvB, uvC, new THREE.Vector2( ) );

		}

		const plane = new THREE.Plane().setFromCoplanarPoints( vA, vB, vC );
		intersection.face = { normal: plane.normal }
		intersection.faceIndex = a;

	}

	return intersection;

}


// https://github.com/mrdoob/three.js/blob/0aa87c999fe61e216c1133fba7a95772b503eddf/src/objects/Mesh.js#L258
function intersectTri( mesh, geo, raycaster, ray, tri, intersections ) {

	const triOffset = tri * 3;
	const a = geo.index.getX( triOffset );
	const b = geo.index.getX( triOffset + 1 );
	const c = geo.index.getX( triOffset + 2 );

	const intersection = checkBufferGeometryIntersection( mesh, raycaster, ray, geo.attributes.position, geo.attributes.uv, a, b, c );

	if ( intersection ) {

		intersection.faceIndex = tri;
		if ( intersections ) intersections.push( intersection );
		return intersection;

	}

	return null;

};
