export default class SpatialHashGrid {
	constructor(spacing, maxNum) {
		this.invS = 1 / spacing;
		this.tableSize = maxNum;
		this.keys = new Int32Array(this.tableSize + 1);
		this.entries = [];
		this.bodies = [];
		this.queryId = -1;
		this.drawn = new Set();
	}

	insert(body) {
		let exists = false;
		for (let i = 0; i < this.bodies.length; ++i) {
			if (body.id === this.bodies[i].id) {
				exists = true;
				break;
			}
		}

		if (!exists) this.bodies.push(body);
	}

	remove(body) {
		for (let i = 0; i < this.bodies.length; ++i) {
			if (body.id === this.bodies[i].id) {
				this.bodies[i] = this.bodies[this.bodies.length - 1];
				this.bodies.pop();
				break;
			}
		}
	}

	intCoord(coord) {
		return Math.floor(coord * this.invS);
	}

	hashCoord(xInt, yInt) {
		const key = ((xInt * 92837111) ^ (yInt * 689287499)) >>> 0;

		return key % this.tableSize;
	}

	update() {
		this.keys.fill(0);
		this.entries.length = 0;

		for (let i = 0; i < this.bodies.length; ++i) {
			const body = this.bodies[i];
			const x0 = this.intCoord(body.bound.minX);
			const y0 = this.intCoord(body.bound.minY);
			const x1 = this.intCoord(body.bound.maxX);
			const y1 = this.intCoord(body.bound.maxY);

			body.indices = { x0, y0, x1, y1 };

			for (let x = x0; x <= x1; ++x) {
				for (let y = y0; y <= y1; ++y) {
					const key = this.hashCoord(x, y);

					++this.keys[key];
				}
			}
		}

		for (let start = 0, i = 0; i <= this.tableSize; ++i) {
			start += this.keys[i];
			this.keys[i] = start;
		}

		for (let i = 0; i < this.bodies.length; ++i) {
			const body = this.bodies[i];
			const { x0, y0, x1, y1 } = body.indices;

			for (let x = x0; x <= x1; ++x) {
				for (let y = y0; y <= y1; ++y) {
					const key = this.hashCoord(x, y);

					this.entries[--this.keys[key]] = this.bodies[i];
				}
			}
		}
	}

	query(body, results = []) {
		const { x0, y0, x1, y1 } = body.indices;

		body.queryId = ++this.queryId;

		for (let x = x0; x <= x1; ++x) {
			for (let y = y0; y <= y1; ++y) {
				const key = this.hashCoord(x, y);
				const start = this.keys[key];
				const end = this.keys[key + 1];

				for (let i = start; i < end; ++i) {
					const neighbor = this.entries[i];

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

		this.drawn.clear();

		ctx.strokeStyle = '#2771ff';
		ctx.beginPath();
		for (let i = 0; i < this.bodies.length; ++i) {
			const body = this.bodies[i];
			const { x0, y0, x1, y1 } = body.indices;

			for (let x = x0; x <= x1; ++x) {
				for (let y = y0; y <= y1; ++y) {
					const key = (x << 16) ^ y;

					if (this.drawn.has(key)) {
						continue;
					} else this.drawn.add(key);

					const minX = x * spacing;
					const minY = y * spacing;
					const maxX = minX + spacing;
					const maxY = minY + spacing;

					ctx.moveTo(minX, minY);
					ctx.lineTo(maxX, minY);
					ctx.lineTo(maxX, maxY);
					ctx.lineTo(minX, maxY);
					ctx.lineTo(minX, minY);
				}
			}
		}
		ctx.stroke();
	}
}
