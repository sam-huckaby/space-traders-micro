import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { HostApi, RemoteModule } from "@deck/contracts";
import { queryClient } from "./query";
import ContractsPage from "./screens/ContractsPage";
import ContractPage from "./screens/ContractPage";
import "./styles.css";

let host: HostApi | null = null;

function withQuery(node: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>;
}

export default {
  init(h) {
    host = h;
  },
  navItems: [{ key: "contracts", label: "Contracts", to: "/contracts", order: 30 }],
  routes: [
    { path: "/contracts", element: withQuery(<ContractsPage getHost={() => host} />) },
    { path: "/contracts/:contractId", element: withQuery(<ContractPage getHost={() => host} />) }
  ]
} satisfies RemoteModule;
