export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    // 💡：setup 返回的对象 value
    setupState: {},
  };

  return component;
}

export function setupComponent(instance) {
  // TODO
  // initProps()
  // initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  const { setup } = Component;

  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }

  instance.proxy = new Proxy(
    {},
    {
      get(value, key) {
        const { setupState } = instance;
        if (key in setupState) {
          return setupState[key];
        }
      },
    }
  );
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
