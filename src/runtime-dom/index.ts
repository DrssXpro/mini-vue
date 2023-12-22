import { createRender } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(el, key, prevVal, newVal) {
  // 💡：针对于事件的处理的性能优化：避免 remove add DOM API 频繁调用
  if (isOn(key)) {
    // el 上额外保存一个对象用来保存添加的事件处理函数
    const invokers = el._vei || (el._vei = {});
    const currentInvoker = invokers[key];
    // update 操作：只更改 invoker 上的 value
    if (newVal && currentInvoker) {
      currentInvoker.value = newVal;
    } else {
      // add 操作
      const event = key.slice(2).toLowerCase();
      if (newVal) {
        // invoker 是一个函数用来代替用户属性绑定的事件处理函数，内部调用用户绑定的函数
        // 后续进行 update 时只需更改其 value 值，无需重复 removeEventListener
        const invoker: any = (invokers[key] = (e) => {
          invoker.value(e);
        });
        invoker.value = newVal;
        // 用 invoker 代理用户传入的事件处理函数
        el.addEventListener(event, invoker);
      } else if (currentInvoker) {
        // delete 操作 同时将对应的 invoker 置空
        el.removeEventListener(event, currentInvoker);
        invokers[key] = undefined;
      }
    }
  } else {
    if (newVal === undefined || newVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newVal);
    }
  }
}

function insert(child, parent, anchor) {
  // 在 anchor 元素之前插入，null 时默认插入到尾部
  parent.insertBefore(child, anchor || null);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRender({ createElement, patchProps, insert, remove, setElementText });

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
