import type { HostApi } from "./hostApi";
import type { ReactNode } from "react";

export type NavItem = {
  key: string;
  label: string;
  to: string;
  order?: number;
};

export type RemoteModule = {
  init(host: HostApi): void;
  routes: Array<{
    path: string;
    element: ReactNode;
  }>;
  navItems?: NavItem[];
};
