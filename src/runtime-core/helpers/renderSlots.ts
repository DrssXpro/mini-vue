import { createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    // 针对于作用域插槽的处理
    if (typeof slot === "function") {
      return createVNode("div", {}, slot(props));
    } else {
      return createVNode("div", {}, slot);
    }
  }
}
