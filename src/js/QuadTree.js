import { QuadNode } from './QuadNode.js';

export class QuadTree {
  constructor(x, y, width, height, length) {
    this.node = new QuadNode(x, y, width, height);
    this.length = length;
    this.stack = [];
    this.queryId = -1;
  }

  branch(node) {
    const x = node.minX;
    const y = node.minY;
    const hw = (node.maxX - node.minX) * 0.5;
    const hh = (node.maxY - node.minY) * 0.5;

    node.topLeft = new QuadNode(x, y, hw, hh);
    node.topRight = new QuadNode(x + hw, y, hw, hh);
    node.bottomLeft = new QuadNode(x, y + hh, hw, hh);
    node.bottomRight = new QuadNode(x + hw, y + hh, hw, hh);
    node.isLeaf = false;
  }

  insert(body) {
    this.stack.length = 0;
    this.stack.push(this.node);

    while (this.stack.length) {
      const node = this.stack.pop();

      if (!body.bound.overlaps(node)) {
        continue;
      }

      if (node.bodies.length < this.length) {
        node.bodies.push(body);
        continue;
      }

      if (node.isLeaf) {
        this.branch(node);
      }

      this.stack.push(
        node.topLeft,
        node.topRight,
        node.bottomLeft,
        node.bottomRight
      );
    }
  }

  query(body, results = []) {
    this.stack.length = 0;
    this.stack.push(this.node);
    body.queryId = ++this.queryId;

    while (this.stack.length) {
      const node = this.stack.pop();

      if (!body.bound.overlaps(node)) {
        continue;
      }

      for (let i = 0; i < node.bodies.length; ++i) {
        const neighbor = node.bodies[i];

        if (
          body.bound.overlaps(neighbor.bound) &&
          body.queryId !== neighbor.queryId
        ) {
          neighbor.queryId = body.queryId;
          results.push(neighbor);
        }
      }

      if (!node.isLeaf) {
        this.stack.push(
          node.topLeft,
          node.topRight,
          node.bottomLeft,
          node.bottomRight
        );
      }
    }

    return results;
  }

  clear() {
    this.queryId = 0;
    this.stack.length = 0;
    this.stack.push(this.node);

    while (this.stack.length) {
      const node = this.stack.pop();

      node.bodies.length = 0;
      if (!node.isLeaf) {
        this.stack.push(
          node.topLeft,
          node.topRight,
          node.bottomLeft,
          node.bottomRight
        );
        node.isLeaf = true;
      }
    }
  }

  render(ctx) {
    this.stack.length = 0;
    this.stack.push(this.node);

    ctx.strokeStyle = '#11f811';
    ctx.beginPath();
    while (this.stack.length) {
      const node = this.stack.pop();

      ctx.moveTo(node.minX, node.minY);
      ctx.lineTo(node.maxX, node.minY);
      ctx.lineTo(node.maxX, node.maxY);
      ctx.lineTo(node.minX, node.maxY);
      ctx.lineTo(node.minX, node.minY);

      if (!node.isLeaf) {
        this.stack.push(
          node.topLeft,
          node.topRight,
          node.bottomLeft,
          node.bottomRight
        );
      }
    }
    ctx.stroke();
  }
}
