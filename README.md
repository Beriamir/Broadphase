# Broadphase Collision Detection Benchmarks

This project is all about testing and comparing different broadphase collision detection algorithms.  
The goal was to achieve faster collision detection without overcomplicating the implementation.

---

### 🚀 [Live Demo](https://beriamir.github.io/Broadphase/)

---

## Broadphases Implemented

- **QuadTree** — hierarchical space partitioning.
- **Spatial Grid** — uniform grid-based partitioning.
- **Spatial Hash Grid** — See [hashing.pdf](https://share.google/f012XjU6hqhxBdAcV)
- **Sweep and Prune** — See [SAP.pdf](https://share.google/6sEf0LKiRy8QzhfUz)
- **KD-Tree** — k-dimentional space partitioning.
- **Dynamic BVH** — See [ErinCatto_DynamicBVH_Full.pdf](https://share.google/IvoSEL2Ix9mP1OYmf)
- **Brute Force** — the baseline, included because... why not?

---

## Tech Notes

- Written in **JavaScript (ES Modules)**.
- Designed for **game physics / simulation experiments**.
- Focused more on _practical speed_ than full academic rigor.
- Includes **dat.GUI** for real-time interaction and parameter control.

---

> _"Simple, fast, and good enough"_
