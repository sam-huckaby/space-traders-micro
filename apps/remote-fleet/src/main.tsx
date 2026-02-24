import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import FleetPage from "./screens/FleetPage";
import { queryClient } from "./query";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <FleetPage getHost={() => null} />
      </QueryClientProvider>
    </MemoryRouter>
  </React.StrictMode>
);
