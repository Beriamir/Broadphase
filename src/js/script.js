import Animator from './Animator.js';
import Circle from './Circle.js';
import SpatialGrid from './SpatialGrid.js';
import SpatialHashGrid from './SpatialHashGrid.js';
import QuadTree from './QuadTree.js';
import KDTree from './KDTree.js';
import SweepAndPrune from './SweepAndPrune.js';
import Config from './Config.js';
import Collision from './Collision.js';
import dat from './lib/dat.gui.mjs';

onload = function () {
  const guiContainer = document.getElementById('gui');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const canvasWidth = (canvas.width = 800);
  const canvasHeight = (canvas.height = 600);
  const animator = new Animator(60);
  const gui = new dat.GUI({
    hideable: true,
    autoPlace: false,
  });

  const circles = [];
  const nearby = [];
  const contacts = [];
  const contactsKey = new Set();

  let spatialGrid = null;
  let spatialHashGrid = null;
  let quadTree = null;
  let kDTree = null;
  let sweepAndPrune = null;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let guiStartX = 0;
  let guiStartY = 0;

  const controlsFolder = gui.addFolder('Live Controls');
  const statFolder = gui.addFolder('Realtime Performance');

  controlsFolder
    .add(Config, 'broadphase', [
      'Naive',
      'Spatial Grid',
      'Spatial Hash Grid',
      'QuadTree',
      'KD-Tree',
      'Sweep And Prune',
    ])
    .name('Broadphase');
  controlsFolder
    .add(Config, 'circlesCount', 1, 1000, 1)
    .onFinishChange(init)
    .name('Circles Count');
  controlsFolder
    .add(Config, 'circlesRadius', 1, 20, 1)
    .onChange((v) => circles.forEach((c) => (c.radius = Math.max(1, v))))
    .name('Circles Radius');
  controlsFolder.add(Config, 'showBroadphase').name('Show Broadphase');
  controlsFolder.open();

  statFolder.add(Config, 'fps').listen().name('FPS');
  statFolder.add(Config, 'collisionChecks').listen().name('Collision Checks');
  statFolder.open();

  guiContainer.appendChild(gui.domElement);

  guiContainer.addEventListener('pointerdown', (event) => {
    if (event.target.classList.contains('gui-header')) {
      const rect = guiContainer.getBoundingClientRect();
      guiStartX = rect.left;
      guiStartY = rect.top;

      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
    }
  });

  window.addEventListener('pointermove', (event) => {
    if (dragging) {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      guiContainer.style.left = guiStartX + deltaX + 'px';
      guiContainer.style.top = guiStartY + deltaY + 'px';
    }
  });

  guiContainer.addEventListener('pointerup', (event) => {
    dragging = false;
  });

  function init() {
    circles.length = 0;
    spatialGrid = new SpatialGrid(0, 0, canvasWidth, canvasHeight, 20);
    spatialHashGrid = new SpatialHashGrid(20, Config.circlesCount * 2);
    quadTree = new QuadTree(0, 0, canvasWidth, canvasHeight, 4);
    kDTree = new KDTree();
    sweepAndPrune = new SweepAndPrune();

    for (let i = 0; i < Config.circlesCount; i++) {
      const radius = Config.circlesRadius;
      const x = Math.random() * (canvasWidth - radius * 2) + radius;
      const y = Math.random() * (canvasHeight - radius * 2) + radius;
      const circle = new Circle(x, y, radius);

      circle.linearVelocity.random().scale(0.1);
      circles.push(circle);

      spatialGrid.insert(circle);
      spatialHashGrid.insert(circle);
      quadTree.insert(circle);
      kDTree.insert(circle);
      sweepAndPrune.insert(circle);
    }
  }

  function render(ctx) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (Config.showBroadphase) {
      ({
        'Spatial Grid': spatialGrid,
        'Spatial Hash Grid': spatialHashGrid,
        QuadTree: quadTree,
        'KD-Tree': kDTree,
        'Sweep And Prune': sweepAndPrune,
      })[Config.broadphase]?.render(ctx);
    }

    for (const circle of circles) {
      circle.render(ctx);
    }
  }

  function update(dt) {
    contacts.length = 0;
    contactsKey.clear();
    Config.collisionChecks = 0;
    Config.fps = Math.floor(1000 / dt);

    ({
      'Spatial Hash Grid': spatialHashGrid,
      QuadTree: quadTree,
      'KD-Tree': kDTree,
      'Sweep And Prune': sweepAndPrune,
    })[Config.broadphase]?.update();

    for (let i = 0; i < circles.length; ++i) {
      const circle = circles[i];
      nearby.length = 0;

      switch (Config.broadphase) {
        case 'Spatial Grid':
          spatialGrid.update(circle);
          spatialGrid.query(circle, nearby);
          break;
        case 'Spatial Hash Grid':
          spatialHashGrid.query(circle, nearby);
          break;
        case 'QuadTree':
          quadTree.insert(circle);
          quadTree.query(circle, nearby);
          break;
        case 'KD-Tree':
          kDTree.query(circle, nearby);
          break;
        case 'Sweep And Prune':
          sweepAndPrune.query(circle, nearby);
          break;
        case 'Naive':
          for (let j = i + 1; j < circles.length; j++) {
            nearby.push(circles[j]);
          }
          break;
      }

      for (const other of nearby) {
        const id0 = circle.id;
        const id1 = other.id;
        const key =
          id0 < id1
            ? id0 * Config.circlesCount + id1
            : id1 * Config.circlesCount + id0;

        if (contactsKey.has(key)) continue;
        else contactsKey.add(key);

        const contact = Collision.collide(circle, other);

        if (contact) contacts.push(contact);
        Config.collisionChecks++;
      }
    }

    for (const contact of contacts) {
      Collision.solveVelocity(contact);
      Collision.solvePosition(contact);
    }

    for (const circle of circles) {
      const worldMinX = circle.radius;
      const worldMinY = circle.radius;
      const worldMaxX = canvasWidth - circle.radius;
      const worldMaxY = canvasHeight - circle.radius;

      if (circle.position.x < worldMinX) {
        circle.position.x = worldMinX;
        circle.linearVelocity.x *= -1;
      } else if (circle.position.x > worldMaxX) {
        circle.position.x = worldMaxX;
        circle.linearVelocity.x *= -1;
      }

      if (circle.position.y < worldMinY) {
        circle.position.y = worldMinY;
        circle.linearVelocity.y *= -1;
      } else if (circle.position.y > worldMaxY) {
        circle.position.y = worldMaxY;
        circle.linearVelocity.y *= -1;
      }

      circle.updatePosition(dt);
      circle.updateBound();
    }
  }

  init();
  animator.animate((dt) => {
    render(ctx);
    update(dt);
  });
};
