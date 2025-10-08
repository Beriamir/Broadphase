export class SpatialGrid {
  constructor(x, y, w, h, scale = 50) {
    this.minX = x;
    this.minY = y;
    this.maxX = x + w;
    this.maxY = y + h;
    this.scale = scale;
    this.invScale = 1 / scale;

    this.cols = Math.ceil(w / scale);
    this.rows = Math.ceil(h / scale);
    this.cells = [];
    this.queryId = -1;

    const totalCells = this.cols * this.rows;
    for (let i = 0; i < totalCells; ++i) {
      this.cells[i] = [];
    }
  }

  getCellIndex(x, y) {
    return y * this.cols + x;
  }

  getCellRange(x, y, width, height) {
    const hw = width * 0.5;
    const hh = height * 0.5;

    return {
      minX: Math.floor((x - hw) * this.invScale),
      minY: Math.floor((y - hh) * this.invScale),
      maxX: Math.floor((x + hw) * this.invScale),
      maxY: Math.floor((y + hh) * this.invScale)
    };
  }

  insert(client) {
    const { minX, minY, maxX, maxY } = this.getCellRange(
      client.position.x,
      client.position.y,
      client.bound.width,
      client.bound.height
    );

    client.indices = { minX, minY, maxX, maxY };

    for (let x = minX; x <= maxX; ++x) {
      if (x < 0 || x > this.cols - 1) continue;

      for (let y = minY; y <= maxY; ++y) {
        if (y < 0 || y > this.rows - 1) continue;

        const index = this.getCellIndex(x, y);
        const cell = this.cells[index];

        cell.push(client);
      }
    }
  }

  remove(client) {
    const { minX, minY, maxX, maxY } = client.indices;

    for (let x = minX; x <= maxX; ++x) {
      if (x < 0 || x > this.cols - 1) continue;

      for (let y = minY; y <= maxY; ++y) {
        if (y < 0 || y > this.rows - 1) continue;

        const index = this.getCellIndex(x, y);
        const cell = this.cells[index];

        for (let i = 0; i < cell.length; ++i) {
          if (cell[i].id === client.id) {
            cell[i] = cell[cell.length - 1];
            cell.pop();
            --i;
          }
        }
      }
    }
  }

  update(client) {
    const {
      minX: newMinX,
      minY: newMinY,
      maxX: newMaxX,
      maxY: newMaxY
    } = this.getCellRange(
      client.position.x,
      client.position.y,
      client.bound.width,
      client.bound.height
    );
    const {
      minX: cellMinX,
      minY: cellMinY,
      maxX: cellMaxX,
      maxY: cellMaxY
    } = client.indices;

    if (
      newMinX === cellMinX &&
      newMinY === cellMinY &&
      newMaxX === cellMaxX &&
      newMaxY === cellMaxY
    ) {
      return null;
    }

    this.remove(client);
    this.insert(client);
  }

  query(client, results = []) {
    const { minX, minY, maxX, maxY } = client.indices;

    client.queryId = ++this.queryId;

    for (let x = minX; x <= maxX; ++x) {
      if (x < 0 || x > this.cols - 1) continue;

      for (let y = minY; y <= maxY; ++y) {
        if (y < 0 || y > this.rows - 1) continue;

        const index = this.getCellIndex(x, y);
        const cell = this.cells[index];

        for (let i = 0; i < cell.length; ++i) {
          const neighbor = cell[i];

          if (
            client.queryId !== neighbor.queryId &&
            client.bound.overlaps(neighbor.bound)
          ) {
            neighbor.queryId = client.queryId;
            results.push(neighbor);
          }
        }
      }
    }

    return results;
  }

  render(ctx) {
    ctx.fillStyle = '#ffffff20';
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    for (let i = 0; i < this.cells.length; ++i) {
      const x = i % this.cols;
      const y = Math.floor(i / this.cols);

      const minX = x * this.scale - this.scale;
      const minY = y * this.scale - this.scale;
      const maxX = x * this.scale + this.scale;
      const maxY = y * this.scale + this.scale;

      ctx.moveTo(minX, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(minX, maxY);
      ctx.lineTo(minX, minY);
    }
    ctx.stroke();
  }
}
