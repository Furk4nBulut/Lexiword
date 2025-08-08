// vite.config.ts
import { resolve } from "path";
import react from "file:///home/furkanblt/WebstormProjects/glyf/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///home/furkanblt/WebstormProjects/glyf/node_modules/vite/dist/node/index.js";
import dts from "file:///home/furkanblt/WebstormProjects/glyf/node_modules/vite-plugin-dts/dist/index.mjs";
import tsConfigPaths from "file:///home/furkanblt/WebstormProjects/glyf/node_modules/vite-tsconfig-paths/dist/index.mjs";
import cssInjectedByJsPlugin from "file:///home/furkanblt/WebstormProjects/glyf/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";

// package.json
var peerDependencies = {
  "@lexical/list": "^0.8.0",
  "@lexical/react": "^0.8.0",
  "@lexical/selection": "^0.8.0",
  lexical: "^0.8.0",
  react: ">=18.x",
  "react-dom": ">=18.x"
};

// vite.config.ts
var vite_config_default = defineConfig((configEnv) => ({
  plugins: [
    dts({
      include: ["src/components/"]
    }),
    react(),
    tsConfigPaths(),
    cssInjectedByJsPlugin()
  ],
  build: {
    lib: {
      entry: resolve("src", "components/index.ts"),
      name: "Glyf",
      formats: ["es", "umd"],
      fileName: (format) => `glyf.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(peerDependencies)]
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9mdXJrYW5ibHQvV2Vic3Rvcm1Qcm9qZWN0cy9nbHlmXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9mdXJrYW5ibHQvV2Vic3Rvcm1Qcm9qZWN0cy9nbHlmL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL2Z1cmthbmJsdC9XZWJzdG9ybVByb2plY3RzL2dseWYvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcblxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJ1xuaW1wb3J0IHRzQ29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocydcbmltcG9ydCBjc3NJbmplY3RlZEJ5SnNQbHVnaW4gZnJvbSAndml0ZS1wbHVnaW4tY3NzLWluamVjdGVkLWJ5LWpzJ1xuaW1wb3J0ICogYXMgcGFja2FnZUpzb24gZnJvbSAnLi9wYWNrYWdlLmpzb24nXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKGNvbmZpZ0VudikgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICAgIGluY2x1ZGU6IFsnc3JjL2NvbXBvbmVudHMvJ10sXG4gICAgfSksXG4gICAgcmVhY3QoKSxcbiAgICB0c0NvbmZpZ1BhdGhzKCksXG4gICAgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luKClcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKCdzcmMnLCAnY29tcG9uZW50cy9pbmRleC50cycpLFxuICAgICAgbmFtZTogJ0dseWYnLFxuICAgICAgZm9ybWF0czogWydlcycsICd1bWQnXSxcbiAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiBgZ2x5Zi4ke2Zvcm1hdH0uanNgLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFsuLi5PYmplY3Qua2V5cyhwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzKV0sXG4gICAgfSxcbiAgfSxcbn0pKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpUyxTQUFTLGVBQWU7QUFFelQsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLG1CQUFtQjtBQUMxQixPQUFPLDJCQUEyQjs7Ozs7Ozs7Ozs7OztBQUlsQyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxlQUFlO0FBQUEsRUFDMUMsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0EsU0FBUyxDQUFDLGlCQUFpQjtBQUFBLElBQy9CLENBQUM7QUFBQSxJQUNELE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsT0FBTyxxQkFBcUI7QUFBQSxNQUMzQyxNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsTUFDckIsVUFBVSxDQUFDLFdBQVcsUUFBUTtBQUFBLElBQ2hDO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsR0FBRyxPQUFPLEtBQWlCLGdCQUFnQixDQUFDO0FBQUEsSUFDekQ7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
