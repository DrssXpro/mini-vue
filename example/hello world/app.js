export const App = {
  render() {
    return h("div", { id: "root", class: ["red", "blue"] }, "hi, mini-vue");
  },
  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
