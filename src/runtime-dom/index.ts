import { createRender } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(el, key, prevVal, newVal) {
  // 💡：针对于事件的处理：事件处理函数要进行更新需要把之前的进行 remove，因此需要缓存
  if (isOn(key)) {
    // el 上额外保存一个对象用来缓存添加的事件处理函数
    const invokers = el._vei || (el._vei = {});
    const existing = invokers[key];
    // update 操作
    if (newVal && existing) {
      existing.value = newVal;
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
        el.addEventListener(event, invoker);
      } else if (existing) {
        // delete 操作 同时将对应的 invoker 置空
        el.removeEventListener(event, existing);
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

function insert(el, parent) {
  parent.append(el);
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
