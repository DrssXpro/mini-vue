export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    // 💡：保存虚拟 DOM 创建后的真实 DOM
    el: undefined,
  };
  return vnode;
}
