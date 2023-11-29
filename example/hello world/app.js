import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./foo.js";
window.self = null;
export const App = {
  render() {
    window.self = this;
    return h("div", { id: "root" }, [
      h(
        "p",
        {
          class: "red",
          onClick: () => {
            console.log("click");
          },
          onMouseMove: () => {
            console.log("mouse move");
          },
        },
        "hi:" + this.test
      ),
      h("div", { class: "green" }, this.msg),
      h(Foo, { count: 100 }),
    ]);
  },
  setup() {
    return {
      msg: "mini-vue this",
      test: "test value",
    };
  },
};
