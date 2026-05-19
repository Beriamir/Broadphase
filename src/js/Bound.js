export default class Bound {
  constructor(minX, minY, maxX, maxY) {
    this.minX = minX
    this.minY = minY
    this.maxX = maxX
    this.maxY = maxY
    this.width = maxX - minX
    this.height = maxY - minY
  }

  get meanX() {
    return (this.minX + this.maxX) * 0.5
  }
  get meanY() {
    return (this.minY + this.maxY) * 0.5
  }
  get perimeter() {
    const width = this.maxX - this.minX
    const height = this.maxY - this.minY

    return 2 * (width + height)
  }

  copy(aabb) {
    this.minX = aabb.minX
    this.minY = aabb.minY
    this.maxX = aabb.maxX
    this.maxY = aabb.maxY

    return this
  }

  enlarge(value) {
    this.minX -= value
    this.minY -= value
    this.maxX += value
    this.maxY += value

    return this
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

  contains(aabb) {
    return (
      this.minX <= aabb.minX &&
      this.minY <= aabb.minY &&
      this.maxX >= aabb.maxX &&
      this.maxY >= aabb.maxY
    )
  }

  union(aabb, out = new Bound()) {
    out.minX = Math.min(this.minX, aabb.minX)
    out.minY = Math.min(this.minY, aabb.minY)
    out.maxX = Math.max(this.maxX, aabb.maxX)
    out.maxY = Math.max(this.maxY, aabb.maxY)

    return out
  }

  unionPerimeter(aabb) {
    const minX = Math.min(this.minX, aabb.minX)
    const minY = Math.min(this.minY, aabb.minY)
    const maxX = Math.max(this.maxX, aabb.maxX)
    const maxY = Math.max(this.maxY, aabb.maxY)

    const width = maxX - minX
    const height = maxY - minY

    return 2 * (width + height)
  }
}
