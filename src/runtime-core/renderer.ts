import { isOn } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  // 💡patch：整个应用挂载阶段不存在父级节点
  patch(vnode, container, null);
}

function patch(vnode, container, parentComponent) {
  // 💡 基于 ShapeFlags 判断： element / component
  const { shapeFlag, type } = vnode;
  // 💡：增加对 Fragment、Text 判断的逻辑
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent);
      }
  }
}

function processFragment(vnode, container, parentComponent) {
  mountChildren(vnode, container, parentComponent);
}

function processText(vnode, container) {
  // 拿到纯文本
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function processElement(vnode, container, parentComponent) {
  mountElement(vnode, container, parentComponent);
}

function mountElement(vnode, container, parentComponent) {
  // 💡：创建 DOM 同时在 vnode 上进行保存
  const el = (vnode.el = document.createElement(vnode.type));

  // handle props
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    // 💡：事件处理 on 开头属性
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  // 💡：ShapeFlags handle Children
  const { children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el, parentComponent);
  }

  container.append(el);
}

function mountChildren(vnode, container, parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent);
  });
}

function processComponent(vnode, container, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(vnode, container, parentComponent) {
  const instance = createComponentInstance(vnode, parentComponent);
  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  // 💡：当前组件作为下一次 patch 的父组件
  patch(subTree, container, instance);
  // 💡：组件的 el 需要取到其 render 函数执行后的第一个节点创建的真实 DOM
  vnode.el = subTree.el;
}
