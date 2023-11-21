import { describe, expect, it } from "vitest";
import { add } from "..";

describe("init", () => {
  it("should init", () => {
    const a = add(10, 100);
    expect(a).equal(110);
  });
});
