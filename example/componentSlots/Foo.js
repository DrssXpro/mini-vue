import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup() {},
  render() {
    // 普通插槽
    // return h("div", {}, [h("p", {}, "foo"), renderSlots(this.$slots)]);
    // 具名插槽：指定位置渲染
    // return h("div", {}, [renderSlots(this.$slots, "header"), h("p", {}, "foo"), renderSlots(this.$slots, "footer")]);
    // 作用域插槽：子组件将数据传递至父组件 => renderSlots 增加第三个参数传递数据
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      h("p", {}, "foo"),
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
