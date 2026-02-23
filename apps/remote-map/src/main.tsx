import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import GalaxyPage from "./screens/GalaxyPage";
import { queryClient } from "./query";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GalaxyPage getHost={() => null} />
    </QueryClientProvider>
  </React.StrictMode>
);
