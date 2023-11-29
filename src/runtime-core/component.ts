import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    // 💡：setup 返回的对象 value
    setupState: {},
    // 💡：组件接收 props
    props: {},
    // 💡：emit 方法
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props);
  // initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  const { setup } = Component;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
    handleSetupResult(instance, setupResult);
  }

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}

function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  // TODO: function
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  instance.render = Component.render;
}
