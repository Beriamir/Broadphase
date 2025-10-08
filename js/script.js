import { Vector } from './Vector.js';
import { QuadTree } from './QuadTree.js';
import { SpatialGrid } from './SpatialGrid.js';
import { SAP } from './SAP.js';
import { Circle } from './Circle.js';
import { Animator } from './Animator.js';

onload = function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const canvasWidth = (canvas.width = 800);
  const canvasHeight = (canvas.height = 600);

  const animator = new Animator(60);
  const quadTree = new QuadTree(0, 0, canvasWidth, canvasHeight, 4, 4);
  const spatialGrid = new SpatialGrid(0, 0, canvasWidth, canvasHeight, 40);
  const sAP = new SAP();

  const circles = [];
  const circlesNum = 1000;
  const circlesRadius = 10;

  const contacts = [];
  const contactsKey = new Set();
  const broadphases = ['QuadTree', 'SpatialGrid', 'SAP', 'BruteForce'];
  const broadphaseBtn = document.getElementById('broadphaseBtn');
  let broadphaseIndex = 0;
  let collisionChecks = 0;

  broadphaseBtn.addEventListener('click', () => {
    broadphaseIndex = (broadphaseIndex + 1) % broadphases.length;

    let bgColor = null;
    switch (broadphases[broadphaseIndex]) {
      case 'QuadTree':
        bgColor = 'green';
        break;
      case 'SpatialGrid':
        bgColor = 'gray';
        break;
      case 'SAP':
        bgColor = 'orange';
        break;
      case 'BruteForce':
        bgColor = 'red';
        break;
    }

    broadphaseBtn.style.backgroundColor = bgColor;
  });

  function initialize() {
    ctx.font = '12px Normal Verdana';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';

    for (let i = 0; i < circlesNum; i++) {
      const radius = Math.random() * circlesRadius + circlesRadius * 0.25;
      const x = Math.random() * (canvasWidth - radius * 2) + radius;
      const y = Math.random() * (canvasHeight - radius * 2) + radius;
      const circle = new Circle(x, y, radius);
      circle.linearVelocity.random().scale(0.1);

      circles.push(circle);
      quadTree.insert(circle);
      spatialGrid.insert(circle);
      sAP.insert(circle);
    }
  }

  function render(ctx, dt, broadphase) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    switch (broadphase) {
      case 'QuadTree':
        quadTree.render(ctx);
        break;
      case 'SpatialGrid':
        spatialGrid.render(ctx);
        break;
      case 'SAP':
        sAP.render(ctx);
        break;
    }

    for (const circle of circles) {
      circle.render(ctx);
    }

    const realtimeInfo = [
      `fps: ${Math.floor(1000 / dt)}`,
      `objects: ${circlesNum}`,
      `broadphase: ${broadphase}`,
      `collision checks: ${collisionChecks}`
    ];
    const lineHeight = 16;
    const n = realtimeInfo.length;
    const width = 200;
    const height = lineHeight * n;

    ctx.fillStyle = '#000000b6';
    ctx.fillRect(lineHeight, lineHeight, width, height);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < n; ++i) {
      ctx.fillText(realtimeInfo[i], lineHeight, lineHeight * i + lineHeight);
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
    const broadphase = broadphases[broadphaseIndex];

    render(ctx, dt, broadphase);

    contacts.length = 0;
    contactsKey.clear();
    collisionChecks = 0;
    if (broadphase == 'QuadTree') {
      quadTree.clear();
    } else if (broadphase == 'SAP') {
      sAP.update();
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
        case 'SAP':
          nearby = sAP.query(circle);
          break;
        case 'BruteForce':
          nearby = [];
          for (let j = i + 1; j < circles.length; ++j) {
            nearby.push(circles[j]);
          }
          break;
      }

      for (const other of nearby) {
        const id0 = circle.id;
        const id1 = other.id;
        const key = id0 < id1 ? id0 * circlesNum + id1 : id1 * circlesNum + id0;

        if (contactsKey.has(key)) {
          continue;
        } else contactsKey.add(key);

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
