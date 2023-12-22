// 是否更新组件
export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;

  // 对比 props 是否发生更新
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) return true;
  }

  return false;
}
