import { proxyRefs, shallowReadonly } from "../reactivity";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    // 💡：判断是否已经挂载（初始化区分）
    isMounted: false,
    // 💡：存储当前的 vnode tree（下次 patch 更新当作旧 tree 使用）
    subTree: {},
    // 💡：setup 返回的对象 value
    setupState: {},
    // 💡：组件接收 props
    props: {},
    // 💡：slots, 存放 children
    slots: {},
    // 💡：provide API 存放数据的容器，每个组件实例对象都具备
    provides: parent ? parent.provides : {},
    // 💡：parent 属性存放父级实例
    parent,
    // 💡：emit 方法
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    // 💡：在 setup 之前保存当前实例对象
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}

function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }
  // TODO: function
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  instance.render = Component.render;
}

// 利用全局变量保存当前 instance
let currentInstance = null;
export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}
