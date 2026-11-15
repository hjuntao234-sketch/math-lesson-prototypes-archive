const assert = require("node:assert/strict");
const {pathToFileURL} = require("node:url");
const {chromium} = require("/Applications/Codex.app/Contents/Resources/cua_node/lib/node_modules/playwright");

async function check() {
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--disable-background-networking"]
  });
  try {
    for (const [name, width, colorScheme, touch] of [
      ["desktop", 768, "light", false],
      ["narrow", 352, "dark", true]
    ]) {
      const page = await browser.newPage({
        viewport: {width, height: 1500},
        colorScheme,
        isMobile: touch,
        hasTouch: touch
      });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(pathToFileURL(process.argv[2]).href);
      const frame = page.frameLocator("iframe");
      const buttons = frame.locator(".idea-node");
      const lines = frame.locator(".idea-lines");
      await buttons.first().waitFor();
      assert.equal(await buttons.count(), 38);
      assert.equal(await frame.locator("[aria-pressed=true]").innerText(), "黑箱测规则");
      assert.equal(await lines.locator("path[data-active]").count(), 8);
      await frame.locator("#math-game-idea-map").screenshot({path: "work/map-" + name + ".png"});
      const expected = [
        ["复数", "数学内容", 4],
        ["找反例", "思维动作", 14],
        ["双焦点工坊", "物理沙盒 · 投屏共判", 7],
        ["偏样本调查", "模拟调查 · 小组讨论", 5],
      ];
      for (const [label, category, edges] of expected) {
        const target = frame.getByRole("button", {name: label, exact: true});
        if (touch) {
          await target.tap();
        } else {
          await target.focus();
          await page.keyboard.press("Enter");
        }
        assert.equal(await frame.locator("[data-detail-title]").innerText(), label);
        assert.equal(await frame.locator("[data-detail-context]").innerText(), category);
        assert.equal(await lines.locator("path[data-active]").count(), edges, label);
      }
      const layout = await lines.evaluate(svg => {
        const document = svg.ownerDocument;
        const viewport = document.documentElement.clientWidth;
        const boxes = Array.from(document.querySelectorAll(".idea-node"), button => button.getBoundingClientRect());
        return {
          viewport,
          total: svg.children.length,
          emptyPaths: Array.from(svg.children).filter(path => !path.getAttribute("d")).length,
          overflow: document.documentElement.scrollWidth > viewport ||
            boxes.some(box => box.left < 0 || box.right > viewport),
          minHeight: Math.min(...boxes.map(box => box.height)),
        };
      });
      assert.equal(layout.viewport, width - 32);
      assert.equal(layout.emptyPaths, 0);
      assert.equal(layout.overflow, false);
      if (touch) assert.ok(layout.minHeight >= 44, JSON.stringify(layout));
      assert.deepEqual(errors, []);
      console.log(name, layout);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

check().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
