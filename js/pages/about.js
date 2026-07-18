import { initApp, setDataStatus } from "../app.js";

const page = document.body.dataset.page || "";
initApp(page);
setDataStatus("Data lokal siap", "ready");
