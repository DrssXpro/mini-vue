import { h, ref } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  name: "App",
  setup() {
    const count = ref(0);

    const props = ref({
      foo: "foo",
      bar: "bar",
    });

    const onClick = () => {
      count.value++;
    };

    const changeProps1 = () => {
      props.value.foo = "new-foo";
    };

    const changeProps2 = () => {
      props.value.foo = undefined;
    };

    const changeProps3 = () => {
      props.value = {
        foo: "foo",
      };
    };

    return {
      count,
      props,
      onClick,
      changeProps1,
      changeProps2,
      changeProps3,
    };
  },

  render() {
    return h("div", { ...this.props }, [
      h("div", {}, "count:" + this.count),
      h("button", { onClick: this.onClick }, "Add"),
      h("button", { onClick: this.changeProps1 }, "update Props"),
      h("button", { onClick: this.changeProps2 }, "set Props undefined"),
      h("button", { onClick: this.changeProps3 }, "delete props"),
    ]);
  },
};
