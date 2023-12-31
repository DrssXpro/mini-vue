import { extend, isObject } from "../shared";
import { track, trigger } from "./effect";
import { ReactiveFlags, reactive, readonly } from "./reactive";

// 💡：优化，重复调用时直接使用 get 变量，而不是重复执行 create 函数
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true); 

// 💡：抽离出 Proxy 中的 get 逻辑
function createGetter(isReadonly = false, isShallow = false) {
  return function get(target, key) {
    // 💡：判断 reactive 对象，访问一个指定的属性，同时区分 readonly
    if (key === ReactiveFlags.IS_RECTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);

    // 💡：增加 shallow 额外判断，不再进行深度代理
    if (isShallow) return res;

    // 💡：考虑 value 为引用值的情况，针对于 value 进行代理
    if (isObject(res)) {
      // 注意 readonly 的区分
      return isReadonly ? readonly(res) : reactive(res);
    }

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

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
