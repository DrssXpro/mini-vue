// 测试 nextTick 逻辑
import { h, ref, nextTick, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";

export default {
  name: "NextTicker",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();
    const onClick = () => {
      for (let i = 1; i < 100; i++) {
        count.value++;
      }
      console.log(instance.subTree.children[0].children);
      nextTick(() => {
        console.log(instance.subTree.children[0].children);
      });
    };

    return {
      count,
      onClick,
    };
  },
  render() {
    return h("div", { tId: "nextTicker" }, [h("button", { onClick: this.onClick }, `COUNT:${this.count}`)]);
  },
};
