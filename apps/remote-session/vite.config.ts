import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";
import { withZephyr, type ModuleFederationOptions } from "vite-plugin-zephyr";

const mfConfig: ModuleFederationOptions = {
  name: "session",
  filename: "remoteEntry.js",
  exposes: {
    "./remote": "./src/remote.tsx"
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
    server: { port: 5174, strictPort: true },
    build: { target: "chrome89" }
  };
});
