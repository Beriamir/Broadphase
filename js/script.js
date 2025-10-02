import { Vector } from './Vector.js';
import { QuadTree } from './QuadTree.js';
import { SpatialGrid } from './SpatialGrid.js';
import { SweepPrune } from './SweepPrune.js';
import { Circle } from './Circle.js';
import { Animator } from './Animator.js';

onload = function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const canvasWidth = (canvas.width = 800);
  const canvasHeight = (canvas.height = 600);

  const animator = new Animator(60);
  const quadTree = new QuadTree(0, 0, canvasWidth, canvasHeight);
  const spatialGrid = new SpatialGrid(0, 0, canvasWidth, canvasHeight);
  const sweepPrune = new SweepPrune();

  const circles = [];
  const circlesCount = 1000;
  const circlesRadius = 10;

  const contacts = [];
  const broadphases = ['QuadTree', 'SpatialGrid', 'SweepPrune', 'BruteForce'];
  const broadphaseChangeBtn = document.getElementById('broadphaseChangeBtn');
  let broadphaseIndex = 0;
  let collisionChecks = 0;

  broadphaseChangeBtn.addEventListener('click', () => {
    broadphaseIndex = (broadphaseIndex + 1) % broadphases.length;

    let bgColor = null;
    switch (broadphases[broadphaseIndex]) {
      case 'QuadTree':
        bgColor = 'green';
        break;
      case 'SpatialGrid':
        bgColor = 'gray';
        break;
      case 'SweepPrune':
        bgColor = 'orange';
        break;
      case 'BruteForce':
        bgColor = 'red';
        break;
    }

    broadphaseChangeBtn.style.backgroundColor = bgColor;
  });

  function initialize() {
    ctx.font = '12px Normal Verdana';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';

    for (let i = 0; i < circlesCount; i++) {
      const radius = Math.random() * circlesRadius + circlesRadius * 0.25;
      const x = Math.random() * (canvasWidth - radius * 2) + radius;
      const y = Math.random() * (canvasHeight - radius * 2) + radius;
      const circle = new Circle(x, y, radius);
      circle.linearVelocity.random().scale(0.1);

      circles.push(circle);
      quadTree.insert(circle);
      spatialGrid.insert(circle);
      sweepPrune.insert(circle);
    }
  }

  function render(ctx, dt) {
    const broadphase = broadphases[broadphaseIndex];

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    switch (broadphase) {
      case 'QuadTree':
        quadTree.render(ctx);
        break;
      case 'SpatialGrid':
        spatialGrid.render(ctx);
        break;
      case 'SweepPrune':
        sweepPrune.render(ctx);
        break;
    }

    for (const circle of circles) {
      circle.render(ctx);
    }

    const views = [
      `fps: ${Math.floor(1000 / dt)}`,
      `objects: ${circlesCount}`,
      `broadphase: ${broadphase}`,
      `collision checks: ${collisionChecks}`
    ];
    const gap = 16;
    const n = views.length;
    const width = 200;
    const height = gap * n;

    ctx.fillStyle = '#000000b6';
    ctx.fillRect(gap, gap, width, height);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < n; ++i) {
      ctx.fillText(views[i], gap, gap * i + gap);
    }
  }

  function applyBoundaryLimits(circle) {
    if (circle.position.x < circle.radius) {
      circle.position.x = circle.radius;
      circle.linearVelocity.x *= -1;
    } else if (circle.position.x > canvasWidth - circle.radius) {
      circle.position.x = canvasWidth - circle.radius;
      circle.linearVelocity.x *= -1;
    }

    if (circle.position.y < circle.radius) {
      circle.position.y = circle.radius;
      circle.linearVelocity.y *= -1;
    } else if (circle.position.y > canvasHeight - circle.radius) {
      circle.position.y = canvasHeight - circle.radius;
      circle.linearVelocity.y *= -1;
    }
  }

  function collide(circleA, circleB) {
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

  function solveVelocity(contact) {
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

  function solvePosition(contact) {
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

  function update(dt) {
    render(ctx, dt);

    const broadphase = broadphases[broadphaseIndex];

    contacts.length = 0;
    collisionChecks = 0;
    if (broadphase == 'QuadTree') {
      quadTree.clear();
    } else if (broadphase == 'SweepPrune') {
      sweepPrune.update();
    }

    for (let i = 0; i < circles.length; ++i) {
      const circle = circles[i];
      let nearby = null;

      switch (broadphase) {
        case 'QuadTree':
          quadTree.insert(circle);
          nearby = quadTree.query(circle);
          break;
        case 'SpatialGrid':
          spatialGrid.update(circle);
          nearby = spatialGrid.query(circle);
          break;
        case 'SweepPrune':
          nearby = sweepPrune.query(circle);
          break;
        case 'BruteForce':
          nearby = [];
          for (let j = i + 1; j < circles.length; ++j) {
            nearby.push(circles[j]);
          }
          break;
      }

      for (const other of nearby) {
        const contact = collide(circle, other);

        if (contact) contacts.push(contact);
        collisionChecks++;
      }
    }

    for (const contact of contacts) {
      solveVelocity(contact);
      solvePosition(contact);
    }

    for (const circle of circles) {
      applyBoundaryLimits(circle);

      circle.position.add(circle.linearVelocity, dt);
      circle.updateBound();
    }
  }

  initialize();
  animator.animate(update);
};
