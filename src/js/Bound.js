export default class Bound {
  constructor(minX, minY, maxX, maxY) {
    this.minX = minX
    this.minY = minY
    this.maxX = maxX
    this.maxY = maxY
    this.width = maxX - minX
    this.height = maxY - minY
  }

  get mean() {
    return {
      posX: (this.minX + this.maxX) * 0.5,
      posY: (this.minY + this.maxY) * 0.5
    }
  }

  get perimeter() {
    return 2 * (this.width + this.height)
  }

  update(minX, minY, maxX, maxY) {
    this.minX = minX
    this.minY = minY
    this.maxX = maxX
    this.maxY = maxY
    this.width = maxX - minX
    this.height = maxY - minY
  }

  overlaps(bound) {
    return (
      this.maxX >= bound.minX &&
      this.maxY >= bound.minY &&
      this.minX <= bound.maxX &&
      this.minY <= bound.maxY
    )
  }

  union(aabb) {
    return new Bound(
      Math.min(this.minX, aabb.minX),
      Math.min(this.minY, aabb.minY),
      Math.max(this.maxX, aabb.maxX),
      Math.max(this.maxY, aabb.maxY)
    )
  }

  contains(aabb) {
    return (
      this.minX <= aabb.minX &&
      this.minY <= aabb.minY &&
      this.maxX >= aabb.maxX &&
      this.maxY >= aabb.maxY
    )
  }
}
