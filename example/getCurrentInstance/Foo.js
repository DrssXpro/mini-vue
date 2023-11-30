import { getCurrentInstance, h } from "../../lib/guide-mini-vue.esm.js";
export const Foo = {
  setup() {
    const instance = getCurrentInstance();
    console.log("Foo:", instance);
  },
  render() {
    return h("div", {}, "foo:" + this.count);
  },
};
