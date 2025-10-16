# Broadphase Collision Detection Benchmarks

This project is all about testing and comparing different broadphase collision detection algorithms.  
The goal was to achieve faster collision detection without overcomplicating the implementation.

---

## Broadphases Implemented

- **QuadTree** — hierarchical space partitioning.
- **Spatial Grid** — uniform grid-based partitioning.
- **Spatial Hash Grid** — uniform grid-based partitioning (boundless).
- **Sweep and Prune** — sorting along an axis for fast overlap checks.
- **KD-Tree** — k-dimentional space partitioning.
- **Brute Force** — the baseline, included because... why not?

---

## Tech Notes

- Written in **JavaScript (ES Modules)**.
- Designed for **game physics / simulation experiments**.
- Focused more on _practical speed_ than full academic rigor.
- Includes **dat.GUI** for real-time interaction and parameter control.

---

> _"Simple, fast, and good enough"_
