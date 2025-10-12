export class Bound {
  constructor(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  update(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  overlaps(bound) {
    return (
      this.maxX >= bound.minX &&
      this.maxY >= bound.minY &&
      this.minX <= bound.maxX &&
      this.minY <= bound.maxY
    );
  }
}
