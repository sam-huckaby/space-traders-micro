import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";
import { withZephyr, type ModuleFederationOptions } from "vite-plugin-zephyr";

const mfConfig: ModuleFederationOptions = {
  name: "host",
  filename: "remoteEntry.js",
  remotes: {
    session: {
      name: "session",
      entry: "http://localhost:5174/remoteEntry.js",
      type: "module"
    },
    fleet: {
      name: "fleet",
      entry: "http://localhost:5175/remoteEntry.js",
      type: "module"
    },
    map: {
      name: "map",
      entry: "http://localhost:5176/remoteEntry.js",
      type: "module"
    },
    contracts: {
      name: "contracts",
      entry: "http://localhost:5177/remoteEntry.js",
      type: "module"
    }
  },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
    "react-router-dom": { singleton: true }
  }
};

export default defineConfig(() => {
  const enableZephyr = process.env.ZEPHYR_ENABLE === "1";

  return {
    plugins: [
      react(),
      tailwindcss(),
      federation({ ...mfConfig }),
      ...(enableZephyr ? withZephyr() : [])
    ],
    server: { port: 5173, strictPort: true },
    build: {
      target: "chrome89",
      modulePreload: {
        resolveDependencies: (_, deps: string[]) => {
          return deps.filter((dep) => {
            const isReactPackage = dep.includes("react") || dep.includes("react-dom");
            const isNotRemoteEntry = !dep.includes("remoteEntry.js");
            return isReactPackage && isNotRemoteEntry;
          });
        }
      }
    }
  };
});
