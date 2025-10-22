import { Vector } from './Vector.js';
import { Bound } from './Bound.js';

export class Circle {
	static ids = -1;

	constructor(x, y, radius) {
		this.position = new Vector(x, y);
		this.radius = radius;

		this.linearVelocity = new Vector();
		this.density = 1000;
		this.mass = this.radius * this.radius * Math.PI * this.density;
		this.inverseMass = 1 / this.mass;

		this.id = ++Circle.ids;
		this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
		this.bound = new Bound(x - radius, y - radius, x + radius, y + radius);
	}

	updatePosition(dt) {
		this.position.add(this.linearVelocity, dt);
	}

	updateBound() {
		this.bound.update(
			this.position.x - this.radius,
			this.position.y - this.radius,
			this.position.x + this.radius,
			this.position.y + this.radius
		);
	}

	render(ctx) {
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}
