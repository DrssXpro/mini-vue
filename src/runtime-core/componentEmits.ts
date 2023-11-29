import { camelize, toHandlerKey } from "../shared";

export function emit(instance, event, ...args) {
  const { props } = instance;
  // string: add => onAdd
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
