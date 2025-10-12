export class QuadNode {
  constructor(x, y, width, height) {
    this.minX = x;
    this.minY = y;
    this.maxX = x + width;
    this.maxY = y + height;
    this.bodies = [];

    this.topLeft = null;
    this.topRight = null;
    this.bottomLeft = null;
    this.bottomRight = null;
    this.isLeaf = true;
  }
}
