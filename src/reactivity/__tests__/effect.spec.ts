import { describe, expect, it } from "vitest";
import { reactive } from "../reactive";
import { effect } from "../effect";

describe("effect", () => {
  it("happy path", () => {
    // use reactive
    const user = reactive({ age: 10 });
    let nextAge;

    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  it("should return runner when call effect", () => {
    // effect(fn) => function effect(runner) => fn return value
    let foo = 1;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(2);
    const res = runner();
    expect(foo).toBe(3);
    expect(res).toBe("foo");
  });
  
});
