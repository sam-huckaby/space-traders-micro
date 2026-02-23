// vite.config.ts
import { defineConfig } from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/vite@5.4.21/node_modules/vite/dist/node/index.js";
import react from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21/node_modules/@vitejs/plugin-react/dist/index.js";
import { federation } from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/@module-federation+vite@1.11.0_rollup@4.58.0_typescript@5.9.3_vite@5.4.21/node_modules/@module-federation/vite/lib/index.cjs";
import { withZephyr } from "file:///Users/samhuckaby/development/space-traders-micro/node_modules/.pnpm/vite-plugin-zephyr@0.1.10_https-proxy-agent@7.0.6_rollup@4.58.0_typescript@5.9.3_vite@5.4.21/node_modules/vite-plugin-zephyr/dist/index.js";
var mfConfig = {
  name: "contracts",
  filename: "remoteEntry.js",
  exposes: {
    "./remote": "./src/remote.tsx"
  },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
    "react-router-dom": { singleton: true },
    "@tanstack/react-query": { singleton: true }
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
    server: { port: 5177, strictPort: true },
    build: { target: "chrome89" }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FtaHVja2FieS9kZXZlbG9wbWVudC9zcGFjZS10cmFkZXJzLW1pY3JvL2FwcHMvcmVtb3RlLWNvbnRyYWN0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NhbWh1Y2thYnkvZGV2ZWxvcG1lbnQvc3BhY2UtdHJhZGVycy1taWNyby9hcHBzL3JlbW90ZS1jb250cmFjdHMvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhbWh1Y2thYnkvZGV2ZWxvcG1lbnQvc3BhY2UtdHJhZGVycy1taWNyby9hcHBzL3JlbW90ZS1jb250cmFjdHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZmVkZXJhdGlvbiB9IGZyb20gXCJAbW9kdWxlLWZlZGVyYXRpb24vdml0ZVwiO1xuaW1wb3J0IHsgd2l0aFplcGh5ciwgdHlwZSBNb2R1bGVGZWRlcmF0aW9uT3B0aW9ucyB9IGZyb20gXCJ2aXRlLXBsdWdpbi16ZXBoeXJcIjtcblxuY29uc3QgbWZDb25maWc6IE1vZHVsZUZlZGVyYXRpb25PcHRpb25zID0ge1xuICBuYW1lOiBcImNvbnRyYWN0c1wiLFxuICBmaWxlbmFtZTogXCJyZW1vdGVFbnRyeS5qc1wiLFxuICBleHBvc2VzOiB7XG4gICAgXCIuL3JlbW90ZVwiOiBcIi4vc3JjL3JlbW90ZS50c3hcIlxuICB9LFxuICBzaGFyZWQ6IHtcbiAgICByZWFjdDogeyBzaW5nbGV0b246IHRydWUgfSxcbiAgICBcInJlYWN0LWRvbVwiOiB7IHNpbmdsZXRvbjogdHJ1ZSB9LFxuICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiOiB7IHNpbmdsZXRvbjogdHJ1ZSB9LFxuICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCI6IHsgc2luZ2xldG9uOiB0cnVlIH1cbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+IHtcbiAgY29uc3QgZW5hYmxlWmVwaHlyID0gcHJvY2Vzcy5lbnYuWkVQSFlSX0VOQUJMRSA9PT0gXCIxXCI7XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgZmVkZXJhdGlvbih7IC4uLm1mQ29uZmlnIH0pLFxuICAgICAgLi4uKGVuYWJsZVplcGh5ciA/IHdpdGhaZXBoeXIoKSA6IFtdKVxuICAgIF0sXG4gICAgc2VydmVyOiB7IHBvcnQ6IDUxNzcsIHN0cmljdFBvcnQ6IHRydWUgfSxcbiAgICBidWlsZDogeyB0YXJnZXQ6IFwiY2hyb21lODlcIiB9XG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVksU0FBUyxvQkFBb0I7QUFDcGEsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsa0JBQWdEO0FBRXpELElBQU0sV0FBb0M7QUFBQSxFQUN4QyxNQUFNO0FBQUEsRUFDTixVQUFVO0FBQUEsRUFDVixTQUFTO0FBQUEsSUFDUCxZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTyxFQUFFLFdBQVcsS0FBSztBQUFBLElBQ3pCLGFBQWEsRUFBRSxXQUFXLEtBQUs7QUFBQSxJQUMvQixvQkFBb0IsRUFBRSxXQUFXLEtBQUs7QUFBQSxJQUN0Qyx5QkFBeUIsRUFBRSxXQUFXLEtBQUs7QUFBQSxFQUM3QztBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDaEMsUUFBTSxlQUFlLFFBQVEsSUFBSSxrQkFBa0I7QUFFbkQsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sV0FBVyxFQUFFLEdBQUcsU0FBUyxDQUFDO0FBQUEsTUFDMUIsR0FBSSxlQUFlLFdBQVcsSUFBSSxDQUFDO0FBQUEsSUFDckM7QUFBQSxJQUNBLFFBQVEsRUFBRSxNQUFNLE1BQU0sWUFBWSxLQUFLO0FBQUEsSUFDdkMsT0FBTyxFQUFFLFFBQVEsV0FBVztBQUFBLEVBQzlCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
