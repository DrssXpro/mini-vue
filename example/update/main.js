import { createApp } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./app.js";
import { UpdateEvent } from "./updateEvent.js";
const root = document.querySelector("#app");
createApp(UpdateEvent).mount(root);
