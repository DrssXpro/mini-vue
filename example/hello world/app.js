import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  render() {
    return h("div", { id: "root" }, [
      h("p", { class: "red" }, "hi:" + this.test),
      h("div", { class: "green" }, this.msg),
    ]);
  },
  setup() {
    return {
      msg: "mini-vue this",
      test: "test value",
    };
  },
};