import React from "react";
import ReactDOM from "react-dom/client";
import SessionPage from "./screens/SessionPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionPage getHost={() => null} />
  </React.StrictMode>
);
