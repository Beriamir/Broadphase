import Vector from './Vector.js';

export default class Collision {
	static collide(circleA, circleB) {
		const dir = Vector.sub(circleB.position, circleA.position);
		const distSq = dir.magnitudeSq();
		const radii = circleA.radius + circleB.radius;

		if (distSq === 0 || distSq >= radii * radii) {
			return null;
		}

		const dist = Math.sqrt(distSq);
		const normal = dir.scale(1 / dist);
		const overlap = radii - dist;

		return {
			circleA,
			circleB,
			normal,
			overlap
		};
	}

	static solveVelocity(contact) {
		const circleA = contact.circleA;
		const circleB = contact.circleB;
		const normal = contact.normal;
		const relVel = Vector.sub(circleB.linearVelocity, circleA.linearVelocity);
		const velNormal = relVel.dot(normal);

		if (velNormal > 0) return;

		const epsilon = 1;
		const effMass = circleA.inverseMass + circleB.inverseMass;
		const impulse = (-(1 + epsilon) * velNormal) / effMass;

		circleA.linearVelocity.add(normal, -impulse * circleA.inverseMass);
		circleB.linearVelocity.add(normal, impulse * circleB.inverseMass);
	}

	static solvePosition(contact) {
		const circleA = contact.circleA;
		const circleB = contact.circleB;
		const normal = contact.normal;
		const overlap = contact.overlap;

		const beta = 0.1;
		const effMass = circleA.inverseMass + circleB.inverseMass;
		const impulse = (overlap * beta) / effMass;

		circleA.position.add(normal, -impulse * circleA.inverseMass);
		circleB.position.add(normal, impulse * circleB.inverseMass);
	}
}
