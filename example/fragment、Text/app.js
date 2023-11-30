import { createTextVNode, h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  setup() {},
  render() {
    const app = h("div", {}, "App");
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h("p", {}, "son header slots data: " + age),
        footer: () => h("p", {}, "slot footer content"),
      }
    );
    // 💡：使用 API 增加纯文本节点
    return h("div", {}, [app, foo, createTextVNode("hello 纯文本")]);
  },
};
