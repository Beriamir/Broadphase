export default class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	add(v, s = 1) {
		this.x += v.x * s;
		this.y += v.y * s;
		return this;
	}

	sub(v, s = 1) {
		this.x -= v.x * s;
		this.y -= v.y * s;
		return this;
	}

	scale(s = 1) {
		this.x *= s;
		this.y *= s;
		return this;
	}

	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	magnitudeSq() {
		return this.x * this.x + this.y * this.y;
	}

	random() {
		this.x = Math.random() - 0.5;
		this.y = Math.random() - 0.5;
		return this;
	}

	static add(v1, v2) {
		return new Vector(v1.x + v2.x, v1.y + v2.y);
	}

	static sub(v1, v2) {
		return new Vector(v1.x - v2.x, v1.y - v2.y);
	}

	static scale(v, s) {
		return new Vector(v.x * s, v.y * s);
	}
}
