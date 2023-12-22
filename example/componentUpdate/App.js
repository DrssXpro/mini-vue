// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref } from "../../lib/guide-mini-vue.esm.js";
import Child from "./Child.js";

export default {
  name: "App",
  setup() {
    const msg = ref("123");
    const text = ref("text");
    window.msg = msg;

    const changeChildProps = () => {
      msg.value += "456";
    };

    const changeText = () => {
      text.value += "hello";
    };

    return { msg, text, changeChildProps, changeText };
  },

  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        "button",
        {
          onClick: this.changeChildProps,
        },
        "change child props"
      ),
      h(
        "button",
        {
          onClick: this.changeText,
        },
        "change text"
      ),
      h(Child, {
        msg: this.msg,
      }),
      h("p", {}, this.text),
    ]);
  },
};
