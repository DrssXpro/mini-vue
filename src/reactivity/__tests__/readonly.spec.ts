import { describe, expect, it, vi } from "vitest";
import { readonly } from "../reactive";

describe.only("readonly", () => {
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
});
