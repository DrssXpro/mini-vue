import { effect } from "../reactivity";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRender(options) {
  const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert } = options;
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
    mountChildren(n2, container, parentComponent);
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
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    console.log("n1:", n1, "n2:", n2);
  }

  function mountElement(vnode, container, parentComponent) {
    // 💡：创建 DOM 同时在 vnode 上进行保存
    const el = (vnode.el = hostCreateElement(vnode.type));

    // handle props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProps(el, key, val);
    }

    // 💡：ShapeFlags handle Children
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    hostInsert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
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
