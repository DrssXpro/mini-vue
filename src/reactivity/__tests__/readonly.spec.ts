import { describe, expect, it, vi } from "vitest";
import { readonly,isReadonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
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
});
