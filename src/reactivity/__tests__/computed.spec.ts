import { describe, expect, it, vi } from "vitest";
import { reactive } from "../reactive";
import { computed } from "../computed";

describe("computed", () => {
  it("happy path", () => {
    const user = reactive({ count: 1 });

    const count = computed(() => {
      return user.count;
    });

    expect(count.value).toBe(1);
  });

  it("should compute lazily", () => {
    const value = reactive({
      foo: 1,
    });
    const getter = vi.fn(() => {
      return value.foo;
    });

    const cValue = computed(getter);

    expect(getter).not.toHaveBeenCalled();
    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);
    cValue.value; // 第二次触发 get 时不会再重新执行 getter 获取值
    expect(getter).toHaveBeenCalledTimes(1);

    value.foo = 2; // 触发依赖的响应式数据，会执行调度器而不是 getter
    expect(getter).toHaveBeenCalledTimes(1);

    expect(cValue.value).toBe(2); // 访问 computed value，判断是否使用缓存决定调用 getter
    expect(getter).toHaveBeenCalledTimes(2);

    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
