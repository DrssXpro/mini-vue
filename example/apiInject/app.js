import { h, inject, provide } from "../../lib/guide-mini-vue.esm.js";

const Son = {
  setup() {
    const val1 = inject("GKey");
    const val2 = inject("FKey");
    const val3 = inject("default", "default value");

    return {
      val1,
      val2,
      val3,
    };
  },
  render() {
    return h("div", {}, [
      h("p", {}, "Son Component:" + this.val1),
      h("p", {}, "Son Component:" + this.val2),
      h("p", {}, "Son Component:" + this.val3),
    ]);
  },
};

const Father = {
  setup() {
    provide("FKey", "FatherValue");
  },
  render() {
    return h("div", {}, [h("p", {}, "Father Component"), h(Son)]);
  },
};

const GrandFather = {
  setup() {
    provide("GKey", "GrandFatherValue");
  },
  render() {
    return h("div", {}, [h("p", {}, "GrandFather Component"), h(Father)]);
  },
};

export const App = {
  setup() {},
  render() {
    return h(GrandFather);
  },
};
