import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { HostApi, RemoteModule } from "@deck/contracts";
import { queryClient } from "./query";
import GalaxyPage from "./screens/GalaxyPage";
import SystemPage from "./screens/SystemPage";
import "./styles.css";

let host: HostApi | null = null;

function withQuery(node: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>;
}

export default {
  init(h) {
    host = h;
  },
  navItems: [{ key: "map", label: "Map", to: "/map", order: 20 }],
  routes: [
    { path: "/map", element: withQuery(<SystemPage getHost={() => host} />) },
    { path: "/map/galaxy", element: withQuery(<GalaxyPage getHost={() => host} />) },
    { path: "/map/system/:systemSymbol", element: withQuery(<SystemPage getHost={() => host} />) }
  ]
} satisfies RemoteModule;
