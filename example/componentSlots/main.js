import { createApp } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./app.js";

const root = document.querySelector("#app");
createApp(App).mount(root);
