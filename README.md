# Broadphase Collision Detection Benchmarks

This project is all about testing and comparing different broadphase collision detection algorithms.  
The goal was to achieve faster collision detection without overcomplicating the implementation.

---

## Broadphases Implemented

- **QuadTree** — hierarchical space partitioning.
- **Spatial Grid** — uniform grid-based partitioning.
- **Sweep and Prune (SAP)** — sorting along an axis for fast overlap checks.
- **Brute Force** — the baseline, included because... why not?

---

## Tech Notes

- Written in **JavaScript (ES Modules)**.
- Designed for **game physics / simulation experiments**.
- Focused more on _practical speed_ than full academic rigor.

---

_"Simple, fast, and good enough"_
