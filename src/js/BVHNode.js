export default class BVHNode {
  constructor(id, bound, data) {
    this.id = id
    this.bound = bound
    this.data = data
    this.height = 0,
    this.margin = 5
    this.parent = null
    this.child1 = null
    this.child2 = null
  }
}
