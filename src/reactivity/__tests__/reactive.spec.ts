import { describe, expect, it } from "vitest";
import { reactive, isReactive } from "../reactive";
describe("reacive", () => {
  it("happy path", () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });
});
