import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the same build works on the GitHub Pages project
  // subpath (username.github.io/mitten-maker/) and on a root custom
  // domain later, without needing to reconfigure.
  base: "./",
  plugins: [react(), tailwindcss()],
});
