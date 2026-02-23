import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { HostApi, RemoteModule } from "@deck/contracts";
import { queryClient } from "./query";
import FleetPage from "./screens/FleetPage";
import ShipPage from "./screens/ShipPage";
import "./styles.css";

let host: HostApi | null = null;

function withQuery(node: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>;
}

export default {
  init(h) {
    host = h;
  },
  navItems: [{ key: "fleet", label: "Fleet", to: "/fleet", order: 10 }],
  routes: [
    { path: "/fleet", element: withQuery(<FleetPage getHost={() => host} />) },
    { path: "/fleet/ships/:shipSymbol", element: withQuery(<ShipPage getHost={() => host} />) }
  ]
} satisfies RemoteModule;
