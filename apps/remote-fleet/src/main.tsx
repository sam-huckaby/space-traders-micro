import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import FleetPage from "./screens/FleetPage";
import { queryClient } from "./query";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FleetPage getHost={() => null} />
    </QueryClientProvider>
  </React.StrictMode>
);
