import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";
import { RouterContextProvider } from "react-router";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets: [vercelPreset()],
  future: {
    v8_middleware: true,
  },
  getLoadContext() {
    // When middleware is enabled, getLoadContext must return a RouterContextProvider
    return new RouterContextProvider();
  },
} satisfies Config;
