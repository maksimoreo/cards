export default class Counter {
  constructor(public i = 0) {}

  public next(): number {
    this.i += 1

    return this.i
  }
}
