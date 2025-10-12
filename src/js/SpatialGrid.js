export class SpatialGrid {
  constructor(x, y, w, h, spacing = 50) {
    this.minX = x;
    this.minY = y;
    this.maxX = x + w;
    this.maxY = y + h;
    this.invS = 1 / spacing;

    this.cols = Math.floor(w * this.invS);
    this.rows = Math.floor(h * this.invS);
    this.cells = [];
    this.queryId = -1;

    const cellsNum = this.cols * this.rows;
    for (let i = 0; i < cellsNum; ++i) {
      this.cells[i] = [];
    }
  }

  getIndex(x, y) {
    return y * this.cols + x;
  }

  getRange(minX, minY, maxX, maxY) {
    minX = Math.floor(minX * this.invS);
    minY = Math.floor(minY * this.invS);
    maxX = Math.floor(maxX * this.invS);
    maxY = Math.floor(maxY * this.invS);

    return {
      minX: minX < 0 ? 0 : minX,
      minY: minY < 0 ? 0 : minY,
      maxX: maxX > this.cols - 1 ? this.cols - 1 : maxX,
      maxY: maxY > this.rows - 1 ? this.rows - 1 : maxY
    };
  }

  insert(body) {
    const { minX, minY, maxX, maxY } = this.getRange(
      body.bound.minX,
      body.bound.minY,
      body.bound.maxX,
      body.bound.maxY
    );

    body.indices = { minX, minY, maxX, maxY };

    for (let x = minX; x <= maxX; ++x) {
      for (let y = minY; y <= maxY; ++y) {
        const index = this.getIndex(x, y);
        const cell = this.cells[index];

        cell.push(body);
      }
    }
  }

  remove(body) {
    const { minX, minY, maxX, maxY } = body.indices;

    for (let x = minX; x <= maxX; ++x) {
      for (let y = minY; y <= maxY; ++y) {
        const index = this.getIndex(x, y);
        const cell = this.cells[index];

        for (let i = 0; i < cell.length; ++i) {
          if (cell[i].id === body.id) {
            cell[i] = cell[cell.length - 1];
            cell.pop();
            --i;
          }
        }
      }
    }
  }

  update(body) {
    const {
      minX: newMinX,
      minY: newMinY,
      maxX: newMaxX,
      maxY: newMaxY
    } = this.getRange(
      body.bound.minX,
      body.bound.minY,
      body.bound.maxX,
      body.bound.maxY
    );
    const {
      minX: cellMinX,
      minY: cellMinY,
      maxX: cellMaxX,
      maxY: cellMaxY
    } = body.indices;

    if (
      newMinX === cellMinX &&
      newMinY === cellMinY &&
      newMaxX === cellMaxX &&
      newMaxY === cellMaxY
    ) {
      return null;
    }

    this.remove(body);
    this.insert(body);
  }

  query(body, results = []) {
    const { minX, minY, maxX, maxY } = body.indices;

    body.queryId = ++this.queryId;

    for (let x = minX; x <= maxX; ++x) {
      for (let y = minY; y <= maxY; ++y) {
        const index = this.getIndex(x, y);
        const cell = this.cells[index];

        for (let i = 0; i < cell.length; ++i) {
          const neighbor = cell[i];

          if (
            body.bound.overlaps(neighbor.bound) &&
            body.queryId !== neighbor.queryId
          ) {
            neighbor.queryId = body.queryId;
            results.push(neighbor);
          }
        }
      }
    }

    return results;
  }

  render(ctx) {
    const spacing = 1 / this.invS;

    ctx.strokeStyle = '#e7e7e7';
    ctx.beginPath();
    for (let x = 1; x < this.cols; ++x) {
      for (let y = 1; y < this.rows; ++y) {
        const minX = x * spacing - spacing;
        const minY = y * spacing - spacing;
        const maxX = x * spacing + spacing;
        const maxY = y * spacing + spacing;

        ctx.moveTo(minX, minY);
        ctx.lineTo(maxX, minY);
        ctx.lineTo(maxX, maxY);
        ctx.lineTo(minX, maxY);
        ctx.lineTo(minX, minY);
      }
    }
    ctx.stroke();
  }
}
