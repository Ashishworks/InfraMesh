// @lovable.dev/vite-tanstack-config already includes the necessary plugins.
// We are removing the custom server entry so TanStack Start falls back to 
// its default server, which is perfectly compatible with Vercel out of the box.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // If you ever need to add specific Vercel configurations later, 
  // you can do it here, but defaults work great!
});