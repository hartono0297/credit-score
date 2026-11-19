import { expect, test } from "@playwright/test";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);
const TINY_PDF = Buffer.from("%PDF-1.4\n%%EOF\n");

test.beforeEach(async ({ request }) => {
  const response = await request.post("/api/reset");
  expect(response.ok()).toBeTruthy();
});

test("header v2: label demo di header dan tombol utama hanya di queue", async ({ page }) => {
  const newLink = page.getByRole("link", { name: "Aplikasi Baru" });

  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("note")).toContainText(
    "Demo Mode: data simulasi",
  );
  await expect(newLink).toHaveAttribute("data-variant", "primary");

  for (const path of ["/new", "/application?id=APP-005"]) {
    await page.goto(path);
    await expect(newLink).toHaveAttribute("data-variant", "secondary");
  }
});

test("US-01 queue menampilkan lima seed dan ringkasan", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Queue aplikasi", level: 1 })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Demo Mode: data simulasi");

  const definitions = page.getByRole("definition");
  await expect(definitions).toHaveCount(3);
  await expect(definitions.nth(0)).toHaveText("5");
  await expect(definitions.nth(1)).toHaveText("1");
  await expect(definitions.nth(2)).toHaveText("1");

  const table = page.getByRole("table", { name: "Queue aplikasi kredit" });
  await expect(table.getByRole("row")).toHaveCount(6);

  const expectedRows: [string, string][] = [
    ["Andi Pratama", "1000"],
    ["Budi Santoso", "745"],
    ["Rina Kurniawati", "615"],
    ["Dewi Lestari", "525"],
    ["Joko Susilo", "215"],
  ];

  for (const [name, score] of expectedRows) {
    const row = table.getByRole("row", { name: new RegExp(name) });
    await expect(row).toContainText(score);
    await expect(row).toContainText("BNPL");
  }

  await expect(table).toContainText("Manual Review");
  await expect(table).toContainText("Approved");

  const andiRow = table.getByRole("row", { name: /Andi Pratama/ });
  await andiRow.getByRole("link", { name: "Buka aplikasi" }).click();
  await page.waitForURL(/\/application\?id=APP-001$/);
  await expect(page.getByRole("heading", { name: "Andi Pratama", level: 1 })).toBeVisible();
});

test("queue v2: baris mobile adalah link dan Draft tanpa skala", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const jokoRow = page.getByRole("link", { name: /Joko Susilo/ });
  await expect(jokoRow).toBeVisible();
  await expect(jokoRow).toHaveAttribute("href", "/application?id=APP-005");

  const created = await request.post("/api/applications", {
    data: { profileId: "C-01", plafon: 10000000, tenor: 12, dp: 0 },
  });
  expect(created.ok()).toBeTruthy();

  await page.reload();
  const draftRow = page.getByRole("listitem").filter({ hasText: "Draft" });
  await expect(draftRow).toHaveCount(1);
  await expect(draftRow).toContainText("Belum diskor");

  await request.post("/api/reset");
});

test("SC-02 guardrail C-05, validasi keputusan, log, dan perubahan keputusan", async ({
  page,
}) => {
  await page.goto("/application?id=APP-005");

  const summary = page.getByRole("region", { name: "Ringkasan" });
  await expect(page.getByRole("heading", { name: "Joko Susilo", level: 1 })).toBeVisible();
  await expect(summary.getByText("215", { exact: true })).toBeVisible();
  await expect(summary.getByText("E, Tinggi risiko", { exact: true })).toBeVisible();
  await expect(summary.getByText("Manual Review", { exact: true })).toBeVisible();

  const guardrail = page.getByRole("region", { name: "Manual Review diperlukan" });
  await expect(guardrail).toBeVisible();
  await expect(guardrail).toContainText("GR-01");
  await expect(guardrail).toContainText("GR-02");
  await expect(guardrail).toContainText("kolektibilitas 3 (ambang 3)");
  await expect(guardrail).toContainText("DTI 58,0% di atas 50%");

  const notesLabel = /^Catatan \(wajib karena guardrail aktif\)$/;
  await expect(page.getByLabel(notesLabel)).toBeVisible();
  await expect(page.getByText("Belum ada keputusan untuk aplikasi ini.")).toBeVisible();

  const reason = page.getByRole("combobox", { name: "Reason code", exact: true });
  const notes = page.getByLabel(notesLabel);

  await page.getByRole("radio", { name: /^Reject/ }).check();
  await notes.fill("Analyst memverifikasi tunggakan kolektibilitas 3.");
  await page.getByRole("button", { name: "Simpan Keputusan" }).click();

  await expect(page.getByText("Pilih reason code.", { exact: true })).toBeVisible();
  await expect(page.getByText("Belum ada keputusan untuk aplikasi ini.")).toBeVisible();

  await reason.selectOption("DELINQUENCY");
  await notes.fill("");
  await page.getByRole("button", { name: "Simpan Keputusan" }).click();
  await expect(
    page.getByText("Catatan wajib diisi saat guardrail aktif.", { exact: true }),
  ).toBeVisible();

  await notes.fill("Analyst memverifikasi tunggakan kolektibilitas 3.");
  await page.getByRole("button", { name: "Simpan Keputusan" }).click();

  await expect(page.getByText("Keputusan tersimpan.", { exact: true })).toBeVisible();
  await expect(summary.getByText("Rejected", { exact: true })).toBeVisible();

  const log = page.getByRole("region", { name: "Keputusan" }).getByRole("list");
  await expect(log.getByRole("listitem")).toHaveCount(1);
  await expect(log.getByRole("listitem").first()).toContainText("DELINQUENCY");
  await expect(log.getByRole("listitem").first()).toContainText(
    "Analyst memverifikasi tunggakan kolektibilitas 3.",
  );
  await expect(log.getByRole("listitem").first()).toContainText(
    "Guardrail aktif: GR-01, GR-02",
  );

  await page.getByRole("radio", { name: /^Approve/ }).check();
  await reason.selectOption("OTHER");
  await notes.fill("Ubah keputusan setelah review ulang.");
  await page.getByRole("button", { name: "Simpan Keputusan" }).click();

  await expect(page.getByText("Keputusan tersimpan.", { exact: true })).toBeVisible();
  await expect(summary.getByText("Approved", { exact: true })).toBeVisible();
  await expect(log.getByRole("listitem")).toHaveCount(2);
  await expect(log.getByRole("listitem").first()).toContainText("OTHER");
  await expect(log.getByRole("listitem").first()).toContainText(
    "Ubah keputusan setelah review ulang.",
  );
  await expect(log.getByRole("listitem").nth(1)).toContainText("DELINQUENCY");

  await expect(page.getByText("Koreksi dinonaktifkan setelah keputusan final.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ubah" })).toHaveCount(0);
});

test("SC-01 approve C-02 menambah log dan Reset Demo mengembalikan seed", async ({
  page,
}) => {
  await page.goto("/application?id=APP-002");

  const summary = page.getByRole("region", { name: "Ringkasan" });
  await expect(summary.getByText("745", { exact: true })).toBeVisible();
  await expect(summary.getByText("B, Baik", { exact: true })).toBeVisible();
  await expect(
    summary.getByText("Rekomendasi: Approve, plafon maks 80% pengajuan", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Belum ada keputusan untuk aplikasi ini.")).toBeVisible();

  await page.getByRole("radio", { name: /^Approve/ }).check();
  await page
    .getByRole("combobox", { name: "Reason code", exact: true })
    .selectOption("OTHER");
  await page.getByRole("button", { name: "Simpan Keputusan" }).click();

  await expect(page.getByText("Keputusan tersimpan.", { exact: true })).toBeVisible();
  await expect(summary.getByText("Approved", { exact: true })).toBeVisible();

  const log = page.getByRole("region", { name: "Keputusan" }).getByRole("list");
  await expect(log.getByRole("listitem")).toHaveCount(1);
  await expect(log.getByRole("listitem").first()).toContainText("OTHER");
  await expect(log.getByRole("listitem").first()).toContainText("Tidak ada guardrail aktif");

  await page.reload();
  await expect(summary.getByText("Approved", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Keputusan" }).getByRole("listitem"),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Reset Demo" }).click();
  await page.getByRole("button", { name: "Ya, reset demo" }).click();
  await page.waitForURL("/");

  await expect(page.getByRole("heading", { name: "Queue aplikasi", level: 1 })).toBeVisible();
  const table = page.getByRole("table", { name: "Queue aplikasi kredit" });
  await expect(table.getByRole("row", { name: /Budi Santoso/ })).toContainText("Scored");
  await expect(page.getByRole("definition").nth(0)).toHaveText("5");
});

test("US-02 validasi form dan ukuran file pada aplikasi baru", async ({ page }) => {
  await page.goto("/new");

  const extractButton = page.getByRole("button", { name: "Ekstrak Dokumen" });
  const ktpInput = page.getByLabel("KTP", { exact: true });

  await ktpInput.setInputFiles({
    name: "ktp-besar.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByText("Ukuran file maksimal 10 MB.", { exact: true })).toBeVisible();
  await expect(extractButton).toBeDisabled();

  await ktpInput.setInputFiles({
    name: "ktp-sintetis.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await page.getByLabel("Slip gaji", { exact: true }).setInputFiles({
    name: "slip-sintetis.pdf",
    mimeType: "application/pdf",
    buffer: TINY_PDF,
  });
  await page.getByLabel("Mutasi rekening", { exact: true }).setInputFiles({
    name: "mutasi-sintetis.pdf",
    mimeType: "application/pdf",
    buffer: TINY_PDF,
  });
  await expect(extractButton).toBeEnabled();

  await extractButton.click();
  await expect(page.getByText("Pilih profil demo.", { exact: true })).toBeVisible();
  await expect(page.getByText("Masukkan angka plafon.", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Pilih tenor 3, 6, 12, 18, atau 24 bulan.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Masukkan angka DP.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Profil demo")).toBeFocused();

  await page.getByLabel("Profil demo").selectOption("C-01");
  await page.getByLabel("Tenor").selectOption("12");
  await page.getByLabel("DP (Rupiah)").fill("0");

  for (const plafon of ["4000000", "60000000"]) {
    await page.getByLabel("Plafon (Rupiah)").fill(plafon);
    await extractButton.click();
    await expect(
      page.getByText("Plafon harus antara Rp 5.000.000 dan Rp 50.000.000.", { exact: true }),
    ).toBeVisible();
  }
});

test("SC-03 koreksi THP pada alur aplikasi baru dan skor dihitung ulang", async ({
  page,
  request,
}) => {
  await page.goto("/new");

  await expect(page.getByRole("heading", { name: "Aplikasi baru", level: 1 })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Demo Mode: data simulasi");

  const profileSelect = page.getByLabel("Profil demo");
  await expect(profileSelect).toBeEnabled();
  await profileSelect.selectOption("C-03");
  await expect(page.getByText(/PT Sinar Digital/)).toBeVisible();

  await page.getByLabel("Plafon (Rupiah)").fill("15000000");
  await expect(page.getByLabel("Plafon (Rupiah)")).toHaveValue("15.000.000");
  await page.getByLabel("Tenor").selectOption("12");
  await page.getByLabel("DP (Rupiah)").fill("1500000");
  await expect(page.getByLabel("DP (Rupiah)")).toHaveValue("1.500.000");
  await page.getByLabel("Tujuan (opsional)").fill("Renovasi rumah");

  const extractButton = page.getByRole("button", { name: "Ekstrak Dokumen" });
  await expect(extractButton).toBeDisabled();

  const ktpInput = page.getByLabel("KTP", { exact: true });
  await ktpInput.setInputFiles({
    name: "ktp-salah.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bukan dokumen"),
  });
  await expect(
    page.getByText("Format file harus JPG, PNG, atau PDF.", { exact: true }),
  ).toBeVisible();
  await expect(extractButton).toBeDisabled();

  await ktpInput.setInputFiles({
    name: "ktp-sintetis.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await page.getByLabel("Slip gaji", { exact: true }).setInputFiles({
    name: "slip-sintetis.pdf",
    mimeType: "application/pdf",
    buffer: TINY_PDF,
  });
  await page.getByLabel("Mutasi rekening", { exact: true }).setInputFiles({
    name: "mutasi-sintetis.pdf",
    mimeType: "application/pdf",
    buffer: TINY_PDF,
  });
  await expect(extractButton).toBeEnabled();

  const extractionStarted = Date.now();
  await extractButton.click();
  await expect(page.getByRole("heading", { name: "Hasil ekstraksi" })).toBeVisible({
    timeout: 15_000,
  });
  const extractionMs = Date.now() - extractionStarted;
  expect(extractionMs).toBeGreaterThanOrEqual(1300);
  expect(extractionMs).toBeLessThan(10_000);

  await expect(page.getByText("78%", { exact: true })).toBeVisible();
  await expect(page.getByText("Perlu verifikasi", { exact: true })).toBeVisible();

  const slipSection = page.getByRole("region", { name: "Slip gaji", exact: true });
  await slipSection.getByRole("button", { name: "Ubah" }).click();
  await page.getByLabel("Nilai baru untuk THP (Rupiah)").fill("12000000");
  await expect(page.getByLabel("Nilai baru untuk THP (Rupiah)")).toHaveValue("12.000.000");
  await slipSection.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(slipSection.getByText("Koreksi belum disimpan")).toBeVisible();
  await expect(slipSection.getByText("Rp 12.000.000", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Hitung Skor" }).click();
  await page.waitForURL(/\/application\?id=APP-006$/);

  await expect(page.getByRole("heading", { name: "Rina Kurniawati", level: 1 })).toBeVisible();
  const summary = page.getByRole("region", { name: "Ringkasan" });
  await expect(summary.getByText("720", { exact: true })).toBeVisible();
  await expect(summary.getByText("B, Baik", { exact: true })).toBeVisible();
  await expect(summary.getByText("Scored", { exact: true })).toBeVisible();
  const detailSlip = page.getByRole("region", { name: "Slip gaji", exact: true });
  await expect(detailSlip.getByText("Hasil koreksi analyst")).toBeVisible();
  await expect(detailSlip.getByText("Rp 12.000.000", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Manual Review diperlukan" })).toHaveCount(0);

  const detailResponse = await request.get("/api/applications/APP-006");
  expect(detailResponse.ok()).toBeTruthy();
  const detail = await detailResponse.json();
  const documents = detail.application.documents as Array<Record<string, unknown>>;

  expect(documents.map((document) => document.fileName)).toEqual([
    "ktp-sintetis.png",
    "slip-sintetis.pdf",
    "mutasi-sintetis.pdf",
  ]);
  for (const document of documents) {
    expect(Object.keys(document).sort()).toEqual(["fileName", "type"]);
  }
});

test("SC-04 aplikasi baru C-01 menghasilkan skor 1000 dan keputusan tersimpan", async ({
  page,
}) => {
  await page.goto("/new");

  await page.getByLabel("Profil demo").selectOption("C-01");
  await page.getByLabel("Plafon (Rupiah)").fill("20000000");
  await page.getByLabel("Tenor").selectOption("12");
  await page.getByLabel("DP (Rupiah)").fill("2000000");
  await page.getByLabel("KTP", { exact: true }).setInputFiles({
    name: "ktp-c01.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await page.getByLabel("Slip gaji", { exact: true }).setInputFiles({
    name: "slip-c01.pdf",
    mimeType: "application/pdf",
    buffer: TINY_PDF,
  });
  await page.getByLabel("Mutasi rekening", { exact: true }).setInputFiles({
    name: "mutasi-c01.pdf",
    mimeType: "application/pdf",
    buffer: TINY_PDF,
  });

  await page.getByRole("button", { name: "Ekstrak Dokumen" }).click();
  await expect(page.getByRole("heading", { name: "Hasil ekstraksi" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Hitung Skor" }).click();
  await page.waitForURL(/\/application\?id=APP-006$/);

  await expect(page.getByRole("heading", { name: "Andi Pratama", level: 1 })).toBeVisible();
  const summary = page.getByRole("region", { name: "Ringkasan" });
  await expect(summary.getByText("1000", { exact: true })).toBeVisible();
  await expect(summary.getByText("A, Sangat baik", { exact: true })).toBeVisible();
  await expect(summary.getByText("Scored", { exact: true })).toBeVisible();
  await expect(
    summary.getByText("Rekomendasi: Approve, plafon sesuai pengajuan", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Manual Review diperlukan" })).toHaveCount(0);

  await expect(page.getByText("menaikkan skor", { exact: true })).toHaveCount(5);
  await expect(page.getByText("Rasio DTI", { exact: true })).toBeVisible();
  await expect(page.getByText("Kolektibilitas SLIK", { exact: true })).toBeVisible();
  await expect(page.getByText("+120", { exact: true })).toBeVisible();

  await page.getByRole("radio", { name: /^Approve/ }).check();
  await page
    .getByRole("combobox", { name: "Reason code", exact: true })
    .selectOption("OTHER");
  await page.getByRole("button", { name: "Simpan Keputusan" }).click();

  await expect(page.getByText("Keputusan tersimpan.", { exact: true })).toBeVisible();
  await expect(summary.getByText("Approved", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Keputusan" }).getByRole("listitem"),
  ).toHaveCount(1);
});

test("ID tidak ditemukan dan ID tidak valid menampilkan empty state", async ({ page }) => {
  await page.goto("/application?id=APP-999");

  await expect(page.getByRole("heading", { name: "Detail aplikasi", level: 1 })).toBeVisible();
  await expect(page.getByText("Aplikasi tidak ditemukan.", { exact: true })).toBeVisible();

  const backLink = page.getByRole("link", { name: "Kembali ke queue" });
  await expect(backLink).toHaveAttribute("href", "/");
  await backLink.click();
  await expect(page.getByRole("heading", { name: "Queue aplikasi", level: 1 })).toBeVisible();

  await page.goto("/application?id=TIDAK-ADA");
  await expect(page.getByText("ID aplikasi tidak valid.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kembali ke queue" })).toBeVisible();
});

test("tidak ada horizontal scroll pada 390, 768, dan 1440 piksel", async ({ page }) => {
  const pages = [
    { path: "/", heading: "Queue aplikasi" },
    { path: "/application?id=APP-004", heading: "Dewi Lestari" },
    { path: "/application?id=APP-005", heading: "Joko Susilo" },
    { path: "/new", heading: "Aplikasi baru" },
  ];

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });

    for (const { path, heading } of pages) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(
        metrics.scrollWidth,
        `${path} pada ${width}px memiliki overflow horizontal`,
      ).toBeLessThanOrEqual(metrics.innerWidth);
    }
  }
});

test("halaman utama tanpa error console dan tanpa request eksternal", async ({ page }) => {
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    const http = url.protocol === "http:" || url.protocol === "https:";
    if (http && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Queue aplikasi", level: 1 })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Demo Mode: data simulasi");

  await page.goto("/application?id=APP-005");
  await expect(page.getByRole("heading", { name: "Joko Susilo", level: 1 })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Demo Mode: data simulasi");

  await page.goto("/new");
  await expect(page.getByLabel("Profil demo")).toBeEnabled();
  await expect(page.getByRole("note")).toContainText("Demo Mode: data simulasi");

  await page.waitForTimeout(500);
  expect(externalRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("waktu muat queue setelah pemanasan di bawah 3 detik", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Total aplikasi")).toBeVisible();

  const started = Date.now();
  await page.goto("/");
  await expect(page.getByText("Total aplikasi")).toBeVisible();
  const elapsed = Date.now() - started;

  expect(elapsed).toBeLessThan(3000);
});

test("header keamanan dan validasi input API", async ({ request }) => {
  const pageResponse = await request.get("/");
  expect(pageResponse.ok()).toBeTruthy();

  const headers = pageResponse.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");

  const apiResponse = await request.get("/api/applications");
  expect(apiResponse.ok()).toBeTruthy();
  expect(apiResponse.headers()["x-content-type-options"]).toBe("nosniff");

  const invalidApplication = await request.post("/api/applications", {
    data: {
      profileId: "C-99",
      plafon: 4_000_000,
      tenor: 7,
      dp: -1,
    },
  });
  expect(invalidApplication.status()).toBe(400);

  const invalidBody = await invalidApplication.json();
  expect(invalidBody.errors.profileId).toBeTruthy();
  expect(invalidBody.errors.plafon).toBeTruthy();
  expect(invalidBody.errors.tenor).toBeTruthy();
  expect(invalidBody.errors.dp).toBeTruthy();

  const missingDecisionReason = await request.post("/api/applications/APP-002/decision", {
    data: { decision: "Approved" },
  });
  expect(missingDecisionReason.status()).toBe(400);
  expect((await missingDecisionReason.json()).errors.reasonCode).toBeTruthy();

  const guardedDecisionWithoutNotes = await request.post(
    "/api/applications/APP-005/decision",
    { data: { decision: "Rejected", reasonCode: "DELINQUENCY" } },
  );
  expect(guardedDecisionWithoutNotes.status()).toBe(400);
  expect((await guardedDecisionWithoutNotes.json()).errors.notes).toBeTruthy();

  const missingApplication = await request.get("/api/applications/APP-999");
  expect(missingApplication.status()).toBe(404);

  const traversal = await request.get("/api/applications/..%2F..%2Fpackage.json");
  expect(traversal.ok()).toBeFalsy();
  expect(await traversal.text()).not.toContain("\"next\"");
});
