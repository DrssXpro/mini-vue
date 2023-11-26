import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";

// 💡：私有属性功能属性枚举
export enum ReactiveFlags {
  IS_RECTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

export function isProxy(raw) {
  return isReactive(raw) || isReadonly(raw);
}

// 💡：访问内置的属性进行判断
export function isReactive(value) {
  // attention：如果不存在该属性会返回 undefined，因此双重取反
  return !!value[ReactiveFlags.IS_RECTIVE];
}
// 💡
export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

// 💡：针对于 Proxy 代理对象的创建进一步抽离
function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
