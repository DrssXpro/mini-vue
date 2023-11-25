import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

// 💡：针对于 Proxy 代理对象的创建进一步抽离
function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
