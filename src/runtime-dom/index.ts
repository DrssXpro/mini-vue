import { createRender } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(el, key, val) {
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
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
