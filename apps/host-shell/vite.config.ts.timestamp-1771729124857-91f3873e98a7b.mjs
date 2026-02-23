// vite.config.ts
import { defineConfig } from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/vite@5.4.21/node_modules/vite/dist/node/index.js";
import react from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21/node_modules/@vitejs/plugin-react/dist/index.js";
import { federation } from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/@module-federation+vite@1.11.0_rollup@4.58.0_typescript@5.9.3_vite@5.4.21/node_modules/@module-federation/vite/lib/index.cjs";
import { withZephyr } from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/vite-plugin-zephyr@0.1.10_https-proxy-agent@7.0.6_rollup@4.58.0_typescript@5.9.3_vite@5.4.21/node_modules/vite-plugin-zephyr/dist/index.js";
var mfConfig = {
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
var vite_config_default = defineConfig(() => {
  const enableZephyr = process.env.ZEPHYR_ENABLE === "1";
  return {
    plugins: [
      react(),
      federation({ ...mfConfig }),
      ...enableZephyr ? withZephyr() : []
    ],
    server: { port: 5173, strictPort: true },
    build: {
      target: "chrome89",
      modulePreload: {
        resolveDependencies: (_, deps) => {
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FtaHVja2FieS9kZXZlbG9wbWVudC9zcGFjZS10cmFkZXJzLW1pY3JvL2FwcHMvaG9zdC1zaGVsbFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NhbWh1Y2thYnkvZGV2ZWxvcG1lbnQvc3BhY2UtdHJhZGVycy1taWNyby9hcHBzL2hvc3Qtc2hlbGwvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhbWh1Y2thYnkvZGV2ZWxvcG1lbnQvc3BhY2UtdHJhZGVycy1taWNyby9hcHBzL2hvc3Qtc2hlbGwvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZmVkZXJhdGlvbiB9IGZyb20gXCJAbW9kdWxlLWZlZGVyYXRpb24vdml0ZVwiO1xuaW1wb3J0IHsgd2l0aFplcGh5ciwgdHlwZSBNb2R1bGVGZWRlcmF0aW9uT3B0aW9ucyB9IGZyb20gXCJ2aXRlLXBsdWdpbi16ZXBoeXJcIjtcblxuY29uc3QgbWZDb25maWc6IE1vZHVsZUZlZGVyYXRpb25PcHRpb25zID0ge1xuICBuYW1lOiBcImhvc3RcIixcbiAgZmlsZW5hbWU6IFwicmVtb3RlRW50cnkuanNcIixcbiAgcmVtb3Rlczoge1xuICAgIHNlc3Npb246IHtcbiAgICAgIG5hbWU6IFwic2Vzc2lvblwiLFxuICAgICAgZW50cnk6IFwiaHR0cDovL2xvY2FsaG9zdDo1MTc0L3JlbW90ZUVudHJ5LmpzXCIsXG4gICAgICB0eXBlOiBcIm1vZHVsZVwiXG4gICAgfSxcbiAgICBmbGVldDoge1xuICAgICAgbmFtZTogXCJmbGVldFwiLFxuICAgICAgZW50cnk6IFwiaHR0cDovL2xvY2FsaG9zdDo1MTc1L3JlbW90ZUVudHJ5LmpzXCIsXG4gICAgICB0eXBlOiBcIm1vZHVsZVwiXG4gICAgfSxcbiAgICBtYXA6IHtcbiAgICAgIG5hbWU6IFwibWFwXCIsXG4gICAgICBlbnRyeTogXCJodHRwOi8vbG9jYWxob3N0OjUxNzYvcmVtb3RlRW50cnkuanNcIixcbiAgICAgIHR5cGU6IFwibW9kdWxlXCJcbiAgICB9LFxuICAgIGNvbnRyYWN0czoge1xuICAgICAgbmFtZTogXCJjb250cmFjdHNcIixcbiAgICAgIGVudHJ5OiBcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3Ny9yZW1vdGVFbnRyeS5qc1wiLFxuICAgICAgdHlwZTogXCJtb2R1bGVcIlxuICAgIH1cbiAgfSxcbiAgc2hhcmVkOiB7XG4gICAgcmVhY3Q6IHsgc2luZ2xldG9uOiB0cnVlIH0sXG4gICAgXCJyZWFjdC1kb21cIjogeyBzaW5nbGV0b246IHRydWUgfSxcbiAgICBcInJlYWN0LXJvdXRlci1kb21cIjogeyBzaW5nbGV0b246IHRydWUgfVxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xuICBjb25zdCBlbmFibGVaZXBoeXIgPSBwcm9jZXNzLmVudi5aRVBIWVJfRU5BQkxFID09PSBcIjFcIjtcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBmZWRlcmF0aW9uKHsgLi4ubWZDb25maWcgfSksXG4gICAgICAuLi4oZW5hYmxlWmVwaHlyID8gd2l0aFplcGh5cigpIDogW10pXG4gICAgXSxcbiAgICBzZXJ2ZXI6IHsgcG9ydDogNTE3Mywgc3RyaWN0UG9ydDogdHJ1ZSB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6IFwiY2hyb21lODlcIixcbiAgICAgIG1vZHVsZVByZWxvYWQ6IHtcbiAgICAgICAgcmVzb2x2ZURlcGVuZGVuY2llczogKF8sIGRlcHM6IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGRlcHMuZmlsdGVyKChkZXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzUmVhY3RQYWNrYWdlID0gZGVwLmluY2x1ZGVzKFwicmVhY3RcIikgfHwgZGVwLmluY2x1ZGVzKFwicmVhY3QtZG9tXCIpO1xuICAgICAgICAgICAgY29uc3QgaXNOb3RSZW1vdGVFbnRyeSA9ICFkZXAuaW5jbHVkZXMoXCJyZW1vdGVFbnRyeS5qc1wiKTtcbiAgICAgICAgICAgIHJldHVybiBpc1JlYWN0UGFja2FnZSAmJiBpc05vdFJlbW90ZUVudHJ5O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFYLFNBQVMsb0JBQW9CO0FBQ2xaLE9BQU8sV0FBVztBQUNsQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGtCQUFnRDtBQUV6RCxJQUFNLFdBQW9DO0FBQUEsRUFDeEMsTUFBTTtBQUFBLEVBQ04sVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLElBQ1AsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsTUFDUCxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsV0FBVztBQUFBLE1BQ1QsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPLEVBQUUsV0FBVyxLQUFLO0FBQUEsSUFDekIsYUFBYSxFQUFFLFdBQVcsS0FBSztBQUFBLElBQy9CLG9CQUFvQixFQUFFLFdBQVcsS0FBSztBQUFBLEVBQ3hDO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWEsTUFBTTtBQUNoQyxRQUFNLGVBQWUsUUFBUSxJQUFJLGtCQUFrQjtBQUVuRCxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixXQUFXLEVBQUUsR0FBRyxTQUFTLENBQUM7QUFBQSxNQUMxQixHQUFJLGVBQWUsV0FBVyxJQUFJLENBQUM7QUFBQSxJQUNyQztBQUFBLElBQ0EsUUFBUSxFQUFFLE1BQU0sTUFBTSxZQUFZLEtBQUs7QUFBQSxJQUN2QyxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixlQUFlO0FBQUEsUUFDYixxQkFBcUIsQ0FBQyxHQUFHLFNBQW1CO0FBQzFDLGlCQUFPLEtBQUssT0FBTyxDQUFDLFFBQVE7QUFDMUIsa0JBQU0saUJBQWlCLElBQUksU0FBUyxPQUFPLEtBQUssSUFBSSxTQUFTLFdBQVc7QUFDeEUsa0JBQU0sbUJBQW1CLENBQUMsSUFBSSxTQUFTLGdCQUFnQjtBQUN2RCxtQkFBTyxrQkFBa0I7QUFBQSxVQUMzQixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
