export default class ObjectPool {
  constructor(objects, callback, capacity = 16) {
    this.objects = objects
    this.callback = callback
    this.capacity = capacity
    this.freeList = -1

    this.grow(capacity)
  }

  grow(capacity) {
    const start = this.objects.length
    const end = start + capacity

    for (let i = start; i < end; i++) {
      this.objects[i] = this.callback()
      this.objects[i].next = i + 1
    }

    this.objects[end - 1].next = this.freeList
    this.freeList = start
  }

  allocate() {
    if (this.freeList < 0) {
      this.grow(this.objects.length)
    }

    const index = this.freeList

    this.freeList = this.objects[index].next
    this.objects[index].next = -1
    this.objects[index].allocated = true

    return index
  }

  free(index) {
    if (!this.objects[index].allocated) {
      return
    }

    this.objects[index].next = this.freeList
    this.objects[index].allocated = false
    this.freeList = index
  }
}
