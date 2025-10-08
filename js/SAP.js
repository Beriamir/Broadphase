export class SAP {
  constructor() {
    this.bodies = [];
  }

  insert(body) {
    let low = 0;
    let high = this.bodies.length;

    while (low < high) {
      const mid = Math.floor((low + high) * 0.5);

      if (this.bodies[mid].bound.minX < body.bound.minX) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    this.bodies.splice(low, 0, body);
    for (let i = low; i < this.bodies.length; ++i) {
      this.bodies[i].index = i;
    }
  }

  remove(body) {
    const index = body.index;

    this.bodies.splice(index, 1);
    for (let i = index; i < this.bodies.length; ++i) {
      this.bodies[i].index = i;
    }
  }

  update() {
    const bodies = this.bodies;
    const n = bodies.length;

    for (let i = 1; i < n; ++i) {
      const current = bodies[i];
      let j = i - 1;

      while (j >= 0 && bodies[j].bound.minX > current.bound.minX) {
        const k = j + 1;

        bodies[k] = bodies[j];
        bodies[k].index = k;
        --j;
      }

      const k = j + 1;

      bodies[k] = current;
      bodies[k].index = k;
    }
  }

  query(body, results = []) {
    const index = body.index + 1;
    const n = this.bodies.length;

    for (let i = index; i < n; ++i) {
      const other = this.bodies[i];

      if (other.bound.minX > body.bound.maxX) break;

      if (
        other.bound.minY < body.bound.maxY &&
        other.bound.maxY > body.bound.minY
      ) {
        results.push(other);
      }
    }

    return results;
  }

  render(ctx) {
    ctx.beginPath();
    for (let i = 0; i < this.bodies.length; ++i) {
      const body = this.bodies[i];
      ctx.moveTo(body.bound.minX, 0);
      ctx.lineTo(body.bound.minX, 10);
      ctx.moveTo(body.bound.maxX, 0);
      ctx.lineTo(body.bound.maxX, 10);
    }

    ctx.strokeStyle = 'orange';
    ctx.stroke();
  }
}
