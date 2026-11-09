const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, expect } = require("playwright/test");
const { fixtureContext, user, questions } = require("./frontend-fixtures.cjs");

const BASE = process.env.FRONTEND_BASE_URL || "http://127.0.0.1:3000";
const screenshots = path.join(__dirname, "../docs/screenshots");
const routes = [
  ["home", "/"],
  ["planner", "/planner"],
  ["vault", "/vault"],
  ["simulator", "/simulator"],
  ["interview", "/interview"],
  ["ec-rater", "/ec-rater"],
  ["analytics", "/analytics"],
  ["login", "/login"],
];
const answer =
  "I helped our team organize a difficult project by listening to everyone, splitting up the work and checking our progress. We finished on time and learned to ask for help earlier.";
let browser;
const visualResults = [];
before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  fs.mkdirSync(screenshots, { recursive: true });
});
after(async () => {
  await browser.close();
});
async function fixture(run, options) {
  const data = await fixtureContext(browser, options);
  try {
    await run(data);
    assert.deepEqual(
      data.state.pageErrors,
      [],
      `No uncaught browser errors: ${JSON.stringify(data.state.pageErrorDetails)}`,
    );
    assert.deepEqual(
      data.state.blockedExternal,
      [],
      "No unexpected external destinations",
    );
  } finally {
    await data.context.close();
  }
}
async function go(page, route) {
  const response = await page.goto(BASE + route, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
}
async function shot(page, name) {
  // Smooth scrolling is not a CSS animation; wait for the intended viewport.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let previous = scrollY;
        let stable = 0;
        function frame() {
          stable = Math.abs(previous - scrollY) < 0.5 ? stable + 1 : 0;
          previous = scrollY;
          if (stable >= 6) resolve();
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
  );
  // Hide the development server's own indicator; this isn't product UI.
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  });
  await page.screenshot({
    path: path.join(screenshots, `${name}.png`),
    animations: "disabled",
  });
}
async function addProgram(page, index = 1) {
  const choice = page.locator("#planner-program");
  const options = await choice
    .locator("option")
    .evaluateAll((items) => items.map((item) => item.value).filter(Boolean));
  await choice.selectOption(options[index - 1]);
  await page.getByRole("button", { name: "Add program", exact: true }).click();
}
async function beginWritten(page) {
  await page.locator("#sim-type").selectOption("written");
  await page
    .getByRole("button", { name: "Start timed simulation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip prep / start now", exact: true })
    .click();
}

test("sign-in, sign-up, password reset, sign-out and protected routes retain their contracts", async () => {
  await fixture(
    async ({ page, state }) => {
      await go(page, "/login");
      await expect(page.getByLabel("Email address")).toBeVisible();
      await shot(page, "login-form-desktop");
      await page.setViewportSize({ width: 390, height: 844 });
      await shot(page, "login-form-mobile");
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const route of [
        "/simulator",
        "/interview",
        "/ec-rater",
        "/analytics",
      ]) {
        await go(page, route);
        await expect(
          page.getByRole("button", { name: "Sign up or sign in", exact: true }),
        ).toBeVisible();
      }
      assert.equal(
        state.requests.filter((request) => request.path.startsWith("/api/"))
          .length,
        0,
      );
      const trigger = page.getByRole("button", { name: /^Sign in$/ }).first();
      await trigger.click();
      let dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await shot(page, "auth-dialog-desktop");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "Forgot password?" }).click();
      await expect(dialog.getByRole("alert")).toContainText("Enter your email");
      await dialog.getByLabel("Email address").fill("jordan@example.test");
      await dialog.getByRole("button", { name: "Forgot password?" }).click();
      await expect(dialog.getByRole("status")).toContainText("reset link");
      await dialog.getByRole("tab", { name: "Create account" }).click();
      await dialog
        .getByLabel("Password", { exact: true })
        .fill("fixture-password");
      await dialog
        .locator("form")
        .getByRole("button", { name: "Create account", exact: true })
        .click();
      await expect(dialog.getByRole("status")).toContainText(
        "check your inbox",
      );
      await dialog.getByRole("tab", { name: "Sign in", exact: true }).click();
      state.authStatus = 400;
      await dialog
        .locator("form")
        .getByRole("button", { name: "Sign in", exact: true })
        .click();
      await expect(dialog.getByRole("alert")).toContainText(
        "Invalid login credentials",
      );
      state.authStatus = 200;
      await dialog
        .locator("form")
        .getByRole("button", { name: "Sign in", exact: true })
        .click();
      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Ask Nova for a breakdown" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Sign out", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("button", { name: "Sign up or sign in", exact: true }),
      ).toBeVisible();
      for (const endpoint of ["/recover", "/signup", "/token", "/logout"])
        assert.ok(
          state.requests.some((request) => request.path.endsWith(endpoint)),
          endpoint,
        );
    },
    { signedIn: false },
  );
});

test("planner additions, removals, average and checklist persist across reloads", async () => {
  await fixture(async ({ page }) => {
    await go(page, "/planner");
    await addProgram(page, 1);
    await addProgram(page, 2);
    const average = page.getByRole("slider", {
      name: "Current admission average",
    });
    await average.focus();
    await average.press("End");
    for (let index = 0; index < 8; index++) await average.press("ArrowLeft");
    const task = page.getByRole("button", {
      name: "Confirm each program and campus on OUAC",
      exact: true,
    });
    await task.click();
    await expect(task).toHaveAttribute("aria-pressed", "true");
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("accepted-application-planner-v1")),
    );
    assert.equal(stored.average, 92);
    assert.equal(stored.selected.length, 2);
    assert.equal(stored.completed.length, 1);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("slider")).toHaveValue("92");
    await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(2);
    await expect(task).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: /^Remove / })
      .first()
      .click();
    await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(1);
    const tab = page.getByRole("tab", { name: "My plan" });
    await tab.focus();
    await tab.press("ArrowRight");
    await expect(
      page.getByRole("tab", { name: "Historical averages" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { name: "An honest look back." }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Average/ }).click();
    await expect(page.locator("th[aria-sort]")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await page
      .getByRole("searchbox", { name: "Search programs and universities" })
      .fill("a-program-that-does-not-exist");
    await expect(
      page.getByText("No programs match", { exact: false }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByLabel("Filter by university").selectOption({ index: 1 });
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await shot(page, "history-desktop");
  });
});

test("program search, university and requirement filters lead to the matching practice program", async () => {
  await fixture(async ({ page }) => {
    await go(page, "/vault");
    await page.getByRole("searchbox").fill("Waterloo");
    await page.getByLabel("Filter by requirement").selectOption("profile");
    await expect(page.locator("tbody tr").first()).toContainText("Waterloo");
    await page.getByRole("searchbox").fill("a-program-that-does-not-exist");
    await expect(
      page.getByRole("heading", {
        name: "No programs match these filters.",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByRole("button", { name: "Waterloo", exact: true }).click();
    const link = page.locator('table a[href^="/simulator"]').first();
    const code = new URL(
      await link.getAttribute("href"),
      BASE,
    ).searchParams.get("program");
    await link.click();
    await expect(page.locator("#sim-program")).toHaveValue(code);
  });
});

test("written practice preserves preparation/response timers, validation, payload, loading and feedback", async () => {
  await fixture(async ({ page, state }) => {
    await page.clock.install();
    await go(page, "/simulator?program=queens_comm");
    await page.getByRole("button", { name: "Start timed simulation" }).click();
    await expect(page.getByRole("timer")).toHaveText("01:00");
    await expect(page.locator("#sim-program")).toBeDisabled();
    await page.clock.runFor(60000);
    await expect(page.getByRole("timer")).toHaveText("10:00");
    await page.getByRole("button", { name: "Finish & submit" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "at least a sentence",
    );
    await page
      .getByLabel("Your response", { exact: true })
      .fill("word ".repeat(501));
    await page.getByRole("button", { name: "Finish & submit" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "500 words and 4,000 characters or fewer",
    );
    assert.equal(
      state.requests.filter((request) => request.path === "/api/jobs").length,
      0,
    );
    await page
      .getByLabel("Your response", { exact: true })
      .fill("a".repeat(4001));
    await page.getByRole("button", { name: "Finish & submit" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "4,000 characters",
    );
    assert.equal(
      state.requests.filter((request) => request.path === "/api/jobs").length,
      0,
    );
    await page.getByLabel("Your response", { exact: true }).fill(answer);
    let release;
    state.jobsHold = new Promise((resolve) => {
      release = resolve;
    });
    await page.getByRole("button", { name: "Finish & submit" }).click();
    await expect(page.getByRole("status")).toContainText("Nova is reading");
    release();
    await expect(
      page.getByRole("heading", { name: "A model rewrite" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Practice score 84 out of 100" }),
    ).toBeVisible();
    await expect(
      page.getByText("3 of 10 free evaluations used today."),
    ).toBeVisible();
    const submission = state.requests.find(
      (request) => request.path === "/api/jobs",
    );
    assert.equal(submission.authorization, true);
    assert.equal(submission.body.answer, answer);
    assert.equal(submission.body.programCode, "queens_comm");
    assert.equal(submission.body.format, "written");
    assert.deepEqual(
      Object.keys(submission.body).sort(),
      [
        "question",
        "answer",
        "program",
        "university",
        "programCode",
        "format",
      ].sort(),
    );
    await shot(page, "simulator-feedback-desktop");
  });
});

test("video practice keeps 30s preparation and 2-minute response without recording or scoring", async () => {
  await fixture(async ({ page, state }) => {
    await page.clock.install();
    await go(page, "/simulator");
    await page.locator("#sim-type").selectOption("video");
    await page.getByRole("button", { name: "Start timed simulation" }).click();
    await expect(page.getByRole("timer")).toHaveText("00:30");
    await page.clock.runFor(30000);
    await expect(page.getByRole("timer")).toHaveText("02:00");
    await page.clock.runFor(120000);
    await expect(
      page.getByRole("heading", { name: "One more practice, in the books." }),
    ).toBeVisible();
    assert.equal(
      state.requests.filter((request) => request.path === "/api/jobs").length,
      0,
    );
  });
});

test("practice draft restoration, recovery polling and quota errors remain usable", async () => {
  await fixture(async ({ page, context, state }) => {
    await context.addInitScript(
      ({ id, answer }) => {
        if (location.hostname !== "127.0.0.1") return;
        if (!localStorage.getItem("accepted-simulator-draft:" + id))
          localStorage.setItem(
            "accepted-simulator-draft:" + id,
            JSON.stringify({
              programCode: "queens_comm",
              format: "written",
              phase: "response",
              timeLeft: 1,
              prompt: "A representative practice question.",
              answer,
              feedback: null,
              jobId: null,
            }),
          );
      },
      { id: user.id, answer },
    );
    state.jobsStatus = 429;
    await page.clock.install();
    await go(page, "/simulator");
    await expect(page.getByLabel("Your response", { exact: true })).toHaveValue(
      answer,
    );
    await page.clock.runFor(5000);
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "10 free evaluations",
    );
    assert.equal(
      state.requests.filter((request) => request.path === "/api/jobs").length,
      1,
      "Expired practice must not repeatedly resubmit a quota-blocked answer",
    );
    await page.evaluate(
      ({ id, answer }) =>
        localStorage.setItem(
          "accepted-simulator-draft:" + id,
          JSON.stringify({
            programCode: "queens_comm",
            format: "written",
            phase: "waiting",
            timeLeft: 0,
            prompt: "A representative practice question.",
            answer,
            feedback: null,
            jobId: "recovery-job",
          }),
        ),
      { id: user.id, answer },
    );
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: "A model rewrite" }),
    ).toBeVisible();
    assert.ok(
      state.requests.some(
        (request) => request.path === "/api/jobs/recovery-job",
      ),
    );
  });
});

test("interview typed fallback, progression and structured review preserve transcript-only submission", async () => {
  await fixture(async ({ page, state }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "SpeechRecognition", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        value: undefined,
        configurable: true,
      });
    });
    await go(page, "/interview");
    await page.getByRole("button", { name: "Start mock interview" }).click();
    await page.getByRole("button", { name: "Answer by voice" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "type your answer",
    );
    await page.getByRole("button", { name: "Next question" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "complete response",
    );
    for (let index = 0; index < 3; index++) {
      await expect(
        page.getByRole("heading", { name: questions[index], exact: true }),
      ).toBeVisible();
      await page.locator("#interview-answer").fill(answer);
      await page
        .getByRole("button", {
          name: index === 2 ? "Finish and review" : "Next question",
          exact: true,
        })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: "Your interview, with perspective." }),
    ).toBeVisible();
    await page
      .getByText("Read your interview transcript", { exact: true })
      .click();
    const request = state.requests.find(
      (request) =>
        request.path === "/api/interview" && request.body.action === "analyze",
    );
    assert.equal(request.authorization, true);
    assert.equal(request.body.answers.length, 3);
    assert.ok(
      request.body.answers.every((item) => typeof item.answer === "string"),
    );
    await shot(page, "interview-feedback-desktop");
  });
});

test("microphone permission is explicit; listening, stop and permission-denied states retain typed input", async () => {
  await fixture(async ({ page }) => {
    await page.addInitScript(() => {
      window.__micRequests = 0;
      window.__micStops = 0;
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          window.__micRequests++;
          return { getTracks: () => [{ stop: () => window.__micStops++ }] };
        },
      });
      window.SpeechRecognition = class {
        start() {
          setTimeout(
            () =>
              this.onresult?.({
                resultIndex: 0,
                results: [
                  {
                    isFinal: true,
                    0: {
                      transcript:
                        "I helped our team make progress by making space for everyone to contribute.",
                    },
                  },
                ],
              }),
            10,
          );
        }
        stop() {
          this.onend?.();
        }
      };
    });
    await go(page, "/interview");
    await page.getByRole("button", { name: "Start mock interview" }).click();
    assert.equal(await page.evaluate(() => window.__micRequests), 0);
    await page.getByRole("button", { name: "Answer by voice" }).click();
    await expect(
      page.getByRole("button", { name: "Stop speaking" }),
    ).toBeVisible();
    await expect(page.locator("#interview-answer")).toHaveValue(
      /helped our team/,
    );
    await page.getByRole("button", { name: "Stop speaking" }).click();
    assert.equal(await page.evaluate(() => window.__micRequests), 1);
    assert.ok((await page.evaluate(() => window.__micStops)) > 0);
    await page.evaluate(() =>
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        value: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      }),
    );
    await page.getByRole("button", { name: "Answer by voice" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Microphone access was blocked",
    );
    await expect(page.locator("#interview-answer")).toBeEditable();
  });
});

test("EC activity limits, validation, drafts, evaluation and planner integration are preserved", async () => {
  await fixture(async ({ page, state }) => {
    await go(page, "/ec-rater");
    await page.getByRole("button", { name: "Rank my ECs" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Give every activity a name",
    );
    for (let index = 1; index < 8; index++)
      await page
        .getByRole("button", { name: "Add activity", exact: true })
        .click();
    await expect(
      page.getByRole("button", { name: "Add activity", exact: true }),
    ).toBeDisabled();
    await expect(page.locator("fieldset")).toHaveCount(8);
    for (let index = 8; index > 2; index--)
      await page
        .getByRole("button", { name: `Remove activity ${index}`, exact: true })
        .click();
    await page
      .getByLabel("Activity name", { exact: true })
      .nth(0)
      .fill("Robotics team");
    await page
      .getByLabel("Activity name", { exact: true })
      .nth(1)
      .fill("Community tutoring");
    await page
      .getByLabel("Your role", { exact: true })
      .first()
      .fill("Team captain");
    await page
      .getByLabel("Hours per week", { exact: true })
      .first()
      .fill("12abc");
    await expect(
      page.getByLabel("Hours per week", { exact: true }).first(),
    ).toHaveValue("12");
    await page
      .getByLabel("What you did and what changed", { exact: true })
      .first()
      .fill(answer);
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByLabel("Activity name", { exact: true }).first(),
    ).toHaveValue("Robotics team");
    await page.getByRole("button", { name: "Rank my ECs" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Your activity portfolio",
        exact: true,
      }),
    ).toBeVisible();
    const request = state.requests.find(
      (request) => request.path === "/api/ec",
    );
    assert.equal(request.authorization, true);
    assert.equal(request.body.ecs.length, 2);
    assert.equal(request.body.ecs[0].hours, 12);
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("accepted-ec-result-v1")).level,
      ),
      "strong",
    );
    await shot(page, "ec-feedback-desktop");
    await go(page, "/planner");
    await addProgram(page, 1);
    await expect(
      page.getByText("Yours rate strong", { exact: false }).first(),
    ).toBeVisible();
    await go(page, "/vault");
    await expect(
      page.getByText("Yours rate strong", { exact: false }).first(),
    ).toBeVisible();
  });
});

test("analytics loads history, opens responses, handles summary limits, and confirms deletion", async () => {
  await fixture(async ({ page, state }) => {
    state.analyticsStatus = 503;
    await go(page, "/analytics");
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Could not load your history",
    );
    state.analyticsStatus = 200;
    await page.getByRole("button", { name: "Try loading again" }).click();
    await expect(
      page.getByRole("button", { name: "Ask Nova for a breakdown" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /^Review response:/ })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    state.summaryStatus = 429;
    await page
      .getByRole("button", { name: "Ask Nova for a breakdown" })
      .click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "summary limit",
    );
    state.summaryStatus = 200;
    await page
      .getByRole("button", { name: "Ask Nova for a breakdown" })
      .click();
    await expect(
      page.getByRole("heading", { name: "A note from Nova" }),
    ).toBeVisible();
    assert.equal(
      state.requests.find((request) => request.path === "/api/summary").body
        .stats.total,
      3,
    );
    await shot(page, "analytics-breakdown-desktop");
    await page
      .getByRole("button", { name: "Clear history", exact: true })
      .click();
    await page.getByRole("button", { name: "Keep history" }).click();
    assert.equal(state.deleted, false);
    await page
      .getByRole("button", { name: "Clear history", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Clear history", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Your first attempt is a beginning." }),
    ).toBeVisible();
    assert.equal(state.deleted, true);
  });
});

test("all routes fit desktop, laptop, tablet and two mobile widths; desktop/mobile screenshots", async () => {
  await fixture(async ({ page, state }) => {
    for (const width of [1440, 1280, 834, 390, 360]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      for (const [name, route] of routes) {
        await go(page, route);
        await expect(
          page.getByRole("button", { name: "Sign out", exact: true }).first(),
        ).toBeVisible();
        await expect(page.locator("h1")).toHaveCount(1);
        const dimensions = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        assert.ok(
          dimensions.scroll <= dimensions.client + 1,
          `${name} overflows at ${width}px: ${JSON.stringify(dimensions)}`,
        );
        if (width === 1440 || width === 390) {
          await shot(page, `${name}-${width === 1440 ? "desktop" : "mobile"}`);
        }
        visualResults.push({ route, width, overflow: false });
      }
    }
    await page.getByRole("button", { name: "Open navigation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("link", { name: "Mock interview", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/interview$/);
    fs.writeFileSync(
      path.join(screenshots, "responsive-results.json"),
      JSON.stringify(
        {
          cases: visualResults,
          pageErrors: state.pageErrors,
          pageErrorDetails: state.pageErrorDetails,
          consoleErrors: state.consoleErrors,
          externalCallsForwarded: 0,
        },
        null,
        2,
      ) + "\n",
    );
    assert.deepEqual(
      state.consoleErrors,
      [],
      "No console errors on normal routes",
    );
  });
});

test("reduced motion disables movement and the application has accessible names", async () => {
  await fixture(
    async ({ page }) => {
      await go(page, "/planner");
      const motion = await page
        .locator(".main-content")
        .evaluate((el) => getComputedStyle(el).animationDuration);
      assert.ok(parseFloat(motion) <= 0.001);
      const missing = await page
        .locator("button:visible")
        .evaluateAll(
          (buttons) =>
            buttons.filter(
              (button) =>
                !button.textContent.trim() &&
                !button.getAttribute("aria-label") &&
                !button.getAttribute("aria-labelledby"),
            ).length,
        );
      assert.equal(missing, 0);
    },
    { reducedMotion: "reduce" },
  );
});

test("axe WCAG 2.2 AA checks all routes and the authentication dialog", async (t) => {
  const axe = process.env.AXE_SCRIPT;
  if (!axe || !fs.existsSync(axe)) {
    t.skip(
      "Set AXE_SCRIPT to the verified axe-core script to run accessibility checks.",
    );
    return;
  }
  await fixture(async ({ page }) => {
    const checks = [];
    for (const [name, route] of routes) {
      await go(page, route);
      await page.addScriptTag({ path: axe });
      const results = await page.evaluate(
        async () =>
          await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
            },
          }),
      );
      checks.push({
        route,
        violations: results.violations.map((item) => ({
          id: item.id,
          impact: item.impact,
          nodes: item.nodes.map((node) => node.target),
        })),
      });
    }
    await page
      .getByRole("button", { name: "Sign out", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: /^Sign in$/ })
      .first()
      .click();
    const modal = await page.evaluate(
      async () =>
        await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        }),
    );
    checks.push({
      route: "auth-dialog",
      violations: modal.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.map((node) => node.target),
      })),
    });
    fs.writeFileSync(
      path.join(screenshots, "accessibility-results.json"),
      JSON.stringify(checks, null, 2) + "\n",
    );
    assert.deepEqual(
      checks.filter((check) => check.violations.length),
      [],
      "All selected accessibility checks pass",
    );
  });
});

test("active mobile sessions keep the timer visible and all feedback screens fit", async () => {
  await fixture(
    async ({ page, state }) => {
      const fits = async (name) => {
        const sizes = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: innerWidth,
        }));
        assert.ok(
          sizes.scroll <= sizes.client + 1,
          `${name} overflows on mobile`,
        );
        await shot(page, name);
      };
      await go(page, "/planner");
      await addProgram(page, 1);
      await addProgram(page, 2);
      await fits("planner-populated-mobile");
      await go(page, "/simulator");
      await page
        .getByRole("button", { name: "Start timed simulation" })
        .click();
      await expect(page.getByRole("timer")).toBeInViewport({ ratio: 1 });
      await page.getByRole("button", { name: "Skip prep / start now" }).click();
      await page.getByLabel("Your response", { exact: true }).fill(answer);
      await expect(page.getByRole("timer")).toBeInViewport({ ratio: 1 });
      await fits("simulator-active-mobile");
      await page.getByRole("button", { name: "Finish & submit" }).click();
      await expect(
        page.getByRole("heading", { name: "A model rewrite" }),
      ).toBeAttached();
      await fits("simulator-feedback-mobile");
      await go(page, "/interview");
      await page.getByRole("button", { name: "Start mock interview" }).click();
      for (let index = 0; index < 3; index++) {
        await page.locator("#interview-answer").fill(answer);
        await page
          .getByRole("button", {
            name: index === 2 ? "Finish and review" : "Next question",
            exact: true,
          })
          .click();
      }
      await expect(
        page.getByRole("heading", {
          name: "Your interview, with perspective.",
        }),
      ).toBeInViewport();
      await fits("interview-feedback-mobile");
      await go(page, "/ec-rater");
      await page
        .getByLabel("Activity name", { exact: true })
        .fill("Community robotics");
      await page.getByRole("button", { name: "Rank my ECs" }).click();
      await expect(
        page.getByRole("heading", {
          name: "Your activity portfolio",
          exact: true,
        }),
      ).toBeInViewport();
      await fits("ec-feedback-mobile");
      await go(page, "/analytics");
      await page
        .getByRole("button", { name: "Ask Nova for a breakdown" })
        .click();
      await expect(
        page.getByRole("heading", { name: "A note from Nova" }),
      ).toBeInViewport();
      await fits("analytics-breakdown-mobile");
      await page
        .getByRole("button", { name: "Sign out", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: /^Sign in$/ })
        .first()
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await fits("auth-dialog-mobile");
      assert.deepEqual(state.pageErrors, []);
    },
    { viewport: { width: 390, height: 844 } },
  );
});

test("interview and activity service failures keep drafts and allow a successful retry", async () => {
  await fixture(async ({ page, state }) => {
    state.interviewStatus = 503;
    await go(page, "/interview");
    await page.getByRole("button", { name: "Start mock interview" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Could not prepare your interview",
    );
    state.interviewStatus = 200;
    await page.getByRole("button", { name: "Start mock interview" }).click();
    await expect(page.locator("#interview-answer")).toBeEditable();
    await go(page, "/ec-rater");
    await page
      .getByLabel("Activity name", { exact: true })
      .fill("Community tutoring");
    state.ecStatus = 503;
    await page.getByRole("button", { name: "Rank my ECs" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Could not review your activities",
    );
    await expect(page.getByLabel("Activity name", { exact: true })).toHaveValue(
      "Community tutoring",
    );
    state.ecStatus = 200;
    await page.getByRole("button", { name: "Rank my ECs" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Your activity portfolio",
        exact: true,
      }),
    ).toBeVisible();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "accepted-ecs-draft-v1")
          throw new DOMException("Storage unavailable", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await page.getByLabel("Your role", { exact: true }).fill("Volunteer tutor");
    await expect(
      page.getByText(
        "Browser storage is unavailable. Keep a copy of your activities before leaving.",
      ),
    ).toBeVisible();
  });
});
