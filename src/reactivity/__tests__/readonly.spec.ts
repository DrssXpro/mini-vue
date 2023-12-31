import { describe, expect, it, vi } from "vitest";
import { readonly, isReadonly, isProxy } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    expect(wrapped.foo).toBe(1);
  });

  it("warn then call set", () => {
    console.warn = vi.fn();
    const user = readonly({
      age: 100,
    });

    user.age = 1;
    expect(console.warn).toBeCalled();
  });

  it("is readonly", () => {
    const original = { foo: 1 };
    const wrapped = readonly(original);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
  });

  it("isProxy", () => {
    const original = { foo: 1 };
    const observed = readonly(original);
    expect(isProxy(original)).toBe(false);
    expect(isProxy(observed)).toBe(true);
  });
});
