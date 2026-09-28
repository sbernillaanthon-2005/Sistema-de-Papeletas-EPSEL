import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/Browser",
    timeout: 240000,
    expect: { timeout: 45000 },
    workers: 1,
    use: {
        baseURL: "http://localhost:8001",
        headless: true,
        channel: "chrome",
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
    },
});
