import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import ContractsPage from "./screens/ContractsPage";
import { queryClient } from "./query";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ContractsPage getHost={() => null} />
    </QueryClientProvider>
  </React.StrictMode>
);
