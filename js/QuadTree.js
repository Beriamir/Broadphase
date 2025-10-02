import { Bound } from './Bound.js';

class Node {
  constructor(x, y, w, h, level = 1) {
    this.bound = new Bound(x, y, x + w, y + h);
    this.bodies = [];
    this.isLeaf = true;
    this.level = level;
  }
}

export class QuadTree {
  constructor(x, y, w, h, capacity = 4, depth = 4) {
    this.node = new Node(x, y, w, h);
    this.capacity = capacity;
    this.depth = depth;
    this.queryId = -1;
  }

  branch(node) {
    const x = node.bound.minX;
    const y = node.bound.minY;
    const hw = node.bound.width * 0.5;
    const hh = node.bound.height * 0.5;
    const l = node.level + 1;

    node.tLeft = new Node(x, y, hw, hh, l);
    node.tRight = new Node(x + hw, y, hw, hh, l);
    node.bLeft = new Node(x, y + hh, hw, hh, l);
    node.bRight = new Node(x + hw, y + hh, hw, hh, l);
    node.isLeaf = false;
  }

  _insert(body, node) {
    if (!node.bound.overlaps(body.bound)) {
      return null;
    }

    if (node.bodies.length < this.capacity || node.level > this.depth) {
      node.bodies.push(body);
      return null;
    }

    if (node.isLeaf) {
      this.branch(node);
    }

    this._insert(body, node.tLeft);
    this._insert(body, node.tRight);
    this._insert(body, node.bLeft);
    this._insert(body, node.bRight);
  }

  insert(body) {
    this._insert(body, this.node);
  }

  _query(body, node, results) {
    if (!node.bound.overlaps(body.bound)) {
      return null;
    }

    for (let i = 0; i < node.bodies.length; ++i) {
      const neighbor = node.bodies[i];

      if (
        body.queryId !== neighbor.queryId &&
        body.bound.overlaps(neighbor.bound)
      ) {
        neighbor.queryId = body.queryId;
        results.push(neighbor);
      }
    }

    if (!node.isLeaf) {
      this._query(body, node.tLeft, results);
      this._query(body, node.tRight, results);
      this._query(body, node.bLeft, results);
      this._query(body, node.bRight, results);
    }
  }

  query(body) {
    const results = [];

    body.queryId = ++this.queryId;
    this._query(body, this.node, results);

    return results;
  }

  _clear(node) {
    node.bodies.length = 0;

    if (!node.isLeaf) {
      this._clear(node.tLeft);
      this._clear(node.tRight);
      this._clear(node.bLeft);
      this._clear(node.bRight);
      node.isLeaf = true;
    }
  }

  clear() {
    this._clear(this.node);
  }

  _draw(ctx, node) {
    const minX = node.bound.minX;
    const minY = node.bound.minY;
    const maxX = node.bound.maxX;
    const maxY = node.bound.maxY;

    ctx.moveTo(minX, minY);
    ctx.lineTo(maxX, minY);
    ctx.lineTo(maxX, maxY);
    ctx.lineTo(minX, maxY);
    ctx.lineTo(minX, minY);

    if (!node.isLeaf) {
      this._draw(ctx, node.tLeft);
      this._draw(ctx, node.tRight);
      this._draw(ctx, node.bLeft);
      this._draw(ctx, node.bRight);
    }
  }

  render(ctx) {
    ctx.strokeStyle = 'green';

    ctx.beginPath();
    this._draw(ctx, this.node);
    ctx.stroke();
  }
}
