import { effect } from "../reactivity";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRender(options) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  function render(vnode, container) {
    // 💡patch：整个应用挂载阶段不存在父级节点
    patch(null, vnode, container, null);
  }

  // 💡 n1:旧 vnodeTree，b2: 新 vnodeTree
  function patch(n1, n2, container, parentComponent) {
    // 💡 基于 ShapeFlags 判断： element / component
    const { shapeFlag, type } = n2;
    // 💡：增加对 Fragment、Text 判断的逻辑
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }

  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processText(n1, n2, container) {
    // 拿到纯文本
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    // update props
    const oldProps = n1.props || EMPTY_OBJECT;
    const newProps = n2.props || EMPTY_OBJECT;
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const currentShapeFlag = n2.shapeFlag;
    if (currentShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // n1: [vnode ,vnode]  n2: "text"
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children);
      }
      // n1: "text" or 卸载过后的 children 数组  n2: "text"
      if (n1.children !== n2.children) {
        hostSetElementText(container, n2.children);
      }
    } else {
      // n1: "text" n2: [vnode, vnode]
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(n2.children, container, parentComponent);
      }
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // update prop => traverse newProps
      for (const key in newProps) {
        const prevVal = oldProps[key];
        const newVal = newProps[key];
        if (prevVal !== newVal) {
          hostPatchProps(el, key, prevVal, newVal);
        }
      }
      if (oldProps !== EMPTY_OBJECT) {
        // delete prop => traverse oldProps
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProps(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(vnode, container, parentComponent) {
    // 💡：创建 DOM 同时在 vnode 上进行保存
    const el = (vnode.el = hostCreateElement(vnode.type));

    // handle props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProps(el, key, null, val);
    }

    // 💡：ShapeFlags handle Children
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent);
    }

    hostInsert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      hostRemove(el);
    }
  }

  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(vnode, container, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
  }

  function setupRenderEffect(instance, vnode, container) {
    effect(() => {
      // 实例增加额外变量判断初始化
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 将当前的 subTree 保存至实例上
        const subTree = (instance.subTree = instance.render.call(proxy));
        // 💡：当前组件作为下一次 patch 的父组件
        patch(null, subTree, container, instance);
        // 💡：组件的 el 需要取到其 render 函数执行后的第一个节点创建的真实 DOM
        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        // 更新逻辑
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        // 及时更新实例上的 subTree
        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
