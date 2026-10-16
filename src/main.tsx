import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Order matters: it reproduces the original cascade (antd core, global overrides, antd components, dashboard styles).
import "./styles/vendor/antd-v4-core.css";
import "./styles/global.css";
import "./styles/vendor/antd-v4-components.css";
import "./styles/app.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
