export class Animator {
  constructor(fps) {
    this.interval = 1000 / fps;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  animate(callback) {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.accumulator += delta;

    if (this.accumulator >= this.interval) {
      callback(delta);
      this.accumulator -= this.interval;
    }

    requestAnimationFrame(() => this.animate(callback));
  }
}
