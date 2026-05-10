export default class BVHNode {
  constructor(id, aabb, data) {
    this.id = id
    this.aabb = aabb
    this.data = data
    this.height = 0
    this.parent = null
    this.child1 = null
    this.child2 = null
  }
}
