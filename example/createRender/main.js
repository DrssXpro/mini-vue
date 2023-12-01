import { createRender } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./app.js";

const game = new PIXI.Application({
  width: 500,
  height: 500,
});

document.body.append(game.view);
// 利用自定义渲染器，使用 PIXI API 渲染视图
const renderer = createRender({
  createElement(type) {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  },
  patchProps(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

renderer.createApp(App).mount(game.stage);
