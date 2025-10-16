import { Vector } from './Vector.js';

export function solveWallCollision(x, y, width, height, circle) {
  if (circle.position.x < x + circle.radius) {
    circle.position.x = x + circle.radius;
    circle.linearVelocity.x *= -1;
  } else if (circle.position.x > width - circle.radius) {
    circle.position.x = width - circle.radius;
    circle.linearVelocity.x *= -1;
  }

  if (circle.position.y < y + circle.radius) {
    circle.position.y = y + circle.radius;
    circle.linearVelocity.y *= -1;
  } else if (circle.position.y > height - circle.radius) {
    circle.position.y = height - circle.radius;
    circle.linearVelocity.y *= -1;
  }
}

export function collide(circleA, circleB) {
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

export function solveVelocity(contact) {
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

export function solvePosition(contact) {
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
