export class QuadTree {
  constructor(x, y, width, height, maxLength = 4, maxDepth = 4, depth = 1) {
    this.minX = x;
    this.minY = y;
    this.maxX = x + width;
    this.maxY = y + height;
    this.maxLength = maxLength;
    this.maxDepth = maxDepth;
    this.depth = depth;

    this.isLeaf = true;
    this.bodies = [];
    this.stack = [];
    this.queryId = -1;

    this.topLeft = null;
    this.topRight = null;
    this.bottomLeft = null;
    this.bottomRight = null;
  }

  branch() {
    const width = (this.maxX - this.minX) * 0.5;
    const height = (this.maxY - this.minY) * 0.5;
    const depth = this.depth + 1;

    this.topLeft = new QuadTree(
      this.minX,
      this.minY,
      width,
      height,
      this.maxLength,
      this.maxDepth,
      depth
    );
    this.topRight = new QuadTree(
      this.minX + width,
      this.minY,
      width,
      height,
      this.maxLength,
      this.maxDepth,
      depth
    );
    this.bottomLeft = new QuadTree(
      this.minX,
      this.minY + height,
      width,
      height,
      this.maxLength,
      this.maxDepth,
      depth
    );
    this.bottomRight = new QuadTree(
      this.minX + width,
      this.minY + height,
      width,
      height,
      this.maxLength,
      this.maxDepth,
      depth
    );
    this.isLeaf = false;
  }

  insert(body) {
    this.stack.length = 0;
    this.stack.push(this);

    while (this.stack.length) {
      const node = this.stack.pop();

      if (!body.bound.overlaps(node)) {
        continue;
      }

      if (node.bodies.length < node.maxLength || node.depth > node.maxDepth) {
        node.bodies.push(body);
        continue;
      }

      if (node.isLeaf) {
        node.branch();
      }

      this.stack.push(
        node.topLeft,
        node.topRight,
        node.bottomLeft,
        node.bottomRight
      );
    }
  }

  query(body) {
    const results = [];

    body.queryId = ++this.queryId;
    this.stack.length = 0;
    this.stack.push(this);

    while (this.stack.length) {
      const node = this.stack.pop();

      if (!body.bound.overlaps(node)) {
        continue;
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
    this.stack.push(this);

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
    this.stack.push(this);

    ctx.strokeStyle = 'green';
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
