import { config as loadDotenv } from "dotenv";
import { defineConfig } from "evalite/config";
import { defineConfig as defineViteConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Load .env.local so AI_PROVIDER, API keys, etc. are available to getModel().
// override: false ensures shell-exported vars (e.g. AI_MOCK=false) take precedence.
loadDotenv({ path: ".env.local", override: false });

export default defineConfig({
  testTimeout: 60000,
  maxConcurrency: 3,
  cache: true,
  viteConfig: defineViteConfig({
    plugins: [tsconfigPaths()],
  }),
});
