import { Fragment, createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function") {
      // 💡：使用 Fragment 节点包裹 slots
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
