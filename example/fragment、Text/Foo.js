import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup() {},
  render() {
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      h("p", {}, "foo"),
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
