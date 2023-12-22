import { isObject } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    // 💡：vnode diff 唯一标识
    key: props && props.key,
    // 💡：初始化节点类型
    shapeFlag: getShapeFlag(type),
    // 💡：保存虚拟 DOM 创建后的真实 DOM
    el: undefined,
  };

  // 💡：设置节点的 children 类型
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 💡：设置节点插槽的类型：组件 + children object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(vnode.children)) {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

// 💡：纯文本处理 API
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

// 初始化根据 type 判断类型
function getShapeFlag(type) {
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

// 💡：diff 判断两节点是否相同
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
