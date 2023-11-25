import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";

// 💡：优化，重复调用时直接使用 get 变量，而不是重复执行 create 函数
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

// 💡：抽离出 Proxy 中的 get 逻辑
function createGetter(isReadonly = false) {
  return function get(target, key) {
    // 💡：判断 reactive 对象，访问一个指定的属性，同时区分 readonly
    if (key === ReactiveFlags.IS_RECTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);
    if (!isReadonly) track(target, key);
    return res;
  };
}

// 💡：抽离出 Proxy 中的 set 逻辑
function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

// 💡： Proxy 里的 handle 逻辑单独抽离
export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set: function (target, key) {
    // 💡：readonly set 时给予警告
    console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
    return true;
  },
};
