import { test, expect, Browser, Page } from "@playwright/test";

async function login(browser: Browser, role: string) {
    const context = await browser.newContext({
        baseURL: "http://localhost:8001",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await page.locator("#email").fill(`${role}@browser.test`);
    await page.locator("#password").fill("Browser-test-only-2026!");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(
        page.getByRole("link", { name: "Bandeja", exact: true }),
    ).toBeVisible();
    return { page, context, errors };
}

test("requester, head and HR approve with live private notifications and PDF", async ({
    browser,
}) => {
    const owner = await login(browser, "practitioner");
    const head = await login(browser, "area_head");
    const hr = await login(browser, "hr");
    const liveMessages: string[] = [];
    head.page.on("websocket", (socket) =>
        socket.on("framereceived", (event) =>
            liveMessages.push(String(event.payload)),
        ),
    );
    await head.page.reload();
    await expect
        .poll(() =>
            liveMessages.some((m) => m.includes("subscription_succeeded")),
        )
        .toBe(true);
    await owner.page.getByRole("link", { name: "Nueva papeleta" }).click();
    await owner.page
        .getByLabel("Detalle del motivo")
        .fill("Verificación completa desde navegador");
    await owner.page.getByRole("button", { name: "Guardar y revisar" }).click();
    await expect(
        owner.page.getByRole("button", { name: "Firmar y enviar al jefe" }),
    ).toBeVisible();
    const path = new URL(owner.page.url()).pathname;
    await owner.page
        .getByRole("button", { name: "Firmar y enviar al jefe" })
        .click();
    await expect(owner.page.getByRole("heading", { level: 1 })).toContainText(
        "Enviada",
    );
    await expect
        .poll(
            () => liveMessages.some((m) => m.includes("notification.created")),
            { timeout: 15000 },
        )
        .toBe(true);
    await expect(
        head.page.getByRole("button", { name: /Notificaciones: [1-9]/ }),
    ).toBeVisible();
    await head.page.goto(path);
    await head.page.getByRole("button", { name: "Aprobar y sellar" }).click();
    await expect(head.page.getByRole("heading", { level: 1 })).toContainText(
        "Aprobada por Área",
    );
    await hr.page.goto(path);
    await hr.page.getByRole("button", { name: "Aprobar y sellar" }).click();
    await expect(hr.page.getByRole("heading", { level: 1 })).toContainText(
        "Aprobada por RRHH",
    );
    await expect(owner.page.getByRole("heading", { level: 1 })).toContainText(
        "Aprobada por RRHH",
    );
    const pdf = await owner.context.request.get(`${path}/pdf`);
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
    await owner.page.setViewportSize({ width: 390, height: 844 });
    await owner.page.getByRole("button", { name: /Notificaciones:/ }).click();
    await expect(
        owner.page.getByRole("region", { name: "Notificaciones" }),
    ).toBeVisible();
    await owner.page
        .getByRole("button", { name: "Marcar todas como leídas" })
        .click();
    await expect(
        owner.page.getByRole("button", {
            name: "Notificaciones: 0 sin leer",
            exact: true,
        }),
    ).toBeVisible();
    expect([...owner.errors, ...head.errors, ...hr.errors]).toEqual([]);
    await owner.context.close();
    await head.context.close();
    await hr.context.close();
});

test("admin and security dashboards load without browser errors", async ({
    browser,
}) => {
    for (const role of ["admin", "security"]) {
        const session = await login(browser, role);
        await expect(session.page.locator("h1")).toBeVisible();
        expect(session.errors).toEqual([]);
        await session.context.close();
    }
});
