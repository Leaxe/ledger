import { expect } from "chai";

describe('1 + 1', () => {
  it('checking 1 + 1', () => {
    expect(1 + 1).to.equal(2);
    expect(1 + 1).to.lessThan(3);
  })
})