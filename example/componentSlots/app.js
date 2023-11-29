import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  setup() {},
  render() {
    const app = h("div", {}, "App");
    // 添加插槽：将内容给到 Foo 里的 chilren 中
    const foo1 = h(Foo, {}, h("p", {}, "slot content"));
    // 多个插槽 => 数组存放
    const foo2 = h(Foo, {}, [h("p", {}, "slot content1"), h("p", {}, "slot content2")]);
    // 具名插槽：指定插槽存放位置 => object key 标识
    const foo3 = h(Foo, {}, { header: h("p", {}, "slot header content"), footer: h("p", {}, "slot footer content") });
    // 作用域插槽：获取子组件传递出来的数据
    const foo4 = h(
      Foo,
      {},
      {
        header: ({ age }) => h("p", {}, "son header slots data: " + age),
        footer: () => h("p", {}, "slot footer content"),
      }
    );
    return h("div", {}, [app, foo4]);
  },
};
