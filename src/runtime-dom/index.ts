import { createRender } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(el, key, prevVal, newVal) {
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, newVal);
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

const renderer: any = createRender({ createElement, patchProps, insert });

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
