// 💡：针对于 this 上的不同$属性，进行 map 抽离
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

// 💡：组件 this 访问代理 proxy 的 getter、setter 抽离
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // setupState
    const { setupState } = instance;
    if (key in setupState) {
      return setupState[key];
    }
    // $ 属性
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
