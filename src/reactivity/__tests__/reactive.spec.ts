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

  it("nested reactive", () => {
    const original = { nested: { foo: 1 }, arr: [{ bar: 2 }] };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.arr)).toBe(true);
    expect(isReactive(observed.arr[0])).toBe(true);
  });
});
