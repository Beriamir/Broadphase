import { KDNode } from './KDNode.js';

export class KDTree {
  constructor() {
    this.bodies = [];
    this.stack = [];
    this.queryId = -1;
  }

  insert(body) {
    let exists = false;
    for (let i = 0; i < this.bodies.length; ++i) {
      if (body.id === this.bodies[i].id) {
        exists = true;
        break;
      }
    }

    if (!exists) this.bodies.push(body);
  }

  remove(body) {
    for (let i = 0; i < this.bodies.length; ++i) {
      if (body.id === this.bodies[i].id) {
        this.bodies[i] = this.bodies[this.bodies.length - 1];
        this.bodies.pop();
        break;
      }
    }
  }

  partition(bodies, start, end, axis) {
    const pivotVal =
      axis === 0 ? bodies[end].position.x : bodies[end].position.y;

    let i = start;
    for (let j = start; j < end; ++j) {
      const jVal = axis === 0 ? bodies[j].position.x : bodies[j].position.y;

      if (jVal < pivotVal) {
        const tmp = bodies[j];

        bodies[j] = bodies[i];
        bodies[i] = tmp;
        i++;
      }
    }

    const tmp = bodies[end];

    bodies[end] = bodies[i];
    bodies[i] = tmp;

    return i;
  }

  quickSelect(bodies, axis, left, right, k) {
    while (left < right) {
      const pivotIndex = this.partition(bodies, left, right, axis);

      if (k < pivotIndex) right = pivotIndex - 1;
      else if (k > pivotIndex) left = pivotIndex + 1;
      else break;
    }
  }

  build(bodies, axis = 0, start = 0, end = bodies.length) {
    if (start >= end) return null;

    axis %= 2;
    const mid = Math.floor((start + end) / 2);

    this.quickSelect(bodies, axis, start, end - 1, mid);

    const node = new KDNode(
      bodies[mid],
      axis,
      this.build(bodies, axis + 1, start, mid),
      this.build(bodies, axis + 1, mid + 1, end)
    );

    return node;
  }

  update() {
    this.node = this.build(this.bodies);
  }

  query(body, results = []) {
    this.stack.length = 0;
    this.stack.push(this.node);
    body.queryId = ++this.queryId;

    while (this.stack.length) {
      const node = this.stack.pop();

      if (!node) continue;

      const other = node.body;

      if (body.bound.overlaps(other.bound) && body.queryId !== other.queryId) {
        other.queryId = body.queryId;
        results.push(other);
      }

      if (node.axis === 0) {
        if (body.position.x <= other.position.x) {
          this.stack.push(node.left);
          if (body.bound.maxX >= other.bound.minX) this.stack.push(node.right);
        } else {
          this.stack.push(node.right);
          if (body.bound.minX <= other.bound.maxX) this.stack.push(node.left);
        }
      } else {
        if (body.position.y <= other.position.y) {
          this.stack.push(node.left);
          if (body.bound.maxY >= other.bound.minY) this.stack.push(node.right);
        } else {
          this.stack.push(node.right);
          if (body.bound.minY <= other.bound.maxY) this.stack.push(node.left);
        }
      }
    }

    return results;
  }

  render(ctx) {
    this.stack.length = 0;
    this.stack.push(this.node);

    ctx.strokeStyle = 'violet';
    ctx.beginPath();
    while (this.stack.length) {
      const node = this.stack.pop();

      if (!node) continue;

      ctx.moveTo(node.minX, node.minY);
      ctx.lineTo(node.maxX, node.minY);
      ctx.lineTo(node.maxX, node.maxY);
      ctx.lineTo(node.minX, node.maxY);
      ctx.lineTo(node.minX, node.minY);

      if (node.axis === 0) {
        ctx.moveTo(node.body.position.x, node.minY);
        ctx.lineTo(node.body.position.x, node.maxY);
      } else {
        ctx.moveTo(node.minX, node.body.position.y);
        ctx.lineTo(node.maxX, node.body.position.y);
      }

      this.stack.push(node.left, node.right);
    }
    ctx.stroke();
  }
}
