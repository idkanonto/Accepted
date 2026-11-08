// Run after browser-checks.js in the same local playwright-cli session.
// Reuses its isolated API intercepts. No microphone hardware or live AI calls.
async (page) => {
  const results = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(label);
    results.push(label);
  };
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/interview');
    await page.getByRole('button', { name: 'Sign out', exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'Start mock interview' }).click();
    await page.locator('#interview-answer').waitFor();
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
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
                        'I helped our community science team create an accessible workshop and learned how shared planning helps everyone contribute.',
                    },
                  },
                ],
              }),
            50
          );
        }
        stop() {
          this.onend?.();
        }
      };
    });
    await page.getByRole('button', { name: 'Answer by voice' }).click();
    await page.getByRole('button', { name: 'Stop speaking' }).waitFor();
    assert(
      await page.getByRole('button', { name: 'Next question' }).isDisabled(),
      'Advancing is disabled while speaking'
    );
    await page.waitForFunction(() =>
      document.querySelector('#interview-answer').value.includes('accessible workshop')
    );
    await page.getByRole('button', { name: 'Stop speaking' }).click();
    assert(
      (await page.locator('#interview-answer').inputValue()).includes('shared planning'),
      'Synthetic speech transcript survives stop'
    );
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException('Denied', 'NotAllowedError');
          },
        },
      })
    );
    await page.getByRole('button', { name: 'Answer by voice' }).click();
    await page.getByRole('alert').filter({ hasText: 'Microphone access was blocked' }).waitFor();
    assert(true, 'Microphone permission error offers typed fallback');
    assert(
      (await page.locator('#interview-answer').inputValue()).includes('shared planning'),
      'Permission error preserves transcript'
    );

    for (const path of [
      '/',
      '/vault',
      '/planner',
      '/simulator',
      '/interview',
      '/ec-rater',
      '/analytics',
      '/login',
    ]) {
      await page.goto('http://localhost:3000' + path);
      await page.getByRole('button', { name: 'Sign out', exact: true }).first().waitFor();
      await page.locator('main h1').waitFor();
      await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
      const measure = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert(
        measure.scroll <= measure.width + 1,
        `${path} at 200% text: no page overflow (${measure.scroll}/${measure.width})`
      );
      await page.evaluate(() => (document.documentElement.style.fontSize = ''));
    }
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
      .getByRole('navigation', { name: 'All tools' })
      .getByRole('link', { name: 'Overview', exact: true })
      .click();
    assert(
      !(await page.getByRole('dialog').isVisible()),
      'Overview closes navigation even on the current route'
    );

    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: 'Sign out', exact: true }).first().waitFor();
    await page.evaluate(() => {
      const key = 'sb-accepted-qa-auth-token';
      const session = JSON.parse(localStorage.getItem(key));
      session.user.email =
        'aleksandra.wisniewska-kowalczyk+applications@northwind-student-community.example.test';
      localStorage.setItem(key, JSON.stringify(session));
    });
    await page.reload();
    await page
      .locator('main')
      .getByText(
        'aleksandra.wisniewska-kowalczyk+applications@northwind-student-community.example.test',
        { exact: true }
      )
      .first()
      .waitFor();
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'Long account email wraps within the account view'
    );
    return { passed: results.length, results };
  } catch (error) {
    return { failed: error.message, url: page.url(), passed: results.length, results };
  }
}
