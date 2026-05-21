import BVHNode from './BVHNode.js'
import Bound from './Bound.js'
import ObjectPool from './ObjectPool.js'

export default class BVHTree {
  constructor() {
    this.uid = 0
    this.root = null
    this.nodes = []
    this.objectPool = new ObjectPool(
      this.nodes,
      () => new BVHNode(this.uid++, new Bound(), null), // Create function
      16 // Capacity
    )
    this.rotationType = {
      NONE: 0,
      BF: 1,
      BG: 2,
      CE: 3,
      CD: 4
    }
    this.stack = []
  }

  createNode(data) {
    const node = this.objectPool.allocate()

    this.nodes[node].data = data
    this.nodes[node].bound.copy(data.bound).enlarge(this.nodes[node].margin)

    data.node = node

    if (this.root === null) {
      this.root = node
      return
    }

    const sibling = this.findBestSibling(node)
    const oldParent = this.nodes[sibling].parent
    const newParent = this.objectPool.allocate()

    this.nodes[newParent].parent = oldParent
    this.nodes[newParent].child1 = sibling
    this.nodes[newParent].child2 = node

    this.nodes[sibling].parent = newParent
    this.nodes[node].parent = newParent

    if (oldParent === null) {
      this.root = newParent
    } else {
      if (this.nodes[oldParent].child1 === sibling) {
        this.nodes[oldParent].child1 = newParent
      } else {
        this.nodes[oldParent].child2 = newParent
      }
    }

    let ancestor = newParent

    while (ancestor !== null) {
      const child1 = this.nodes[ancestor].child1
      const child2 = this.nodes[ancestor].child2

      this.nodes[child1].bound.union(
        this.nodes[child2].bound,
        this.nodes[ancestor].bound
      )
      this.nodes[ancestor].height =
        1 + Math.max(this.nodes[child1].height, this.nodes[child2].height)

      this.rotate(ancestor)

      ancestor = this.nodes[ancestor].parent
    }
  }

  findBestSibling(node) {
    let sibling = this.root
    let siblingArea = this.nodes[sibling].bound.perimeter
    let directCost = this.nodes[sibling].bound.unionPerimeter(
      this.nodes[node].bound
    )
    let inheritedCost = 0

    let bestSibling = sibling // We need to find the best sibling
    let bestCost = directCost

    while (this.nodes[sibling].height > 0) {
      const cost = directCost + inheritedCost

      if (cost < bestCost) {
        bestSibling = sibling
        bestCost = cost
      }

      inheritedCost += directCost - siblingArea

      const child1 = this.nodes[sibling].child1
      const child2 = this.nodes[sibling].child2

      let leaf1 = this.nodes[child1].height === 0
      let lowerCost1 = Infinity
      let directCost1 = this.nodes[child1].bound.unionPerimeter(
        this.nodes[node].bound
      )
      let area1 = 0

      if (leaf1) {
        const cost1 = directCost1 + inheritedCost

        if (cost1 < bestCost) {
          bestSibling = child1
          bestCost = cost1
        }
      } else {
        area1 = this.nodes[child1].bound.perimeter
        lowerCost1 =
          inheritedCost +
          directCost1 +
          Math.min(this.nodes[node].bound.perimeter - area1, 0)
      }

      let leaf2 = this.nodes[child2].height === 0
      let lowerCost2 = Infinity
      let directCost2 = this.nodes[node].bound.unionPerimeter(
        this.nodes[child2].bound
      )
      let area2 = 0

      if (leaf2) {
        const cost2 = directCost2 + inheritedCost

        if (cost2 < bestCost) {
          bestSibling = child2
          bestCost = cost2
        }
      } else {
        area2 = this.nodes[child2].bound.perimeter
        lowerCost2 =
          inheritedCost +
          directCost2 +
          Math.min(this.nodes[node].bound.perimeter - area2, 0)
      }

      if (leaf1 && leaf2) {
        break
      }

      if (bestCost <= lowerCost1 && bestCost <= lowerCost2) {
        break
      }

      if (lowerCost1 === lowerCost2) {
        const meanX = this.nodes[node].bound.meanX
        const meanY = this.nodes[node].bound.meanY
        const mean1X = this.nodes[child1].bound.meanX
        const mean1Y = this.nodes[child1].bound.meanY
        const mean2X = this.nodes[child2].bound.meanX
        const mean2Y = this.nodes[child2].bound.meanY

        const dx1 = mean1X - meanX
        const dy1 = mean1Y - meanY
        const dx2 = mean2X - meanX
        const dy2 = mean2Y - meanY

        lowerCost1 = dx1 * dx1 + dy1 * dy1
        lowerCost2 = dx2 * dx2 + dy2 * dy2
      }

      if (lowerCost1 < lowerCost2) {
        sibling = child1
        siblingArea = area1
        directCost = directCost1
      } else {
        sibling = child2
        siblingArea = area2
        directCost = directCost2
      }
    }

    return bestSibling
  }

  rotate(node) {
    if (this.nodes[node].height < 2) {
      return
    }

    const B = this.nodes[node].child1
    const C = this.nodes[node].child2

    if (this.nodes[B].height === 0 && this.nodes[C].height > 0) {
      // B is leaf and C is internal node
      const F = this.nodes[C].child1
      const G = this.nodes[C].child2

      const costBase = this.nodes[C].bound.perimeter
      const costBF = this.nodes[B].bound.unionPerimeter(this.nodes[G].bound)
      const costBG = this.nodes[F].bound.unionPerimeter(this.nodes[B].bound)

      if (costBase <= costBF && costBase <= costBG) {
        return
      }

      if (costBF < costBG) {
        // Swap B and F
        this.nodes[node].child1 = F
        this.nodes[C].child1 = B

        this.nodes[B].parent = C
        this.nodes[F].parent = node

        this.nodes[B].bound.union(this.nodes[G].bound, this.nodes[C].bound)
        this.nodes[F].bound.union(this.nodes[C].bound, this.nodes[node].bound)

        this.nodes[C].height =
          1 + Math.max(this.nodes[B].height, this.nodes[G].height)
        this.nodes[node].height =
          1 + Math.max(this.nodes[F].height, this.nodes[C].height)
      } else {
        // Swap B and G
        this.nodes[node].child1 = G
        this.nodes[C].child2 = B

        this.nodes[B].parent = C
        this.nodes[G].parent = node

        this.nodes[F].bound.union(this.nodes[B].bound, this.nodes[C].bound)
        this.nodes[G].bound.union(this.nodes[C].bound, this.nodes[node].bound)

        this.nodes[C].height =
          1 + Math.max(this.nodes[F].height, this.nodes[B].height)
        this.nodes[node].height =
          1 + Math.max(this.nodes[G].height, this.nodes[C].height)
      }
    } else if (this.nodes[C].height === 0 && this.nodes[B].height > 0) {
      // C is leaf and B is internal node
      const D = this.nodes[B].child1
      const E = this.nodes[B].child2

      const costBase = this.nodes[B].bound.perimeter
      const costCE = this.nodes[D].bound.unionPerimeter(this.nodes[C].bound)
      const costCD = this.nodes[C].bound.unionPerimeter(this.nodes[E].bound)

      if (costBase <= costCE && costBase <= costCD) {
        return
      }

      if (costCE < costCD) {
        // Swap C and E
        this.nodes[node].child2 = E
        this.nodes[B].child2 = C

        this.nodes[E].parent = node
        this.nodes[C].parent = B

        this.nodes[D].bound.union(this.nodes[C].bound, this.nodes[B].bound)
        this.nodes[B].bound.union(this.nodes[E].bound, this.nodes[node].bound)

        this.nodes[B].height =
          1 + Math.max(this.nodes[D].height, this.nodes[C].height)
        this.nodes[node].height =
          1 + Math.max(this.nodes[B].height, this.nodes[E].height)
      } else {
        // Swap C and D
        this.nodes[node].child2 = D
        this.nodes[B].child1 = C

        this.nodes[D].parent = node
        this.nodes[C].parent = B

        this.nodes[C].bound.union(this.nodes[E].bound, this.nodes[B].bound)
        this.nodes[B].bound.union(this.nodes[D].bound, this.nodes[node].bound)

        this.nodes[B].height =
          1 + Math.max(this.nodes[C].height, this.nodes[E].height)
        this.nodes[node].height =
          1 + Math.max(this.nodes[B].height, this.nodes[D].height)
      }
    } else {
      // Full swap
      const D = this.nodes[B].child1
      const E = this.nodes[B].child2
      const F = this.nodes[C].child1
      const G = this.nodes[C].child2

      const areaB = this.nodes[B].bound.perimeter
      const areaC = this.nodes[C].bound.perimeter
      const costBase = areaB + areaC

      let bestRotation = this.rotationType.NONE
      let baseCost = costBase

      const costBF =
        areaB + this.nodes[B].bound.unionPerimeter(this.nodes[G].bound)
      if (costBF < baseCost) {
        bestRotation = this.rotationType.BF
        baseCost = costBF
      }

      const costBG =
        areaB + this.nodes[F].bound.unionPerimeter(this.nodes[B].bound)
      if (costBG < baseCost) {
        bestRotation = this.rotationType.BG
        baseCost = costBG
      }

      const costCD =
        areaC + this.nodes[C].bound.unionPerimeter(this.nodes[E].bound)
      if (costCD < baseCost) {
        bestRotation = this.rotationType.CD
        baseCost = costCD
      }

      const costCE =
        areaC + this.nodes[D].bound.unionPerimeter(this.nodes[C].bound)
      if (costCE < baseCost) {
        bestRotation = this.rotationType.CE
        baseCost = costCE
      }

      switch (bestRotation) {
        case this.rotationType.NONE: {
          break
        }

        case this.rotationType.BF: {
          this.nodes[node].child1 = F
          this.nodes[C].child1 = B

          this.nodes[F].parent = node
          this.nodes[B].parent = C

          this.nodes[B].bound.union(this.nodes[G].bound, this.nodes[C].bound)
          this.nodes[F].bound.union(this.nodes[C].bound, this.nodes[node].bound)

          this.nodes[C].height =
            1 + Math.max(this.nodes[B].height, this.nodes[G].height)
          this.nodes[node].height =
            1 + Math.max(this.nodes[F].height, this.nodes[C].height)
          break
        }

        case this.rotationType.BG: {
          this.nodes[node].child1 = G
          this.nodes[C].child2 = B

          this.nodes[G].parent = node
          this.nodes[B].parent = C

          this.nodes[F].bound.union(this.nodes[B].bound, this.nodes[C].bound)
          this.nodes[G].bound.union(this.nodes[C].bound, this.nodes[node].bound)

          this.nodes[C].height =
            1 + Math.max(this.nodes[F].height, this.nodes[B].height)
          this.nodes[node].height =
            1 + Math.max(this.nodes[G].height, this.nodes[C].height)
          break
        }

        case this.rotationType.CE: {
          this.nodes[node].child2 = E
          this.nodes[B].child2 = C

          this.nodes[E].parent = node
          this.nodes[C].parent = B

          this.nodes[D].bound.union(this.nodes[C].bound, this.nodes[B].bound)
          this.nodes[B].bound.union(this.nodes[E].bound, this.nodes[node].bound)

          this.nodes[B].height =
            1 + Math.max(this.nodes[D].height, this.nodes[C].height)
          this.nodes[node].height =
            1 + Math.max(this.nodes[B].height, this.nodes[E].height)
          break
        }

        case this.rotationType.CD: {
          this.nodes[node].child2 = D
          this.nodes[B].child1 = C

          this.nodes[D].parent = node
          this.nodes[C].parent = B

          this.nodes[C].bound.union(this.nodes[E].bound, this.nodes[B].bound)
          this.nodes[B].bound.union(this.nodes[D].bound, this.nodes[node].bound)

          this.nodes[B].height =
            1 + Math.max(this.nodes[C].height, this.nodes[E].height)
          this.nodes[node].height =
            1 + Math.max(this.nodes[B].height, this.nodes[D].height)
          break
        }

        default: {
          break
        }
      }
    }
  }

  destroyNode(data) {
    const node = data.node

    if (node === this.root) {
      this.objectPool.free(this.root)
      this.root = null
      return
    }

    const parent = this.nodes[node].parent
    const grandParent = this.nodes[parent].parent
    const sibling =
      this.nodes[parent].child1 === node
        ? this.nodes[parent].child2
        : this.nodes[parent].child1

    if (grandParent !== null) {
      if (this.nodes[grandParent].child1 === parent) {
        this.nodes[grandParent].child1 = sibling
      } else {
        this.nodes[grandParent].child2 = sibling
      }

      this.nodes[sibling].parent = grandParent

      this.objectPool.free(parent)
      this.objectPool.free(node)

      let ancestor = grandParent

      while (ancestor !== null) {
        const child1 = this.nodes[ancestor].child1
        const child2 = this.nodes[ancestor].child2

        this.nodes[child1].bound.union(
          this.nodes[child2].bound,
          this.nodes[ancestor].bound
        )
        this.nodes[ancestor].height =
          1 + Math.max(this.nodes[child1].height, this.nodes[child2].height)

        this.rotate(ancestor)

        ancestor = this.nodes[ancestor].parent
      }
    } else {
      const oldParent = this.nodes[sibling].parent

      this.root = sibling
      this.nodes[this.root].parent = null

      this.objectPool.free(oldParent)
      this.objectPool.free(node)
    }
  }

  updateNode(data) {
    if (!this.nodes[data.node].bound.contains(data.bound)) {
      this.destroyNode(data)
      this.createNode(data)
    }

    return this
  }

  queryNode(data, result = []) {
    this.stack.length = 0
    this.stack.push(this.root)

    while (this.stack.length) {
      const node = this.stack.pop()

      if (node === null) continue

      if (this.nodes[node].bound.overlaps(data.bound)) {
        if (
          this.nodes[node].height === 0 &&
          this.nodes[node].data.id !== data.id &&
          this.nodes[node].data.bound.overlaps(data.bound)
        ) {
          result.push(this.nodes[node].data)
          continue
        }

        this.stack.push(this.nodes[node].child1)
        this.stack.push(this.nodes[node].child2)
      }
    }

    return result
  }

  queryRegion(bound, result = []) {
    this.stack.length = 0
    this.stack.push(this.root)

    while (this.stack.length) {
      const node = this.stack.pop()

      if (node === null) continue

      if (this.nodes[node].bound.overlaps(bound)) {
        if (
          this.nodes[node].height === 0 &&
          this.nodes[node].data.bound.overlaps(bound)
        ) {
          result.push(this.nodes[node].data)
          continue
        }

        this.stack.push(this.nodes[node].child1)
        this.stack.push(this.nodes[node].child2)
      }
    }

    return result
  }

  render(ctx) {
    this.stack.length = 0
    this.stack.push(this.root)

    ctx.beginPath()
    while (this.stack.length) {
      const node = this.stack.pop()

      if (node === null) continue

      const bound = this.nodes[node].bound

      ctx.moveTo(bound.minX, bound.minY)
      ctx.lineTo(bound.maxX, bound.minY)
      ctx.lineTo(bound.maxX, bound.maxY)
      ctx.lineTo(bound.minX, bound.maxY)
      ctx.lineTo(bound.minX, bound.minY)

      this.stack.push(this.nodes[node].child1)
      this.stack.push(this.nodes[node].child2)
    }
    ctx.strokeStyle = 'gray'
    ctx.stroke()
  }
}
