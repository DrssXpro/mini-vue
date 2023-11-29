import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  setup() {},
  render() {
    return h("div", {}, [
      h(Foo, {
        onAdd: (name) => {
          console.log("onAdd: 父组件回调," + name);
        },
        onAddFoo: () => {
          console.log("onAddFoo: 父组件回调");
        },
      }),
    ]);
  },
};
