import { describe, expect, it, vi } from "vitest";
import { reactive } from "../reactive";
import { effect, stop } from "../effect";

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

  it("scheduler", () => {
    let dummy;
    let run: any;

    const scheduler = vi.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });

    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );

    // 首次依赖收集不执行调度器而是执行 fn
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    // 触发 setter
    obj.foo++; //obj.foo: 1 -> 2, dummy: 1
    // 如果有 scheduler 则调用 scheduler 不再调用 fn
    expect(scheduler).toHaveBeenCalledTimes(1);
    // scheduler 中没有改变 obj.foo
    expect(dummy).toBe(1);

    // 手动调用 run（fn）
    run();
    // 触发 fn 调用，dummy = obj.foo
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy; 
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });

    obj.prop = 2;
    expect(dummy).toBe(2);
    // 停止 runner (触发 setter trigger 逻辑)
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    // 手动调用 runner
    runner();
    expect(dummy).toBe(3);
  });
});
