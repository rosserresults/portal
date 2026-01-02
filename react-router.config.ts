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
  getLoadContext(request: Request) {
    // When middleware is enabled, getLoadContext must return a RouterContextProvider
    // Accept request parameter in case Vercel preset passes it
    return new RouterContextProvider();
  },
} satisfies Config;
