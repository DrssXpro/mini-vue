import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("emitButton");
      emit("add", "FooComponent");
    };

    const emitAddFoo = () => {
      emit("add-foo");
    };

    return {
      emitAdd,
      emitAddFoo,
    };
  },
  render() {
    const btn1 = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "emitAdd"
    );

    const btn2 = h(
      "button",
      {
        onClick: this.emitAddFoo,
      },
      "emitAddFoo"
    );
    return h("div", {}, ["foo", btn1, btn2]);
  },
};
