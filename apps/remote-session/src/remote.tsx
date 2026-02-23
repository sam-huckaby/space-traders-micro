import React from "react";
import type { HostApi, RemoteModule } from "@deck/contracts";
import SessionPage from "./screens/SessionPage";
import "./styles.css";

let host: HostApi | null = null;

const mod: RemoteModule = {
  init(h) {
    host = h;
  },
  navItems: [{ key: "session", label: "Session", to: "/session", order: 0 }],
  routes: [{ path: "/session", element: <SessionPage getHost={() => host} /> }]
};

export default mod;
