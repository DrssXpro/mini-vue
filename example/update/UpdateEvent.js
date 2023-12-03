import { h, ref } from "../../lib/guide-mini-vue.esm.js";
export const UpdateEvent = {
  name: "UpdateEvent",
  setup() {
    const changeEvent = ref(true);

    const onClick1 = () => {
      console.log("click1");
    };

    const onClick2 = () => {
      console.log("click2");
    };
    const handleChangeEvent = () => {
      changeEvent.value = !changeEvent.value;
      console.log(changeEvent.value);
    };

    return {
      changeEvent,
      onClick1,
      onClick2,
      handleChangeEvent,
    };
  },

  render() {
    return h("div", { onClick: this.changeEvent ? this.onClick1 : this.onClick2 }, [
      h("p", {}, "test"),
      h("button", { onClick: this.handleChangeEvent }, "changeEvent"),
    ]);
  },
};
