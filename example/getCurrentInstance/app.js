import { getCurrentInstance, h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./foo.js";

export const App = {
  render() {
    return h("div", { id: "root" }, [
      h("p", { class: "red" }, "hi:" + this.test),
      h("div", { class: "green" }, this.msg),
      h(Foo, { count: 100 }),
    ]);
  },
  setup() {
    const instance = getCurrentInstance();
    console.log("app:", instance);
    return {
      msg: "mini-vue this",
      test: "test value",
    };
  },
};
