import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProviders = currentInstance.parent.provides;
    // 💡init：创建组件实例时设置的 provides 属性值是父组件实例的 provides，作为初始化判断依据
    if (provides === parentProviders) {
      provides = currentInstance.provides = Object.create(parentProviders);
    }
    provides[key] = value;
  }
}

export function inject(key, defalutValue?) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    // 💡：这里 inject 是拿到 parent的 Proviers
    const parentProviders = currentInstance.parent.provides;
    if (key in parentProviders) {
      return parentProviders[key];
    } else if (defalutValue) {
      if (typeof defalutValue === "function") {
        return defalutValue.call(currentInstance);
      } else {
        return defalutValue;
      }
    }
  }
}
