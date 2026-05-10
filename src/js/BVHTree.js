import BVHNode from './BVHNode.js'
import Bound from './Bound.js'

export default class BVHTree {
  constructor() {
    this.uid = 0
    this.root = null
  }

  insert(aabb, data) {
    const aabbMargin = 5
    const enlargedAABB = new Bound(
      aabb.minX - aabbMargin,
      aabb.minY - aabbMargin,
      aabb.maxX + aabbMargin,
      aabb.maxY + aabbMargin
    )

    const node = new BVHNode(this.uid++, enlargedAABB, data)

    data.node = node

    if (this.root === null) {
      this.root = node
      return
    }

    const sibling = this.findBestSibling(node)
    const oldParent = sibling.parent
    const newParent = new BVHNode(this.uid++, null, null)

    newParent.parent = oldParent
    newParent.child1 = sibling
    newParent.child2 = node

    sibling.parent = newParent
    node.parent = newParent

    if (oldParent === null) {
      this.root = newParent
    } else {
      if (oldParent.child1 === sibling) {
        oldParent.child1 = newParent
      } else {
        oldParent.child2 = newParent
      }
    }

    let ancestor = newParent

    while (ancestor) {
      const c1 = ancestor.child1
      const c2 = ancestor.child2

      ancestor.aabb = c1.aabb.union(c2.aabb)
      ancestor.height = 1 + Math.max(c1.height, c2.height)

      this.rotate(ancestor)

      ancestor = ancestor.parent
    }
  }

  findBestSibling(node) {
    let currNode = this.root
    let currArea = currNode.aabb.perimeter
    let directCost = currNode.aabb.union(node.aabb).perimeter
    let inheritedCost = 0
    let bestSibling = currNode
    let bestCost = directCost

    while (currNode.height > 0) {
      const cost = directCost + inheritedCost

      if (cost < bestCost) {
        bestSibling = currNode
        bestCost = cost
      }

      inheritedCost += directCost - currArea

      const child1 = currNode.child1
      const child2 = currNode.child2

      let leaf1 = child1.height === 0
      let lowerCost1 = Infinity
      let directCost1 = child1.aabb.union(node.aabb).perimeter
      let area1 = 0

      if (leaf1) {
        const cost1 = directCost1 + inheritedCost

        if (cost1 < bestCost) {
          bestSibling = child1
          bestCost = cost1
        }
      } else {
        area1 = child1.aabb.perimeter
        lowerCost1 =
          inheritedCost + directCost1 + Math.min(node.aabb.perimeter - area1, 0)
      }

      let leaf2 = child2.height === 0
      let lowerCost2 = Infinity
      let directCost2 = node.aabb.union(child2.aabb).perimeter
      let area2 = 0

      if (leaf2) {
        const cost2 = directCost2 + inheritedCost

        if (cost2 < bestCost) {
          bestSibling = child2
          bestCost = cost2
        }
      } else {
        area2 = child2.aabb.perimeter
        lowerCost2 =
          inheritedCost + directCost2 + Math.min(node.aabb.perimeter - area2, 0)
      }

      if (leaf1 && leaf2) {
        break
      }

      if (bestCost <= lowerCost1 && bestCost <= lowerCost2) {
        break
      }

      if (lowerCost1 === lowerCost2) {
        const mean = node.aabb.mean
        const mean1 = child1.aabb.mean
        const mean2 = child2.aabb.mean

        const dx1 = mean1.posX - mean.posX
        const dy1 = mean1.posY - mean.posY
        const dx2 = mean2.posX - mean.posX
        const dy2 = mean2.posY - mean.posY

        lowerCost1 = dx1 * dx1 + dy1 * dy1
        lowerCost2 = dx2 * dx2 + dy2 * dy2
      }

      if (lowerCost1 < lowerCost2) {
        currNode = child1
        currArea = area1
        directCost = directCost1
      } else {
        currNode = child2
        currArea = area2
        directCost = directCost2
      }
    }

    return bestSibling
  }

  rotate(node) {
    if (node.height < 2) {
      return
    }

    const rotateType = {
      NONE: 0,
      BF: 1,
      BG: 2,
      CD: 3,
      CE: 4
    }

    const B = node.child1
    const C = node.child2

    if (B.height === 0 && C.height > 0) {
      // B is leaf and C is internal node
      const F = C.child1
      const G = C.child2

      const costBase = C.aabb.perimeter
      const unionBG = B.aabb.union(G.aabb)
      const unionBF = B.aabb.union(F.aabb)
      const costBF = unionBG.perimeter
      const costBG = unionBF.perimeter

      if (costBase < costBF && costBase < costBG) {
        return
      }

      if (costBF < costBG) {
        // Swap B and F
        node.child1 = F
        C.child1 = B

        B.parent = C
        F.parent = node

        C.aabb = unionBG
        node.aabb = F.aabb.union(C.aabb)

        C.height = 1 + Math.max(B.height, G.height)
        node.height = 1 + Math.max(C.height, F.height)
      } else {
        // Swap B and G
        node.child1 = G
        C.child2 = B

        B.parent = C
        G.parent = node

        C.aabb = unionBF
        node.aabb = G.aabb.union(C.aabb)

        C.height = 1 + Math.max(B.height, F.height)
        node.height = 1 + Math.max(C.height, G.height)
      }
    } else if (C.height === 0 && B.height > 0) {
      // C is leaf and B is internal node
      const D = B.child1
      const E = B.child2

      const costBase = B.aabb.perimeter
      const unionCE = C.aabb.union(E.aabb)
      const unionCD = C.aabb.union(D.aabb)
      const costCE = unionCD.perimeter
      const costCD = unionCE.perimeter

      if (costBase < costCE && costBase < costCD) {
        return
      }

      if (costCE < costCD) {
        // Swap C and E
        node.child2 = E
        B.child2 = C

        E.parent = node
        C.parent = B

        B.aabb = unionCD
        node.aabb = B.aabb.union(E.aabb)

        B.height = 1 + Math.max(C.height, D.height)
        node.height = 1 + Math.max(B.height, E.height)
      } else {
        // Swap C and D
        node.child2 = D
        B.child1 = C

        D.parent = node
        C.parent = B

        B.aabb = unionCE
        node.aabb = B.aabb.union(D.aabb)

        B.height = 1 + Math.max(C.height, E.height)
        node.height = 1 + Math.max(B.height, D.height)
      }
    } else {
      // Full swap
      const D = B.child1
      const E = B.child2
      const F = C.child1
      const G = C.child2

      const areaB = B.aabb.perimeter
      const areaC = C.aabb.perimeter
      const costBase = areaB + areaC

      let bestRotation = rotateType.NONE
      let baseCost = costBase

      const unionBG = B.aabb.union(G.aabb)
      const costBF = areaB + unionBG.perimeter
      if (costBF < baseCost) {
        bestRotation = rotateType.BF
        baseCost = costBF
      }

      const unionBF = B.aabb.union(F.aabb)
      const costBG = areaB + unionBF.perimeter
      if (costBG < baseCost) {
        bestRotation = rotateType.BG
        baseCost = costBG
      }

      const unionCE = C.aabb.union(E.aabb)
      const costCD = areaC + unionCE.perimeter
      if (costCD < baseCost) {
        bestRotation = rotateType.CD
        baseCost = costCD
      }

      const unionCD = C.aabb.union(D.aabb)
      const costCE = areaC + unionCD.perimeter
      if (costCE < baseCost) {
        bestRotation = rotateType.CE
        baseCost = costCE
      }

      switch (bestRotation) {
        case rotateType.NONE: {
          break
        }

        case rotateType.BF: {
          node.child1 = F
          C.child1 = B

          F.parent = node
          B.parent = C

          C.aabb = unionBG
          node.aabb = F.aabb.union(C.aabb)

          C.height = 1 + Math.max(B.height, G.height)
          node.height = 1 + Math.max(F.height, C.height)
          break
        }

        case rotateType.BG: {
          node.child1 = G
          C.child2 = B

          G.parent = node
          B.parent = C

          C.aabb = unionBF
          node.aabb = G.aabb.union(C.aabb)

          C.height = 1 + Math.max(B.height, F.height)
          node.height = 1 + Math.max(G.height, C.height)
          break
        }

        case rotateType.CE: {
          node.child2 = E
          B.child2 = C

          E.parent = node
          C.parent = B

          B.aabb = unionCD
          node.aabb = B.aabb.union(E.aabb)

          B.height = 1 + Math.max(C.height, D.height)
          node.height = 1 + Math.max(B.height, E.height)
          break
        }

        case rotateType.CD: {
          node.child2 = D
          B.child1 = C

          D.parent = node
          C.parent = B

          B.aabb = unionCE
          node.aabb = B.aabb.union(D.aabb)

          B.height = 1 + Math.max(C.height, E.height)
          node.height = 1 + Math.max(B.height, D.height)
          break
        }

        default: {
          break
        }
      }
    }
  }

  remove(node) {
    if (node === this.root) {
      this.root = null
      return
    }

    const parent = node.parent

    if (parent === null) {
      this.root = null
      return
    }

    const grandParent = parent.parent
    const sibling = parent.child1.id === node.id ? parent.child2 : parent.child1

    if (grandParent) {
      if (grandParent.child1.id === parent.id) {
        grandParent.child1 = sibling
      } else {
        grandParent.child2 = sibling
      }

      sibling.parent = grandParent

      let ancestor = grandParent

      while (ancestor) {
        const child1 = ancestor.child1
        const child2 = ancestor.child2

        ancestor.aabb = child1.aabb.union(child2.aabb)
        ancestor.height = 1 + Math.max(child1.height, child2.height)

        this.rotate(ancestor)

        ancestor = ancestor.parent
      }
    } else {
      this.root = sibling
      this.root.parent = null
    }
  }

  update(node, aabb, data) {
    this.remove(node)
    this.insert(aabb, data)
  }

  query(data, result = []) {
    const stack = [this.root]

    while (stack.length) {
      const node = stack.pop()

      if (!node) continue

      if (node.aabb.overlaps(data.bound)) {
        if (node.height === 0 && node.data.id !== data.id) {
          result.push(node.data)
          continue
        }

        stack.push(node.child1)
        stack.push(node.child2)
      }
    }

    return result
  }

  render(ctx) {
    const stack = [this.root]

    ctx.beginPath()
    while (stack.length) {
      const node = stack.pop()

      if (!node) continue

      const aabb = node.aabb

      ctx.moveTo(aabb.minX, aabb.minY)
      ctx.lineTo(aabb.maxX, aabb.minY)
      ctx.lineTo(aabb.maxX, aabb.maxY)
      ctx.lineTo(aabb.minX, aabb.maxY)
      ctx.lineTo(aabb.minX, aabb.minY)

      if (node.height > 0) {
        stack.push(node.child1)
        stack.push(node.child2)
      }
    }
    ctx.strokeStyle = 'gray'
    ctx.stroke()
  }
}
