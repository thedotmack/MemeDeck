export class SlidingWindowUpdateTracker {
  constructor(windowMs = 60000) {
    this.windowMs = windowMs
    this.timestamps = []
    this.startIndex = 0
  }

  add(timestamp = Date.now()) {
    this.timestamps.push(timestamp)
    this.prune(timestamp)
  }

  prune(now = Date.now()) {
    const cutoff = now - this.windowMs

    while (
      this.startIndex < this.timestamps.length &&
      this.timestamps[this.startIndex] < cutoff
    ) {
      this.startIndex++
    }

    // Periodically compact the buffer to avoid unbounded growth
    if (
      this.startIndex > 0 &&
      (this.startIndex > 64 || this.startIndex > this.timestamps.length / 2)
    ) {
      this.timestamps = this.timestamps.slice(this.startIndex)
      this.startIndex = 0
    }
  }

  count(now = Date.now()) {
    this.prune(now)
    return this.timestamps.length - this.startIndex
  }

  getUpdatesPerMinute(now = Date.now()) {
    return this.count(now)
  }

  reset() {
    this.timestamps = []
    this.startIndex = 0
  }
}

export class UpdateTrackerStore {
  constructor(windowMs = 60000) {
    this.windowMs = windowMs
    this.trackers = new Map()
  }

  get(tokenId) {
    if (!this.trackers.has(tokenId)) {
      this.trackers.set(tokenId, new SlidingWindowUpdateTracker(this.windowMs))
    }
    return this.trackers.get(tokenId)
  }

  record(tokenId, timestamp = Date.now()) {
    const tracker = this.get(tokenId)
    tracker.add(timestamp)
    return tracker.getUpdatesPerMinute(timestamp)
  }

  getUpdatesPerMinute(tokenId, timestamp = Date.now()) {
    const tracker = this.trackers.get(tokenId)
    if (!tracker) return 0
    return tracker.getUpdatesPerMinute(timestamp)
  }

  delete(tokenId) {
    this.trackers.delete(tokenId)
  }

  clear() {
    this.trackers.clear()
  }
}
