export default class KDNode {
  constructor(body, axis, left = null, right = null) {
    this.body = body;
    this.axis = axis;
    this.left = left;
    this.right = right;

    this.minX = body.bound.minX;
    this.minY = body.bound.minY;
    this.maxX = body.bound.maxX;
    this.maxY = body.bound.maxY;

    if (left) {
      if (left.minX < this.minX) this.minX = left.minX;
      if (left.minY < this.minY) this.minY = left.minY;
      if (left.maxX > this.maxX) this.maxX = left.maxX;
      if (left.maxY > this.maxY) this.maxY = left.maxY;
    }

    if (right) {
      if (right.minX < this.minX) this.minX = right.minX;
      if (right.minY < this.minY) this.minY = right.minY;
      if (right.maxX > this.maxX) this.maxX = right.maxX;
      if (right.maxY > this.maxY) this.maxY = right.maxY;
    }
  }
}
