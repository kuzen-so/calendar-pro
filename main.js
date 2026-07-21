/* Diary Heatmap Plugin */
var ae = Object.defineProperty;
var ue = Object.getOwnPropertyDescriptor;
var fe = Object.getOwnPropertyNames;
var ge = Object.prototype.hasOwnProperty;
var ye = (o, t) => {
    for (var e in t) ae(o, e, { get: t[e], enumerable: !0 });
  },
  we = (o, t, e, a) => {
    if ((t && typeof t == "object") || typeof t == "function")
      for (let i of fe(t))
        !ge.call(o, i) &&
          i !== e &&
          ae(o, i, {
            get: () => t[i],
            enumerable: !(a = ue(t, i)) || a.enumerable,
          });
    return o;
  };
var ve = (o) => we(ae({}, "__esModule", { value: !0 }), o);
var be = {};
ye(be, { default: () => X });
module.exports = ve(be);
var he = require("obsidian");
var Y = require("obsidian"),
  A = {
    thresholds: [50, 150, 300, 500, 800],
    colors: ["#ddf4e0", "#9be9a8", "#40c463", "#216e39", "#0e4429", "#052814"],
    darkColors: [
      "#0e4429",
      "#006d32",
      "#26a641",
      "#39d353",
      "#56d364",
      "#7ee787",
    ],
    defaultYear: "current",
    customFolder: "",
    customFormat: "YYYY-MM-DD",
    useCustomConfig: !1,
    weeklyFolder: "",
    weekStart: 1,
    showWeekNumbers: !0,
    defaultView: "calendar",
    heatmapMonthView: !1,
    colorTheme: "green",
  },
  Me = {
    green: {
      colors: [
        "#ddf4e0",
        "#9be9a8",
        "#40c463",
        "#216e39",
        "#0e4429",
        "#052814",
      ],
      darkColors: [
        "#0e4429",
        "#006d32",
        "#26a641",
        "#39d353",
        "#56d364",
        "#7ee787",
      ],
    },
    "morandi-blue": {
      colors: [
        "#e8f1f8",
        "#c5d9e8",
        "#9bbfd4",
        "#729eb8",
        "#4f7d9a",
        "#2f5c78",
      ],
      darkColors: [
        "#2f5c78",
        "#3d7594",
        "#558fb0",
        "#7ab0cc",
        "#a8d0e6",
        "#d6eaf5",
      ],
    },
    "morandi-pink": {
      colors: [
        "#f5e6e0",
        "#e8c8bf",
        "#d9a99e",
        "#c88a7d",
        "#b56b5d",
        "#9f4d40",
      ],
      darkColors: [
        "#5c2e28",
        "#7a3f38",
        "#9f5d52",
        "#c28276",
        "#dbaaa0",
        "#f0d4cd",
      ],
    },
    "morandi-orange": {
      colors: [
        "#f8ece0",
        "#ebd0b9",
        "#dcb392",
        "#cc966d",
        "#bb794a",
        "#a85d2b",
      ],
      darkColors: [
        "#5c341a",
        "#7a4a26",
        "#9e683c",
        "#c08c5e",
        "#dbb58a",
        "#f2dec2",
      ],
    },
    "morandi-purple": {
      colors: [
        "#ede6f0",
        "#d4c8dc",
        "#b9a7c6",
        "#9e86b0",
        "#85679a",
        "#6c4a84",
      ],
      darkColors: [
        "#3d2a4d",
        "#523a66",
        "#6f5682",
        "#9078a3",
        "#b5a4c4",
        "#ddd4e5",
      ],
    },
    ink: {
      colors: [
        "#eef0f3",
        "#d9dee6",
        "#b3bcca",
        "#8591a6",
        "#525f7d",
        "#232c42",
      ],
      darkColors: [
        "#232c42",
        "#525f7d",
        "#8591a6",
        "#b3bcca",
        "#d9dee6",
        "#eef0f3",
      ],
    },
    terracotta: {
      colors: [
        "#f7efe7",
        "#efdbc7",
        "#e2bb99",
        "#cb8f58",
        "#a55c24",
        "#6e3610",
      ],
      darkColors: [
        "#54290d",
        "#7e4218",
        "#ad6630",
        "#cf9660",
        "#e8c49c",
        "#f6e6d2",
      ],
    },
    pine: {
      colors: [
        "#ecf2ed",
        "#d2e2d6",
        "#a6c8b0",
        "#6fa683",
        "#3d7d57",
        "#174f31",
      ],
      darkColors: [
        "#123d26",
        "#1c5c3a",
        "#3d8258",
        "#6fae8b",
        "#a9d4ba",
        "#d9ecdf",
      ],
    },
  },
  q = class extends Y.PluginSettingTab {
    constructor(t, e) {
      (super(t, e), (this.plugin = e));
    }
    display() {
      let { containerEl: t } = this;
      (t.empty(),
        t.createEl("h2", { text: "Calendar Pro \u8BBE\u7F6E" }),
        new Y.Setting(t)
          .setName("\u4F7F\u7528\u81EA\u5B9A\u4E49\u65E5\u8BB0\u914D\u7F6E")
          .setDesc(
            "\u5982\u679C\u672A\u542F\u7528 Daily Notes \u63D2\u4EF6\uFF0C\u6216\u60F3\u8986\u76D6\u5176\u914D\u7F6E\uFF0C\u8BF7\u5F00\u542F\u6B64\u9009\u9879",
          )
          .addToggle((i) =>
            i
              .setValue(this.plugin.settings.useCustomConfig)
              .onChange(async (s) => {
                ((this.plugin.settings.useCustomConfig = s),
                  await this.plugin.saveSettings(),
                  this.display());
              }),
          ),
        this.plugin.settings.useCustomConfig &&
          (new Y.Setting(t)
            .setName("\u65E5\u8BB0\u6587\u4EF6\u5939")
            .setDesc(
              "\u65E5\u8BB0\u5B58\u653E\u7684\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u7559\u7A7A\u8868\u793A\u6839\u76EE\u5F55",
            )
            .addText((i) =>
              i
                .setPlaceholder("\u4F8B\u5982: Journal \u6216 \u65E5\u8BB0")
                .setValue(this.plugin.settings.customFolder)
                .onChange(async (s) => {
                  ((this.plugin.settings.customFolder = s),
                    await this.plugin.saveSettings());
                }),
            ),
          new Y.Setting(t)
            .setName("\u65E5\u671F\u683C\u5F0F")
            .setDesc(
              "\u65E5\u8BB0\u6587\u4EF6\u7684\u65E5\u671F\u683C\u5F0F\uFF08moment.js \u683C\u5F0F\uFF09",
            )
            .addText((i) =>
              i
                .setPlaceholder("YYYY-MM-DD")
                .setValue(this.plugin.settings.customFormat)
                .onChange(async (s) => {
                  ((this.plugin.settings.customFormat = s || "YYYY-MM-DD"),
                    await this.plugin.saveSettings());
                }),
            )),
        new Y.Setting(t)
          .setName("\u9ED8\u8BA4\u663E\u793A\u5E74\u4EFD")
          .setDesc(
            "\u6253\u5F00\u70ED\u529B\u56FE\u65F6\u9ED8\u8BA4\u663E\u793A\u7684\u65F6\u95F4\u8303\u56F4",
          )
          .addDropdown((i) =>
            i
              .addOption("current", "\u5F53\u5E74\u5B8C\u6574\u5E74\u4EFD")
              .addOption("recent", "\u8FD1\u4E00\u5E74")
              .setValue(this.plugin.settings.defaultYear)
              .onChange(async (s) => {
                ((this.plugin.settings.defaultYear = s),
                  await this.plugin.saveSettings());
              }),
          ),
        new Y.Setting(t)
          .setName("\u5468\u5F00\u59CB\u65E5")
          .setDesc(
            "\u65E5\u5386\u89C6\u56FE\u4EE5\u661F\u671F\u51E0\u4F5C\u4E3A\u4E00\u5468\u7684\u5F00\u59CB",
          )
          .addDropdown((i) =>
            i
              .addOption("0", "\u5468\u65E5")
              .addOption("1", "\u5468\u4E00")
              .setValue(String(this.plugin.settings.weekStart))
              .onChange(async (s) => {
                ((this.plugin.settings.weekStart = parseInt(s)),
                  await this.plugin.saveSettings(),
                  this.plugin.app.workspace
                    .getLeavesOfType("diary-heatmap-view")
                    .forEach((n) => {
                      let l = n.view;
                      l.debouncedRefresh && l.debouncedRefresh();
                    }));
              }),
          ),
        new Y.Setting(t)
          .setName("\u5C55\u73B0\u5468\u6570")
          .setDesc(
            "\u5728\u65E5\u5386\u89C6\u56FE\u5DE6\u4FA7\u663E\u793A\u5468\u6570\u6807\u7B7E",
          )
          .addToggle((i) =>
            i
              .setValue(this.plugin.settings.showWeekNumbers)
              .onChange(async (s) => {
                ((this.plugin.settings.showWeekNumbers = s),
                  await this.plugin.saveSettings(),
                  this.plugin.app.workspace
                    .getLeavesOfType("diary-heatmap-view")
                    .forEach((n) => {
                      let l = n.view;
                      l.debouncedRefresh && l.debouncedRefresh();
                    }));
              }),
          ),
        new Y.Setting(t)
          .setName("\u5468\u8BB0\u6587\u4EF6\u5939")
          .setDesc(
            "\u5468\u8BB0\u5B58\u653E\u7684\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u7559\u7A7A\u5219\u4E0E\u65E5\u8BB0\u5171\u7528\u540C\u4E00\u6587\u4EF6\u5939",
          )
          .addText((i) =>
            i
              .setPlaceholder("\u4F8B\u5982: Weekly \u6216 \u5468\u8BB0")
              .setValue(this.plugin.settings.weeklyFolder)
              .onChange(async (s) => {
                ((this.plugin.settings.weeklyFolder = s),
                  await this.plugin.saveSettings());
              }),
          ),
        new Y.Setting(t)
          .setName("默认视图")
          .setDesc("选择打开 Calendar Pro 时默认显示的视图布局")
          .addDropdown((i) =>
            i
              .addOption("calendar", "日历图")
              .addOption("heatmap", "热力图")
              .addOption("combined", "合并显示（日历在上，热力图在下）")
              .setValue(this.plugin.settings.defaultView)
              .onChange(async (s) => {
                ((this.plugin.settings.defaultView = s),
                  await this.plugin.saveSettings(),
                  this.plugin.app.workspace
                    .getLeavesOfType("diary-heatmap-view")
                    .forEach((n) => {
                      let l = n.view;
                      l &&
                        ((l.viewMode = s),
                        l.debouncedRefresh && l.debouncedRefresh());
                    }));
              }),
          ),
        new Y.Setting(t)
          .setName("\u70ED\u529B\u56FE\u6708\u89C6\u56FE")
          .setDesc("\u5F00\u542F\u540E\u70ED\u529B\u56FE\u53EA\u663E\u793A\u5F53\u524D\u6708\uFF087 \u5217\u6309\u5468\u5BF9\u9F50\uFF09\uFF0C\u5E76\u8DDF\u968F\u6708\u4EFD\u5207\u6362\uFF1B\u5173\u95ED\u5219\u4E3A\u6574\u5E74\u89C6\u56FE")
          .addToggle((i) =>
            i
              .setValue(this.plugin.settings.heatmapMonthView)
              .onChange(async (s) => {
                ((this.plugin.settings.heatmapMonthView = s),
                  await this.plugin.saveSettings(),
                  this.plugin.app.workspace
                    .getLeavesOfType("diary-heatmap-view")
                    .forEach((n) => {
                      let l = n.view;
                      l && l.debouncedRefresh && l.debouncedRefresh();
                    }));
              }),
          ),
        new Y.Setting(t)
          .setName("\u70ED\u529B\u56FE\u914D\u8272")
          .setDesc("\u9009\u62E9\u70ED\u529B\u56FE\u7684\u989C\u8272\u4E3B\u9898\uFF0C\u5E94\u7528\u540E\u4F1A\u8986\u76D6\u4E0B\u65B9\u7684\u989C\u8272\u8BBE\u7F6E")
          .addDropdown((i) =>
            i
              .addOption("green", "\u7EFF\u8272")
              .addOption("morandi-blue", "\u83AB\u5170\u8FEA\u84DD")
              .addOption("morandi-pink", "\u83AB\u5170\u8FEA\u7C89")
              .addOption("morandi-orange", "\u83AB\u5170\u8FEA\u6A59")
              .addOption("morandi-purple", "莫兰迪紫")
              .addOption("ink", "墨（单色灰蓝）")
              .addOption("terracotta", "赤陶（暖纸赭石）")
              .addOption("pine", "松烟（沉稳绿）")
              .setValue(this.plugin.settings.colorTheme)
              .onChange(async (s) => {
                let r = Me[s];
                r &&
                  ((this.plugin.settings.colorTheme = s),
                  (this.plugin.settings.colors = [...r.colors]),
                  (this.plugin.settings.darkColors = [...r.darkColors]),
                  await this.plugin.saveSettings(),
                  this.display(),
                  this.plugin.app.workspace
                    .getLeavesOfType("diary-heatmap-view")
                    .forEach((n) => {
                      let l = n.view;
                      l.debouncedRefresh && l.debouncedRefresh();
                    }));
              }),
          ),
        t.createEl("h3", {
          text: "\u70ED\u529B\u56FE\u6863\u4F4D\u8BBE\u7F6E",
        }));
      let e = t.createEl("p", {
        text: "\u6BCF\u884C\u8BBE\u7F6E\u4E00\u4E2A\u6863\u4F4D\u7684\u5B57\u6570\u9608\u503C\u548C\u5BF9\u5E94\u989C\u8272\uFF08\u9700\u9012\u589E\uFF09",
        cls: "setting-item-description",
      });
      e.style.marginBottom = "12px";
      let a = [
        "\u7B2C 1 \u6863\uFF08\u2264 N \u5B57\uFF09",
        "\u7B2C 2 \u6863\uFF08\u2264 N \u5B57\uFF09",
        "\u7B2C 3 \u6863\uFF08\u2264 N \u5B57\uFF09",
        "\u7B2C 4 \u6863\uFF08\u2264 N \u5B57\uFF09",
        "\u7B2C 5 \u6863\uFF08\u2264 N \u5B57\uFF09",
        "\u7B2C 6 \u6863\uFF08> N \u5B57\uFF09",
      ];
      (a.forEach((i, s) => {
        let r = s === a.length - 1,
          n = t.createDiv();
        if (
          ((n.style.display = "flex"),
          (n.style.alignItems = "center"),
          (n.style.gap = "8px"),
          (n.style.marginBottom = "8px"),
          (n.style.padding = "6px 8px"),
          (n.style.borderRadius = "6px"),
          (n.style.background = "var(--background-modifier-form-field)"),
          (n.style.border = "1px solid var(--background-modifier-border)"),
          (n.createEl("span", {
            text: i,
            cls: "setting-item-name",
          }).style.fontSize = "12px"),
          (n.createEl("span").style.flex = "1"),
          !r)
        ) {
          let g = n.createEl("input", {
            type: "number",
            value: String(this.plugin.settings.thresholds[s] || 50),
          });
          ((g.style.width = "70px"),
            (g.style.padding = "3px 6px"),
            (g.style.borderRadius = "4px"),
            (g.style.border = "1px solid var(--background-modifier-border)"),
            (g.style.background = "var(--background-primary)"),
            (g.style.color = "var(--text-normal)"),
            g.addEventListener("change", async () => {
              let k = Math.max(1, Math.round(Number(g.value)));
              this.plugin.settings.thresholds[s] = k;
              for (let E = 1; E < this.plugin.settings.thresholds.length; E++)
                this.plugin.settings.thresholds[E] <=
                  this.plugin.settings.thresholds[E - 1] &&
                  (this.plugin.settings.thresholds[E] =
                    this.plugin.settings.thresholds[E - 1] + 50);
              (await this.plugin.saveSettings(), this.display());
            }));
        }
        let l = n.createDiv();
        ((l.style.display = "flex"),
          (l.style.alignItems = "center"),
          (l.style.gap = "3px"),
          (l.style.flexShrink = "0"));
        let p = l.createEl("span", { text: "\u2600" });
        p.style.fontSize = "10px";
        let d = l.createEl("input", {
          type: "color",
          value: this.plugin.settings.colors[s] || "#999",
        });
        ((d.style.width = "28px"),
          (d.style.height = "22px"),
          (d.style.padding = "0"),
          (d.style.border = "none"),
          (d.style.background = "none"),
          (d.style.cursor = "pointer"),
          d.addEventListener("change", async () => {
            ((this.plugin.settings.colors[s] = d.value),
              await this.plugin.saveSettings());
          }));
        let v = n.createDiv();
        ((v.style.display = "flex"),
          (v.style.alignItems = "center"),
          (v.style.gap = "3px"),
          (v.style.flexShrink = "0"));
        let D = v.createEl("span", { text: "\u263E" });
        D.style.fontSize = "10px";
        let f = v.createEl("input", {
          type: "color",
          value: this.plugin.settings.darkColors[s] || "#999",
        });
        ((f.style.width = "28px"),
          (f.style.height = "22px"),
          (f.style.padding = "0"),
          (f.style.border = "none"),
          (f.style.background = "none"),
          (f.style.cursor = "pointer"),
          f.addEventListener("change", async () => {
            ((this.plugin.settings.darkColors[s] = f.value),
              await this.plugin.saveSettings());
          }));
      }),
        new Y.Setting(t).addButton((i) =>
          i
            .setButtonText(
              "\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u7EFF\u8272\u4E3B\u9898",
            )
            .onClick(async () => {
              ((this.plugin.settings.colors = [...A.colors]),
                (this.plugin.settings.darkColors = [...A.darkColors]),
                (this.plugin.settings.thresholds = [...A.thresholds]),
                await this.plugin.saveSettings(),
                this.display());
            }),
        ));
    }
  };
var b = require("obsidian");
var m = require("obsidian");
var P = require("obsidian"),
  De = { folder: "", format: "YYYY-MM-DD", template: "" };
async function ne(o) {
  try {
    let t = (0, P.normalizePath)(".obsidian/daily-notes.json");
    if (await o.vault.adapter.exists(t)) {
      let e = await o.vault.adapter.read(t),
        a = JSON.parse(e);
      return {
        folder: a.folder || "",
        format: a.format || "YYYY-MM-DD",
        template: a.template || "",
      };
    }
  } catch (t) {
    console.error("[Diary Heatmap] Failed to read daily-notes config:", t);
  }
  try {
    let t = (0, P.normalizePath)(".obsidian/calendar-plugin.json");
    if (await o.vault.adapter.exists(t)) {
      let e = await o.vault.adapter.read(t),
        a = JSON.parse(e);
      return {
        folder: a.dailyNotesFolder || "",
        format: a.dailyNoteFormat || "YYYY-MM-DD",
        template: "",
      };
    }
  } catch (t) {
    console.error("[Diary Heatmap] Failed to read calendar-plugin config:", t);
  }
  return { ...De };
}
function Ce(o) {
  return o.format || "YYYY-MM-DD";
}
function I(o) {
  return o.folder ? (0, P.normalizePath)(o.folder) : "";
}
function B(o, t) {
  let e = I(t),
    a = Ce(t),
    i = o.format(a) + ".md";
  return e ? (0, P.normalizePath)(`${e}/${i}`) : i;
}
async function re(o, t) {
  if (!t) return "";
  try {
    let e = (0, P.normalizePath)(t);
    if (await o.vault.adapter.exists(e)) return await o.vault.adapter.read(e);
  } catch (e) {
    (console.error("[Diary Heatmap] Failed to read template:", e),
      new P.Notice("\u65E5\u8BB0\u6A21\u677F\u8BFB\u53D6\u5931\u8D25"));
  }
  return "";
}
var V = require("obsidian"),
  z = class extends V.Modal {
    constructor(e, a, i) {
      super(e);
      this.message = a;
      this.onConfirm = i;
    }
    onOpen() {
      let { contentEl: e } = this;
      e.createEl("p", { text: this.message });
      let a = e.createDiv({ cls: "modal-button-container" });
      (new V.ButtonComponent(a).setButtonText("\u53D6\u6D88").onClick(() => {
        this.close();
      }),
        new V.ButtonComponent(a)
          .setButtonText("\u521B\u5EFA")
          .setCta()
          .onClick(() => {
            (this.onConfirm(), this.close());
          }));
    }
    onClose() {
      this.contentEl.empty();
    }
  };
var G = class {
  constructor(t, e, a, i) {
    this.app = t;
    this.plugin = e;
    this.cache = a;
    this.onRefresh = i;
  }
  countWeeklyNotes(t, e) {
    let a = `${t}-\u7B2C`,
      i = "\u5468.md";
    if (e) {
      let r = this.app.vault.getAbstractFileByPath(e);
      if (r instanceof m.TFolder) {
        let n = 0;
        for (let l of r.children)
          if (l instanceof m.TFile && l.extension === "md") {
            let p = l.name;
            p.startsWith(a) && p.endsWith(i) && n++;
          }
        return n;
      }
    }
    let s = new RegExp(`^${t}-\u7B2C\\d{1,2}\u5468\\.md$`);
    return this.app.vault.getFiles().filter((r) => s.test(r.name)).length;
  }
  openDiary(t) {
    let e = this.app.vault.getAbstractFileByPath(t);
    e instanceof m.TFile && this.app.workspace.getLeaf().openFile(e);
  }
  async createDiary(t) {
    let e = await this.plugin.getEffectiveConfig(),
      a = window.moment(t, "YYYY-MM-DD"),
      i = B(a, e),
      s = this.app.vault.getAbstractFileByPath(i);
    if (s instanceof m.TFile) {
      this.app.workspace.getLeaf().openFile(s);
      return;
    }
    let r = a.format("YYYY\u5E74M\u6708D\u65E5");
    new z(
      this.app,
      `\u662F\u5426\u521B\u5EFA ${r} \u7684\u65E5\u8BB0\uFF1F`,
      async () => {
        try {
          let n = "";
          e.template && (n = await re(this.app, e.template));
          let l = a.format("dddd");
          ((n = n
            .replace(/\{\{date\}\}/g, r)
            .replace(/\{\{title\}\}/g, r)
            .replace(/\{\{time\}\}/g, a.format("HH:mm"))
            .replace(/\{\{date:([^}]+)\}\}/g, (v, D) => a.format(D))
            .replace(/\{\{time:([^}]+)\}\}/g, (v, D) => a.format(D))
            .replace(
              /\{\{yesterday\}\}/g,
              a.clone().subtract(1, "day").format("YYYY\u5E74M\u6708D\u65E5"),
            )
            .replace(
              /\{\{tomorrow\}\}/g,
              a.clone().add(1, "day").format("YYYY\u5E74M\u6708D\u65E5"),
            )),
            n.trim() || (n = ""));
          let p = I(e);
          p &&
            !(await this.app.vault.adapter.exists(p)) &&
            (await this.app.vault.createFolder(p));
          let d = await this.app.vault.create(i, n);
          (this.app.workspace.getLeaf().openFile(d),
            new m.Notice(`\u5DF2\u521B\u5EFA\u65E5\u8BB0: ${r}`));
        } catch (n) {
          (console.error("[Diary Heatmap] Failed to create diary:", n),
            new m.Notice("\u521B\u5EFA\u65E5\u8BB0\u5931\u8D25"));
        }
      },
    ).open();
  }
  async openOrCreateWeeklyDiary(t, e) {
    let { filePath: a, folder: i } = await this.getWeeklyFileInfo(t, e),
      s = this.app.vault.getAbstractFileByPath(a);
    if (s instanceof m.TFile) {
      this.app.workspace.getLeaf().openFile(s);
      return;
    }
    new z(
      this.app,
      `\u662F\u5426\u521B\u5EFA ${t}\u5E74\u7B2C${e}\u5468\u7684\u5468\u8BB0\uFF1F`,
      async () => {
        try {
          let r = "";
          i &&
            !(await this.app.vault.adapter.exists(i)) &&
            (await this.app.vault.createFolder(i));
          let n = await this.app.vault.create(a, r);
          (this.app.workspace.getLeaf().openFile(n),
            new m.Notice(
              `\u5DF2\u521B\u5EFA\u5468\u8BB0: ${t}\u5E74\u7B2C${e}\u5468`,
            ));
        } catch (r) {
          (console.error("[Diary Heatmap] Failed to create weekly note:", r),
            new m.Notice("\u521B\u5EFA\u5468\u8BB0\u5931\u8D25"));
        }
      },
    ).open();
  }
  showCalendarContextMenu(t, e) {
    let a = this.app.vault.getAbstractFileByPath(e.filePath);
    if (!(a instanceof m.TFile)) return;
    let i = new m.Menu();
    (i.addItem((s) =>
      s
        .setTitle("\u6253\u5F00\u65E5\u8BB0")
        .setIcon("file-text")
        .onClick(() => this.openDiary(e.filePath)),
    ),
      i.addItem((s) =>
        s
          .setTitle("\u590D\u5236\u8DEF\u5F84")
          .setIcon("copy")
          .onClick(() => {
            (navigator.clipboard.writeText(e.filePath),
              new m.Notice(
                "\u8DEF\u5F84\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
              ));
          }),
      ),
      i.addSeparator(),
      i.addItem((s) =>
        s
          .setTitle("\u5220\u9664\u65E5\u8BB0")
          .setIcon("trash")
          .onClick(async () => {
            (await this.app.fileManager.trashFile(a),
              this.cache.invalidate(e.filePath),
              this.onRefresh(),
              new m.Notice("\u65E5\u8BB0\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9"));
          }),
      ),
      i.showAtMouseEvent(t));
  }
  async showWeeklyContextMenu(t, e, a) {
    let { filePath: i } = await this.getWeeklyFileInfo(e, a),
      s = this.app.vault.getAbstractFileByPath(i);
    if (s instanceof m.TFile) {
      let r = new m.Menu();
      (r.addItem((n) =>
        n
          .setTitle("\u6253\u5F00\u5468\u8BB0")
          .setIcon("file-text")
          .onClick(() => this.openDiary(i)),
      ),
        r.addItem((n) =>
          n
            .setTitle("\u590D\u5236\u8DEF\u5F84")
            .setIcon("copy")
            .onClick(() => {
              (navigator.clipboard.writeText(i),
                new m.Notice(
                  "\u8DEF\u5F84\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
                ));
            }),
        ),
        r.addSeparator(),
        r.addItem((n) =>
          n
            .setTitle("\u5220\u9664\u5468\u8BB0")
            .setIcon("trash")
            .onClick(async () => {
              (await this.app.fileManager.trashFile(s),
                this.onRefresh(),
                new m.Notice(
                  "\u5468\u8BB0\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9",
                ));
            }),
        ),
        r.showAtMouseEvent(t));
    } else {
      let r = new m.Menu();
      (r.addItem((n) =>
        n
          .setTitle("\u521B\u5EFA\u5468\u8BB0")
          .setIcon("plus")
          .onClick(() => this.openOrCreateWeeklyDiary(e, a)),
      ),
        r.showAtMouseEvent(t));
    }
  }
  async getWeeklyFileInfo(t, e) {
    let a = this.plugin.settings.weeklyFolder
        ? (0, m.normalizePath)(this.plugin.settings.weeklyFolder)
        : "",
      i = await this.plugin.getEffectiveConfig(),
      s = I(i),
      r = a || s,
      n = `${t}-\u7B2C${e}\u5468.md`;
    return { filePath: r ? (0, m.normalizePath)(`${r}/${n}`) : n, folder: r };
  }
};
var ie = require("obsidian");
function oe(o) {
  let t = o;
  if (t.startsWith("---")) {
    let s = t.indexOf("---", 3);
    s !== -1 && (t = t.slice(s + 3).trimStart());
  }
  let e = t
      .replace(/[#*\-\[\]\(\)!|`>_]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
    a = (e.match(/[一-鿿]/g) || []).length,
    i = (e.match(/[a-zA-Z]+/g) || []).length;
  return a + i;
}
function K(o, t) {
  if (o === 0) return 0;
  for (let e = 0; e < t.length; e++) if (o <= t[e]) return e + 1;
  return t.length + 1;
}
var J = class {
  constructor(t) {
    (this.app = t), (this.cache = new Map()), (this.maxCacheSize = 500);
  }
  trimCache() {
    if (this.cache.size <= this.maxCacheSize) return;
    let t = Math.ceil(this.maxCacheSize * 0.2);
    for (let e of this.cache.keys()) {
      if (t-- <= 0) break;
      this.cache.delete(e);
    }
  }
  invalidate(t) {
    this.cache.delete(t);
  }
  clear() {
    this.cache.clear();
  }
  async getFileData(t) {
    let e = this.app.vault.getAbstractFileByPath(t);
    if (!(e instanceof ie.TFile))
      return (this.cache.delete(t), { wordCount: 0, exists: !1 });
    let a = this.cache.get(t);
    if (a && a.mtime === e.stat.mtime)
      return (
        this.cache.delete(t), this.cache.set(t, a), { wordCount: a.wordCount, exists: !0 }
      );
    try {
      let i = await this.app.vault.read(e),
        s = oe(i);
      return (
        this.cache.set(t, { wordCount: s, mtime: e.stat.mtime }),
        this.trimCache(),
        { wordCount: s, exists: !0 }
      );
    } catch (i) {
      return (
        console.error(`[Diary Heatmap] Failed to read ${t}:`, i),
        this.cache.delete(t),
        { wordCount: 0, exists: !0 }
      );
    }
  }
  async getDayData(t, e) {
    let a = B(t, e),
      i = this.app.vault.getAbstractFileByPath(a);
    if (!(i instanceof ie.TFile))
      return (
        this.cache.has(a) && this.cache.delete(a),
        { wordCount: 0, exists: !1, filePath: a }
      );
    let s = this.cache.get(a);
    if (s && s.mtime === i.stat.mtime)
      return (
        this.cache.delete(a), this.cache.set(a, s), { wordCount: s.wordCount, exists: !0, filePath: a }
      );
    try {
      let r = await this.app.vault.read(i),
        n = oe(r);
      return (
        this.cache.set(a, { wordCount: n, mtime: i.stat.mtime }),
        this.trimCache(),
        { wordCount: n, exists: !0, filePath: a }
      );
    } catch (r) {
      return (
        console.error(`[Diary Heatmap] Failed to read ${a}:`, r),
        { wordCount: 0, exists: !0, filePath: a }
      );
    }
  }
  async getRangeData(t, e, a, i) {
    let s = [],
      r = e.clone();
    for (; r.isSameOrBefore(a, "day");) {
      let l = r.format("YYYY-MM-DD"),
        p = i !== void 0 ? r.year() === i : !0;
      (s.push({ date: r.clone(), dateStr: l, inYear: p }), r.add(1, "day"));
    }
    return await Promise.all(
      s.map(async ({ date: l, dateStr: p, inYear: d }) => {
        if (d) {
          let {
            wordCount: v,
            exists: D,
            filePath: f,
          } = await this.getDayData(l, t);
          return { date: p, wordCount: v, exists: D, filePath: f, inYear: d };
        } else {
          let v = B(l, t);
          return { date: p, wordCount: 0, exists: !1, filePath: v, inYear: !1 };
        }
      }),
    );
  }
};
function O(o, t, e) {
  let i = (o.day() - t + 7) % 7,
    s = o.clone().subtract(i, "days");
  return e ? s.add(6, "days") : s;
}
function getWeekInfo(o, t) {
  let e = O(o.clone(), t, !1),
    a = e.clone().add(5, "days").year(),
    i = O(window.moment([a, 0, 1]), t, !1);
  return { year: a, week: Math.floor(e.diff(i, "days") / 7) + 1 };
}
async function le(o, t, e, a = 1) {
  let i = window.moment(`${e}-01-01`, "YYYY-MM-DD"),
    s = window.moment(`${e}-12-31`, "YYYY-MM-DD"),
    r = O(i, a, !1),
    n = O(s, a, !0);
  return o.getRangeData(t, r, n, e);
}
async function ce(o, t, e = 1) {
  let a = window.moment(),
    i = a.clone().subtract(1, "year").add(1, "day"),
    s = O(i, e, !1),
    r = O(a, e, !0);
  return o.getRangeData(t, s, r);
}
async function de(o, t, e, a, i = 1) {
  let s = window.moment([e, a]),
    r = s.clone().endOf("month"),
    n = O(s, i, !1),
    l = O(r, i, !0),
    p = 42,
    d = l.diff(n, "days") + 1;
  return (d < p && (l = l.clone().add(p - d, "days")), o.getRangeData(t, n, l));
}
async function Se(o, t, e, a, i = 1) {
  let s = window.moment([e, a]),
    r = s.clone().endOf("month"),
    n = O(s.clone().subtract(15, "days"), i, !1),
    l = O(r.clone().add(15, "days"), i, !0),
    p = await o.getRangeData(t, n, l);
  return (
    p.forEach((d) => {
      d.date && window.moment(d.date).month() !== a && (d.inYear = !1);
    }),
    p
  );
}
var U = class {
  constructor(t, e) {
    (this.app = t),
      (this.diaryService = e),
      (this.cellMap = new Map()),
      (this.lastData = []),
      (this.lastStatsData = []),
      (this.lastYear = 0),
      (this.lastThresholds = []),
      (this.lastColors = []),
      (this.lastDarkColors = []);
  }
  render(t, e, a, i, s, r, n, l, p, d, V = !1, J = !1, Z) {
    let D = document.body.classList.contains("theme-dark") ? n : r;
    (this.lastData = a),
      (this.lastStatsData = Z || a),
      (this.lastYear = i),
      (this.lastThresholds = s),
      (this.lastColors = r),
      (this.lastDarkColors = n),
      (t.empty(), e.empty(), this.cellMap.clear());
    let f = t.createDiv("diary-heatmap-grid-wrapper"),
      g = window.moment(),
      k = "";
    if (J) {
      let c = a.find((y) => y.inYear !== !1 && y.date);
      c && (k = window.moment(c.date).format("YYYY年M月"));
    } else if (i === g.year()) {
      let c = window.moment(`${i}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss"),
        y = Math.max(0, c.diff(g, "months")),
        w = Math.max(0, c.diff(g, "days")),
        $ = Math.max(0, c.diff(g, "hours"));
      k = `\u672C\u5E74\u5EA6\u5269\u4F59 ${y} \u6708 \xB7 ${w} \u5929 \xB7 ${$} \u5C0F\u65F6`;
    } else if (i < g.year()) {
      let c = window.moment(`${i}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss"),
        y = Math.max(0, g.diff(c, "days"));
      k = `\u8DDD\u79BB ${i} \u5E74\u5DF2\u8FC7\u53BB ${y} \u5929`;
    } else {
      let c = window.moment(`${i}-01-01 00:00:00`, "YYYY-MM-DD HH:mm:ss"),
        y = Math.max(0, c.diff(g, "days"));
      k = `\u8DDD\u79BB ${i} \u5E74\u8FD8\u6709 ${y} \u5929`;
    }
    f.createDiv("diary-heatmap-top-stats").createSpan({
      cls: "diary-heatmap-stats-text",
      text: k,
    });
    let _ = f.createDiv("diary-heatmap-grid"),
      H = Math.max(1, Math.floor(p / 14)),
      C = a.length,
      h = 1,
      u = 20,
      x = H,
      M = Math.ceil(C / x);
    (M > u && ((x = Math.ceil(C / u)), (M = u)),
      M < h && ((x = Math.ceil(C / h)), (M = h)),
      (_.style.gridTemplateColumns = V
        ? `repeat(${x}, minmax(12px, 1fr))`
        : `repeat(${x}, 12px)`),
      (_.style.gridAutoFlow = "row"));
    let F = new Map();
    a.forEach((c, y) => {
      if (c.date) {
        let w = window.moment(c.date).month();
        F.has(w) || F.set(w, y);
      }
    });
    let L = document.createDocumentFragment(),
      R = i === g.year();
    a.forEach((c, y) => {
      let w = document.createElement("div");
      w.className = "diary-heatmap-cell";
      let $ = K(c.wordCount, s);
      if (
        (w.classList.add(`level-${$}`),
        $ > 0 && D[$ - 1] && (w.style.backgroundColor = D[$ - 1]),
        w.setAttribute("data-date", c.date),
        w.setAttribute("data-count", String(c.wordCount)),
        c.date)
      ) {
        let te = window.moment(c.date).month();
        if (F.get(te) === y) {
          let j = document.createElement("span");
          ((j.className = "diary-heatmap-month-badge"),
            (!R || te !== g.month()) && j.classList.add("dimmed"),
            (j.textContent = String(te + 1)),
            w.appendChild(j));
        }
      }
      let me = c.date
        ? window.moment(c.date).format("M\u6708D\u65E5 dddd")
        : "";
      (w.setAttribute("data-tip", `${me}: ${c.wordCount}\u5B57`),
        c.inYear === !1
          ? w.classList.add("out-of-year")
          : c.exists
            ? w.classList.add("has-diary")
            : c.date
              ? w.classList.add("no-diary")
              : w.classList.add("empty-cell"),
        this.cellMap.set(c.date, w),
        L.appendChild(w));
    });
    let ee = x * M;
    for (let c = a.length; c < ee; c++) {
      let y = document.createElement("div");
      ((y.className = "diary-heatmap-cell empty-cell"), L.appendChild(y));
    }
    _.appendChild(L);
    _.addEventListener("click", (c) => {
      let y = c.target.closest(".diary-heatmap-cell");
      if (!y) return;
      let w = y.getAttribute("data-date"),
        $ = this.lastData.find((te) => te.date === w);
      $ &&
        $.date &&
        ($.exists
          ? this.diaryService.openDiary($.filePath)
          : $.inYear !== !1 && this.diaryService.createDiary($.date));
    });
    let N = (Z || a).reduce(
      (c, y) => (
        y.exists &&
          y.date &&
          window.moment(y.date).year() === i &&
          (c.diaryCount++, (c.totalWords += y.wordCount)),
        c
      ),
      { diaryCount: 0, totalWords: 0 },
    );
    f.createDiv("diary-heatmap-bottom-stats").createSpan({
      cls: "diary-heatmap-stats-text",
      text:
        `${i}\u5E74\u5EA6\u5171\u5199 ${N.diaryCount} \u7BC7\u65E5\u8BB0\u3002${d} \u7BC7\u5468\u8BB0\u3002\u5171\u8BA1 ${N.totalWords} \u5B57` +
        (i === g.year()
          ? `\u3002\u672C\u5E74\u5EA6\u8FD8\u5269\u4F59 ${Math.max(0, window.moment(`${i}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss").diff(g, "days"))} \u5929`
          : ""),
    });
    let W = f.createDiv("diary-heatmap-legend-row");
    W.createSpan({ cls: "diary-heatmap-legend-label", text: "\u5C11" });
    let pe = W.createDiv("diary-heatmap-legend-cells");
    for (let c = 1; c <= 6; c++) {
      let y = pe.createDiv("diary-heatmap-cell legend-cell");
      D[c - 1] && (y.style.backgroundColor = D[c - 1]);
    }
    (W.createSpan({ cls: "diary-heatmap-legend-label", text: "\u591A" }),
      e.appendChild(f));
  }
  updateCell(t) {
    let e = this.cellMap.get(t.date);
    if (!e) return;
    let a = document.body.classList.contains("theme-dark")
        ? this.lastDarkColors
        : this.lastColors,
      i = K(t.wordCount, this.lastThresholds);
    (e.className = "diary-heatmap-cell"),
      e.classList.add(`level-${i}`),
      (e.style.backgroundColor = ""),
      i > 0 && a[i - 1] && (e.style.backgroundColor = a[i - 1]),
      e.setAttribute("data-count", String(t.wordCount));
    let s = t.date
      ? window.moment(t.date).format("M\u6708D\u65E5 dddd")
      : "";
    e.setAttribute("data-tip", `${s}: ${t.wordCount}\u5B57`),
      t.inYear === !1
        ? e.classList.add("out-of-year")
        : t.exists
          ? e.classList.add("has-diary")
          : t.date
            ? e.classList.add("no-diary")
            : e.classList.add("empty-cell");
  }
  updateStats(t, e) {
    let g = window.moment(),
      a = (this.lastStatsData || this.lastData).reduce(
        (s, r) => (
          r.exists &&
            r.date &&
            window.moment(r.date).year() === this.lastYear &&
            (s.diaryCount++, (s.totalWords += r.wordCount)),
          s
        ),
        { diaryCount: 0, totalWords: 0 },
      ),
      i = t.querySelector(".diary-heatmap-bottom-stats span");
    i &&
      i.setText(
        `${this.lastYear}年度共写 ${a.diaryCount} 篇日记。${e} 篇周记。共计 ${a.totalWords} 字` +
          (this.lastYear === g.year()
            ? `。本年度还剩余 ${Math.max(0, window.moment(`${this.lastYear}-12-31 23:59:59`, "YYYY-MM-DD HH:mm:ss").diff(g, "days"))} 天`
            : ""),
      );
  }
};
var Z = class {
  constructor(t) {
    (this.diaryService = t),
      (this.cellMap = new Map()),
      (this.lastData = []),
      (this.lastYear = 0),
      (this.lastMonth = 0),
      (this.lastShowWeekNumbers = !0),
      (this.lastThresholds = []),
      (this.lastWeekStart = 1);
  }
  render(t, e, a, i, s, r, n, l) {
    (this.lastData = e),
      (this.lastYear = a.year()),
      (this.lastMonth = a.month()),
      (this.lastShowWeekNumbers = i),
      (this.lastThresholds = n),
      (this.lastWeekStart = l),
      t.empty(),
      this.cellMap.clear();
    let p = t.createDiv("diary-heatmap-calendar-wrapper"),
      d = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      v = [...d.slice(l), ...d.slice(0, l)],
      D = p.createDiv("diary-heatmap-calendar-header");
    (i && D.createDiv("diary-heatmap-calendar-header-spacer"),
      v.forEach((S) => {
        D.createDiv("diary-heatmap-calendar-weekday").setText(S);
      }));
    let f = p.createDiv("diary-heatmap-calendar-grid-area");
    i || f.classList.add("no-week-numbers");
    let g = this.groupByWeeks(e),
      k = document.createDocumentFragment();
    (g.forEach((S) => {
      let H = S.find((h) => h.date),
        C = 0,
        C2 = a.year();
      if (H) {
        let h2 = getWeekInfo(window.moment(H.date), l);
        ((C = h2.week), (C2 = h2.year));
      }
      if (i) {
        let h = document.createElement("div");
        if (
          ((h.className = "diary-heatmap-calendar-week-label"),
          C > 0 &&
            (h.classList.add("week-number"),
            h.setAttribute("data-week-num", String(C)),
            h.setAttribute("data-week-year", String(C2)),
            (h.textContent = String(C)),
            s.has(C)))
        ) {
          let u = r.get(C) || 0,
            x = this.getWeeklyDots(u, n),
            M = document.createElement("div");
          ((M.className = "weekly-dots"),
            x.forEach((F) => {
              let L = document.createElement("span");
              ((L.className = F ? "weekly-dot solid" : "weekly-dot"),
                M.appendChild(L));
            }),
            h.appendChild(M));
        }
        k.appendChild(h);
      }
      S.forEach((h) => {
        let u = document.createElement("div");
        if (((u.className = "diary-heatmap-calendar-cell"), !h.date)) {
          (u.classList.add("empty"), k.appendChild(u));
          return;
        }
        let x = window.moment(h.date),
          M = x.month() === a.month() && x.year() === a.year(),
          F = x.isSame(window.moment(), "day"),
          L = document.createElement("span");
        u.setAttribute("data-date", h.date);
        if (
          ((L.className = "day-number"),
          (L.textContent = x.format("D")),
          u.appendChild(L),
          h.exists)
        ) {
          let R = K(h.wordCount, n);
          (u.classList.add(`level-${R}`, "has-diary"),
            u.setAttribute(
              "data-tip",
              `${x.format("MMM D, dddd")}: ${h.wordCount}\u5B57`,
            ),
            u.setAttribute("data-file-path", h.filePath));
          let ee = this.getWeeklyDots(h.wordCount, n),
            N = document.createElement("div");
          ((N.className = "diary-dots"),
            ee.forEach((se) => {
              let W = document.createElement("span");
              ((W.className = se ? "diary-dot solid" : "diary-dot"),
                N.appendChild(W));
            }),
            u.appendChild(N));
        } else u.classList.add("no-diary");
        (M || u.classList.add("out-of-month"),
          F && u.classList.add("is-today"),
          this.cellMap.set(h.date, u),
          k.appendChild(u));
      });
    }),
      f.appendChild(k),
      f.addEventListener("click", (S) => {
        let H = S.target.closest(
          ".diary-heatmap-calendar-week-label.week-number",
        );
        if (H) {
          let C = parseInt(H.getAttribute("data-week-num")),
            yr = parseInt(H.getAttribute("data-week-year")) || this.lastYear;
          this.diaryService.openOrCreateWeeklyDiary(yr, C);
          return;
        }
        let ye = S.target.closest(".diary-heatmap-calendar-cell");
        if (!ye) return;
        let we = ye.getAttribute("data-date");
        if (!we) return;
        let ve = this.lastData.find((Re) => Re.date === we);
        if (!ve) return;
        ve.exists
          ? this.diaryService.openDiary(ve.filePath)
          : this.diaryService.createDiary(ve.date);
      }),
      f.addEventListener("contextmenu", (S) => {
        let H = S.target.closest(
          ".diary-heatmap-calendar-week-label.week-number",
        );
        if (H) {
          S.preventDefault();
          let C = parseInt(H.getAttribute("data-week-num")),
            yr = parseInt(H.getAttribute("data-week-year")) || this.lastYear;
          this.diaryService.showWeeklyContextMenu(S, yr, C);
          return;
        }
        let ye = S.target.closest(".diary-heatmap-calendar-cell");
        if (!ye) return;
        let we = ye.getAttribute("data-date");
        if (!we) return;
        let ve = this.lastData.find((Re) => Re.date === we);
        ve &&
          ve.exists &&
          (S.preventDefault(), this.diaryService.showCalendarContextMenu(S, ve));
      }));
    let E = e.reduce(
      (S, H) => {
        if (!H.date) return S;
        let C = window.moment(H.date);
        return (
          C.month() === a.month() &&
            C.year() === a.year() &&
            ((S.totalWords += H.wordCount), H.exists && S.diaryDays++),
          S
        );
      },
      { diaryDays: 0, totalWords: 0 },
    );
    p.createDiv("diary-heatmap-calendar-footer").createSpan({
      cls: "diary-heatmap-calendar-footer-text",
      text: `\u672C\u6708\u65E5\u8BB0 ${E.diaryDays} \u7BC7 \xB7 \u5171\u8BA1 ${E.totalWords} \u5B57`,
    });
  }
  updateCell(t) {
    let e = this.cellMap.get(t.date);
    if (!e) return;
    let a = window.moment(t.date),
      i = a.month() === this.lastMonth && a.year() === this.lastYear,
      s = a.isSame(window.moment(), "day");
    (e.className = "diary-heatmap-calendar-cell"),
      (e.innerHTML = ""),
      e.setAttribute("data-date", t.date),
      e.removeAttribute("data-tip"),
      e.removeAttribute("data-file-path"),
      i || e.classList.add("out-of-month"),
      s && e.classList.add("is-today");
    let r = document.createElement("span");
    ((r.className = "day-number"),
      (r.textContent = a.format("D")),
      e.appendChild(r));
    if (t.exists) {
      let n = K(t.wordCount, this.lastThresholds);
      e.classList.add(`level-${n}`, "has-diary"),
        e.setAttribute(
          "data-tip",
          `${a.format("MMM D, dddd")}: ${t.wordCount}\u5B57`,
        ),
        e.setAttribute("data-file-path", t.filePath);
      let l = this.getWeeklyDots(t.wordCount, this.lastThresholds),
        p = document.createElement("div");
      ((p.className = "diary-dots"),
        l.forEach((d) => {
          let v = document.createElement("span");
          ((v.className = d ? "diary-dot solid" : "diary-dot"),
            p.appendChild(v));
        }),
        e.appendChild(p));
    } else e.classList.add("no-diary");
  }
  updateStats(t, e) {
    let a = this.lastData.reduce(
        (i, s) => {
          if (!s.date) return i;
          let r = window.moment(s.date);
          return (
            r.month() === e.month() &&
              r.year() === e.year() &&
              ((i.totalWords += s.wordCount), s.exists && i.diaryDays++),
            i
          );
        },
        { diaryDays: 0, totalWords: 0 },
      ),
      i = t.querySelector(".diary-heatmap-calendar-footer span");
    i &&
      i.setText(
        `\u672C\u6708\u65E5\u8BB0 ${a.diaryDays} \u7BC7 \u00B7 \u5171\u8BA1 ${a.totalWords} \u5B57`,
      );
  }
  getWeeklyDots(t, e) {
    let a = [];
    for (let i of e)
      if (t >= i) a.push(!0);
      else {
        a.push(!1);
        break;
      }
    return a;
  }
  groupByWeeks(t) {
    let e = [],
      a = [];
    if (
      (t.forEach((s) => {
        (a.push(s), a.length === 7 && (e.push(a), (a = [])));
      }),
      a.length > 0)
    ) {
      for (; a.length < 7;)
        a.push({ date: "", wordCount: 0, exists: !1, filePath: "" });
      e.push(a);
    }
    let i = 6;
    for (; e.length < i;) {
      let s = [];
      for (let r = 0; r < 7; r++)
        s.push({ date: "", wordCount: 0, exists: !1, filePath: "" });
      e.push(s);
    }
    return e;
  }
};
var T = "diary-heatmap-view",
  Q = class extends b.ItemView {
    constructor(e, a) {
      super(e);
      this.data = [];
      this.calendarData = [];
      this.heatmapData = [];
      this.combinedHeatmapSection = null;
      this.refreshTimer = null;
      this.resizeTimer = null;
      this.isLoading = !1;
      this.resizeObserver = null;
      this.weeklyExistsInMonth = new Set();
      this.weeklyWordCounts = new Map();
      this.weeklyCountCache = new Map();
      this.keydownHandler = null;
      ((this.plugin = a),
        (this.currentYear = window.moment().year()),
        (this.calendarDate = window.moment()),
        (this.viewMode = this.plugin.settings.defaultView || "calendar"),
        (this.cache = new J(this.app)),
        (this.diaryService = new G(this.app, this.plugin, this.cache, () =>
          this.debouncedRefresh(),
        )),
        (this.heatmapRenderer = new U(this.app, this.diaryService)),
        (this.calendarRenderer = new Z(this.diaryService)));
    }
    getViewType() {
      return T;
    }
    getDisplayText() {
      return "Calendar Pro";
    }
    getIcon() {
      return "calendar";
    }
    async onOpen() {
      ((this.containerElRef = this.contentEl.createDiv(
        "diary-heatmap-container",
      )),
        this.renderHeader(),
        (this.loadingEl = this.containerElRef.createDiv(
          "diary-heatmap-loading",
        )),
        this.loadingEl.setText("\u52A0\u8F7D\u4E2D..."),
        (this.contentArea = this.containerElRef.createDiv()),
        (this.footerArea = this.containerElRef.createDiv()),
        await this.loadData(),
        (this.viewMode === "calendar" || this.viewMode === "combined") &&
          (await this.loadWeeklyExists()),
        this.loadingEl.hide(),
        await this.renderContent(),
        (this.resizeObserver = new ResizeObserver(() => {
          (this.viewMode === "heatmap" || this.viewMode === "combined") &&
            (this.resizeTimer && window.clearTimeout(this.resizeTimer),
            (this.resizeTimer = window.setTimeout(() => {
              requestAnimationFrame(() => this.renderHeatmapLayout());
            }, 150)));
        })),
        this.resizeObserver.observe(this.containerElRef),
        this.registerEvent(
          this.app.workspace.on("active-leaf-change", () => {
            this.highlightActiveDiary();
          }),
        ),
        this.highlightActiveDiary(),
        this.registerEvent(
          this.app.vault.on("create", (e) => {
            e instanceof b.TFile &&
              e.extension === "md" &&
              this.handleFileChange(e);
          }),
        ),
        this.registerEvent(
          this.app.vault.on("delete", (e) => {
            e instanceof b.TFile &&
              e.extension === "md" &&
              this.handleFileChange(e);
          }),
        ),
        this.registerEvent(
          this.app.vault.on("modify", (e) => {
            e instanceof b.TFile &&
              e.extension === "md" &&
              this.handleFileChange(e);
          }),
        ),
        this.registerEvent(
          this.app.vault.on("rename", (e, a) => {
            e instanceof b.TFile &&
              e.extension === "md" &&
              (this.cache.invalidate(a),
              this.cache.invalidate(e.path),
              this.weeklyCountCache.clear(),
              this.debouncedRefresh());
          }),
        ),
        this.containerElRef.setAttribute("tabindex", "0"),
        (this.keydownHandler = (e) => {
          e.key === "ArrowLeft"
            ? (e.preventDefault(),
              this.viewMode === "heatmap" &&
              !this.plugin.settings.heatmapMonthView
                ? this.currentYear--
                : this.calendarDate.subtract(1, "month"),
              this.debouncedRefresh())
            : e.key === "ArrowRight" &&
              (e.preventDefault(),
              this.viewMode === "heatmap" &&
              !this.plugin.settings.heatmapMonthView
                ? this.currentYear++
                : this.calendarDate.add(1, "month"),
              this.debouncedRefresh());
        }),
        this.containerElRef.addEventListener("keydown", this.keydownHandler));
    }
    async onClose() {
      (this.clearDebouncedRefresh(),
        this.resizeTimer &&
          (window.clearTimeout(this.resizeTimer), (this.resizeTimer = null)),
        this.resizeObserver &&
          (this.resizeObserver.disconnect(), (this.resizeObserver = null)),
        this.keydownHandler &&
          this.containerElRef &&
          (this.containerElRef.removeEventListener(
            "keydown",
            this.keydownHandler,
          ),
          (this.keydownHandler = null)),
        this.weeklyExistsInMonth.clear(),
        this.weeklyWordCounts.clear(),
        this.weeklyCountCache.clear(),
        this.contentEl.empty());
    }
    debouncedRefresh(o = 300) {
      (this.refreshTimer && window.clearTimeout(this.refreshTimer),
        (this.refreshTimer = window.setTimeout(() => {
          this.refresh();
        }, o)));
    }
    clearDebouncedRefresh() {
      this.refreshTimer &&
        (window.clearTimeout(this.refreshTimer), (this.refreshTimer = null));
    }
    async refresh() {
      if (!this.isLoading) {
        this.viewMode === "combined" &&
          (this.currentYear = this.calendarDate.year());
        ((this.isLoading = !0), this.loadingEl.show());
        try {
          (this.monthDisplayEl &&
            ((this.monthDisplayEl.style.display =
                this.viewMode === "heatmap" ? "none" : ""),
            this.monthDisplayEl.setText(
              this.calendarDate.clone().locale("en").format("MMM"),
            )),
            this.yearDisplayEl &&
              ((this.yearDisplayEl.style.display = ""),
              this.yearDisplayEl.setText(
                this.viewMode === "heatmap"
                  ? `${this.currentYear}`
                  : this.calendarDate.format("YYYY"),
              )),
            this.heatmapTab &&
              this.heatmapTab.classList.toggle(
                "active",
                this.viewMode === "heatmap",
              ),
            this.calendarTab &&
              this.calendarTab.classList.toggle(
                "active",
                this.viewMode === "calendar",
              ),
            this.combinedTab &&
              this.combinedTab.classList.toggle(
                "active",
                this.viewMode === "combined",
              ),
            this.updateTodayButtonState(),
            this.contentArea.empty(),
            this.footerArea.empty(),
            await this.loadData(),
            (this.viewMode === "calendar" || this.viewMode === "combined") &&
              (await this.loadWeeklyExists()),
            await this.renderContent());
          this.viewMode === "combined" &&
            setTimeout(() => this.renderHeatmapLayout(), 100);
        } catch (e) {
          console.error("[Diary Heatmap] Refresh failed:", e);
        } finally {
          (this.loadingEl.hide(),
            (this.isLoading = !1),
            this.highlightActiveDiary());
        }
      }
    }
    async loadWeeklyExists() {
      (this.weeklyExistsInMonth.clear(), this.weeklyWordCounts.clear());
      let e = await this.getConfig(),
        a = this.plugin.settings.weeklyFolder
          ? (0, b.normalizePath)(this.plugin.settings.weeklyFolder)
          : "",
        i = I(e),
        s = a || i,
        r = new Set(),
        n = [];
      for (let l of this.calendarData) {
        if (!l.date) continue;
        let p = window.moment(l.date),
          { year: D2, week: d } = getWeekInfo(
            p,
            this.plugin.settings.weekStart,
          );
        if (r.has(d)) continue;
        r.add(d);
        let v = [`${D2}-\u7B2C${d}\u5468.md`];
        (D2 !== this.calendarDate.year() &&
          v.push(`${this.calendarDate.year()}-\u7B2C${d}\u5468.md`),
          n.push(
            (async () => {
              for (let f of v) {
                let g = s ? (0, b.normalizePath)(`${s}/${f}`) : f,
                  { exists: k, wordCount: E } = await this.cache.getFileData(g);
                if (k) {
                  (this.weeklyExistsInMonth.add(d),
                    this.weeklyWordCounts.set(d, E));
                  break;
                }
              }
            })(),
          ));
      }
      await Promise.all(n);
    }
    updateTodayButtonState() {
      if (!this.todayBtn) return;
      let e = window.moment();
      this.todayBtn.setText(String(e.date()));
    }
    getSettings() {
      return this.plugin.settings;
    }
    async getConfig() {
      return await this.plugin.getEffectiveConfig();
    }
    getWeeklyCount(e) {
      let a = this.weeklyCountCache.get(e);
      if (a !== void 0) return a;
      let i = this.diaryService.countWeeklyNotes(
        e,
        this.plugin.settings.weeklyFolder,
      );
      return (this.weeklyCountCache.set(e, i), i);
    }
    jumpToToday() {
      ((this.calendarDate = window.moment()),
        (this.currentYear = window.moment().year()),
        this.debouncedRefresh());
    }
    renderHeader() {
      let a = this.containerElRef
          .createDiv("diary-heatmap-header")
          .createDiv("diary-heatmap-title-row"),
        i = a.createDiv("diary-heatmap-title-group"),
        s2 = i.createEl("button", { cls: "diary-heatmap-nav-btn" }),
        s = i.createEl("button", { cls: "diary-heatmap-nav-btn" });
      ((0, b.setIcon)(s2, "chevrons-left"),
        (0, b.setIcon)(s, "chevron-left"),
        (this.monthDisplayEl = i.createSpan({
          text: this.calendarDate.clone().locale("en").format("MMM"),
          cls: "diary-heatmap-month-text",
        })),
        (this.yearDisplayEl = i.createSpan({
          text:
            this.viewMode === "heatmap"
              ? `${this.currentYear}`
              : this.calendarDate.format("YYYY"),
          cls: "diary-heatmap-year-text",
        })));
      let r = i.createEl("button", { cls: "diary-heatmap-nav-btn" }),
        r2 = i.createEl("button", { cls: "diary-heatmap-nav-btn" });
      ((0, b.setIcon)(r, "chevron-right"),
        (0, b.setIcon)(r2, "chevrons-right"),
        s2.addEventListener("click", () => {
          (this.viewMode === "heatmap" &&
          !this.plugin.settings.heatmapMonthView
            ? this.currentYear--
            : this.calendarDate.subtract(1, "year"),
            this.debouncedRefresh());
        }),
        s.addEventListener("click", () => {
          (this.viewMode === "heatmap" &&
          !this.plugin.settings.heatmapMonthView
            ? this.currentYear--
            : this.calendarDate.subtract(1, "month"),
            this.debouncedRefresh());
        }),
        r.addEventListener("click", () => {
          (this.viewMode === "heatmap" &&
          !this.plugin.settings.heatmapMonthView
            ? this.currentYear++
            : this.calendarDate.add(1, "month"),
            this.debouncedRefresh());
        }),
        r2.addEventListener("click", () => {
          (this.viewMode === "heatmap" &&
          !this.plugin.settings.heatmapMonthView
            ? this.currentYear++
            : this.calendarDate.add(1, "year"),
            this.debouncedRefresh());
        }));
      (this.todayBtn = a.createEl("button", {
        cls: "diary-heatmap-nav-btn diary-heatmap-today-btn",
      })),
        this.todayBtn.setText(String(window.moment().date())),
        this.todayBtn.addEventListener("click", () => {
          ((this.calendarDate = window.moment()),
            (this.currentYear = window.moment().year()),
            this.debouncedRefresh(),
            this.diaryService.createDiary(
              window.moment().format("YYYY-MM-DD"),
            ));
        });
      let n = a.createDiv("diary-heatmap-tabs");
      ((this.calendarTab = n.createDiv({
        cls: `diary-heatmap-tab ${this.viewMode === "calendar" ? "active" : ""}`,
      })),
        (0, b.setIcon)(this.calendarTab, "calendar"),
        (this.heatmapTab = n.createDiv({
          cls: `diary-heatmap-tab ${this.viewMode === "heatmap" ? "active" : ""}`,
        })),
        (0, b.setIcon)(this.heatmapTab, "layout-grid"),
        (this.combinedTab = n.createDiv({
          cls: `diary-heatmap-tab ${this.viewMode === "combined" ? "active" : ""}`,
        })),
        (0, b.setIcon)(this.combinedTab, "layout-template"),
        this.calendarTab.addEventListener("click", () => {
          this.viewMode !== "calendar" &&
            ((this.viewMode = "calendar"), this.debouncedRefresh());
        }),
        this.heatmapTab.addEventListener("click", () => {
          this.viewMode !== "heatmap" &&
            ((this.viewMode = "heatmap"), this.debouncedRefresh());
        }),
        this.combinedTab.addEventListener("click", () => {
          this.viewMode !== "combined" &&
            ((this.viewMode = "combined"), this.debouncedRefresh());
        }));
    }
    async loadData() {
      let e = await this.getConfig();
      if (
        this.viewMode === "calendar" ||
        this.viewMode === "combined"
      ) {
        this.calendarData = await de(
          this.cache,
          e,
          this.calendarDate.year(),
          this.calendarDate.month(),
          this.plugin.settings.weekStart,
        );
      }
      if (
        this.viewMode === "heatmap" ||
        this.viewMode === "combined"
      ) {
        this.plugin.settings.heatmapMonthView
          ? ((this.currentYear = this.calendarDate.year()),
            (this.heatmapData = await Se(
              this.cache,
              e,
              this.calendarDate.year(),
              this.calendarDate.month(),
              this.plugin.settings.weekStart,
            )),
            (this.yearStatsData = await le(
              this.cache,
              e,
              this.currentYear,
              this.plugin.settings.weekStart,
            )))
          : (this.heatmapData =
              this.currentYear === window.moment().year() &&
              this.plugin.settings.defaultYear === "recent"
                ? await ce(
                    this.cache,
                    e,
                    this.plugin.settings.weekStart,
                  )
                : await le(
                    this.cache,
                    e,
                    this.currentYear,
                    this.plugin.settings.weekStart,
                  ));
      }
    }
    async renderContent() {
      if (this.viewMode === "heatmap") {
        let e = this.getWeeklyCount(this.currentYear);
        this.heatmapRenderer.render(
          this.contentArea,
          this.footerArea,
          this.heatmapData,
          this.currentYear,
          this.plugin.settings.thresholds,
          this.plugin.settings.colors,
          this.plugin.settings.darkColors,
          this.plugin.settings.weeklyFolder,
          this.containerElRef.clientWidth - 16,
          e,
          !1,
          this.plugin.settings.heatmapMonthView,
          this.plugin.settings.heatmapMonthView ? this.yearStatsData : void 0,
        );
      } else if (this.viewMode === "combined") {
        let e = this.getWeeklyCount(this.currentYear),
          a = document.createElement("div"),
          i = this.contentArea.createDiv(
            "diary-heatmap-combined-calendar",
          );
        this.calendarRenderer.render(
          i,
          this.calendarData,
          this.calendarDate,
          this.plugin.settings.showWeekNumbers,
          this.weeklyExistsInMonth,
          this.weeklyWordCounts,
          this.plugin.settings.thresholds,
          this.plugin.settings.weekStart,
        );
        (this.combinedHeatmapSection = this.contentArea.createDiv(
          "diary-heatmap-combined-heatmap",
        )),
          this.heatmapRenderer.render(
            a,
            this.combinedHeatmapSection,
            this.heatmapData,
            this.currentYear,
            this.plugin.settings.thresholds,
            this.plugin.settings.colors,
            this.plugin.settings.darkColors,
            this.plugin.settings.weeklyFolder,
            this.containerElRef.clientWidth - 16,
            e,
            !0,
            this.plugin.settings.heatmapMonthView,
            this.plugin.settings.heatmapMonthView ? this.yearStatsData : void 0,
          );
      } else
        this.calendarRenderer.render(
          this.contentArea,
          this.calendarData,
          this.calendarDate,
          this.plugin.settings.showWeekNumbers,
          this.weeklyExistsInMonth,
          this.weeklyWordCounts,
          this.plugin.settings.thresholds,
          this.plugin.settings.weekStart,
        );
    }
    renderHeatmapLayout() {
      var a;
      let e =
          (a = this.weeklyCountCache.get(this.currentYear)) != null ? a : 0;
      if (this.viewMode === "heatmap")
        this.heatmapRenderer.render(
          this.contentArea,
          this.footerArea,
          this.heatmapData,
          this.currentYear,
          this.plugin.settings.thresholds,
          this.plugin.settings.colors,
          this.plugin.settings.darkColors,
          this.plugin.settings.weeklyFolder,
          this.containerElRef.clientWidth - 16,
          e,
          !1,
          this.plugin.settings.heatmapMonthView,
          this.plugin.settings.heatmapMonthView ? this.yearStatsData : void 0,
        );
      else if (
        this.viewMode === "combined" &&
        this.combinedHeatmapSection
      ) {
        let i = document.createElement("div");
        this.combinedHeatmapSection.empty(),
          this.heatmapRenderer.render(
            i,
            this.combinedHeatmapSection,
            this.heatmapData,
            this.currentYear,
            this.plugin.settings.thresholds,
            this.plugin.settings.colors,
            this.plugin.settings.darkColors,
            this.plugin.settings.weeklyFolder,
            this.containerElRef.clientWidth - 16,
            e,
            !0,
            this.plugin.settings.heatmapMonthView,
            this.plugin.settings.heatmapMonthView ? this.yearStatsData : void 0,
          );
      }
    }
    isWeeklyNotePath(e) {
      if (!/^\d{4}-第\d{1,2}周\.md$/.test(e.name)) return !1;
      let t = this.plugin.settings.weeklyFolder
        ? (0, b.normalizePath)(this.plugin.settings.weeklyFolder)
        : "";
      return !t || e.path.startsWith(t + "/");
    }
    async handleFileChange(e) {
      if (!(e instanceof b.TFile && e.extension === "md")) return;
      let a = await this.getConfig(),
        i = this.pathToDate(e.path, a);
      if (!i) {
        this.isWeeklyNotePath(e) &&
          (this.cache.invalidate(e.path),
          this.weeklyCountCache.clear(),
          this.debouncedRefresh(3e3));
        return;
      }
      if ((this.cache.invalidate(e.path), !this.isDateInCurrentView(i)))
        return;
      await this.updateSingleDayData(i, a);
      let s = this.calendarData.find((r) => r.date === i),
        n = this.heatmapData.find((r) => r.date === i);
      this.viewMode === "heatmap" || this.viewMode === "combined"
        ? (n && this.heatmapRenderer.updateCell(n),
          this.heatmapRenderer.updateStats(
            this.viewMode === "combined"
              ? this.contentArea
              : this.footerArea,
            this.getWeeklyCount(this.currentYear),
          ))
        : null,
        this.viewMode === "calendar" || this.viewMode === "combined"
          ? (s && this.calendarRenderer.updateCell(s),
            this.calendarRenderer.updateStats(
              this.contentArea,
              this.calendarDate,
            ))
          : null,
        this.highlightActiveDiary();
    }
    pathToDate(e, a) {
      let i = I(a),
        s = e;
      if (i && s.startsWith(i + "/")) s = s.slice(i.length + 1);
      if (!s.endsWith(".md")) return null;
      let r = s.slice(0, -3),
        n = window.moment(r, Ce(a), !0);
      return n.isValid() ? n.format("YYYY-MM-DD") : null;
    }
    isDateInCurrentView(e) {
      let a = window.moment(e, "YYYY-MM-DD");
      if (!a.isValid()) return !1;
      if (this.viewMode === "calendar")
        return (
          a.year() === this.calendarDate.year() &&
          a.month() === this.calendarDate.month()
        );
      if (this.viewMode === "combined")
        return (
          (a.year() === this.calendarDate.year() &&
            a.month() === this.calendarDate.month()) ||
          a.year() === this.currentYear
        );
      if (
        this.currentYear === window.moment().year() &&
        this.plugin.settings.defaultYear === "recent"
      )
        return this.heatmapData.some((i) => i.date === e);
      return a.year() === this.currentYear;
    }
    async updateSingleDayData(e, a) {
      let i = window.moment(e, "YYYY-MM-DD"),
        s = await this.cache.getDayData(i, a),
        r = (n) => {
          let l = n.findIndex((p) => p.date === e);
          l !== -1 &&
            (n[l] = {
              date: e,
              wordCount: s.wordCount,
              exists: s.exists,
              filePath: s.filePath,
              inYear: n[l].inYear,
            });
        };
      (r(this.calendarData),
        r(this.heatmapData),
        this.yearStatsData && r(this.yearStatsData));
    }
    highlightActiveDiary() {
      let e = this.app.workspace.getActiveFile(),
        a = this.contentArea.querySelector(
          ".diary-heatmap-calendar-cell.is-active",
        );
      a && a.classList.remove("is-active");
      let i = this.contentArea.querySelector(
        ".diary-heatmap-calendar-week-label.is-active-week",
      );
      if ((i && i.classList.remove("is-active-week"), !e)) return;
      let s = this.contentArea.querySelector(
        `.diary-heatmap-calendar-cell[data-file-path="${e.path}"]`,
      );
      if (s) {
        s.classList.add("is-active");
        return;
      }
      let r = e.name.match(/^(\d{4})-第(\d{1,2})周\.md$/);
      if (r) {
        let n = parseInt(r[2]),
          l = this.contentArea.querySelector(
            `.diary-heatmap-calendar-week-label[data-week-num="${n}"]`,
          );
        l && l.classList.add("is-active-week");
      }
    }
  };
var X = class extends he.Plugin {
  async onload() {
    (await this.loadSettings(),
      (this._effectiveConfigCache = null),
      (this._effectiveConfigCacheTs = 0),
      console.log("[Calendar Pro] Plugin loaded v" + this.manifest.version),
      this.registerView(T, (t) => new Q(t, this)),
      this.addRibbonIcon("calendar", "Calendar Pro: 打开/创建今日日记", () => {
        this.openOrCreateTodayDiary();
      }),
      this.addCommand({
        id: "open-diary-heatmap",
        name: "\u6253\u5F00 Calendar Pro",
        callback: () => {
          this.activateHeatmapView();
        },
      }),
      this.addCommand({
        id: "close-diary-heatmap",
        name: "\u5173\u95ED Calendar Pro",
        callback: () => {
          this.closeHeatmapView();
        },
      }),
      this.addCommand({
        id: "jump-to-today",
        name: "\u8DF3\u8F6C\u5230\u4ECA\u5929",
        callback: () => {
          let t = this.app.workspace.getLeavesOfType(T);
          t.length > 0
            ? t[0].view.jumpToToday()
            : this.activateHeatmapView().then(() => {
                let e = this.app.workspace.getLeavesOfType(T);
                e.length > 0 && e[0].view.jumpToToday();
              });
        },
      }),
      this.addSettingTab(new q(this.app, this)),
      this.registerEvent(
        this.app.vault.on("modify", (t) => {
          t instanceof he.TFile &&
            (t.path === ".obsidian/daily-notes.json" ||
              t.path === ".obsidian/calendar-plugin.json") &&
            ((this._effectiveConfigCache = null),
              (this._effectiveConfigCacheTs = 0));
        }),
      ),
      this.app.workspace.layoutReady
        ? this.initLeaf()
        : this.app.workspace.onLayoutReady(() => {
            this.initLeaf();
          }));
  }
  onunload() {
    (this.app.workspace.detachLeavesOfType(T),
      console.log("[Calendar Pro] Plugin unloaded"));
  }
  async loadSettings() {
    let t = await this.loadData();
    ((this.settings = Object.assign({}, A, t)),
      (this.settings.thresholds = this.validateThresholds(
        this.settings.thresholds,
      )),
      (this.settings.colors = this.validateColors(this.settings.colors)),
      (this.settings.darkColors = this.validateColors(
        this.settings.darkColors,
      )));
  }
  validateThresholds(t) {
    if (!Array.isArray(t) || t.length !== 5) return [...A.thresholds];
    let e = t.map((a) => Math.max(1, Math.round(Number(a))));
    for (let a = 1; a < e.length; a++)
      e[a] <= e[a - 1] && (e[a] = e[a - 1] + 50);
    return e;
  }
  validateColors(t) {
    return !Array.isArray(t) || t.length !== 6
      ? [...A.colors]
      : t.map((e) =>
          typeof e == "string" && /^#[0-9A-Fa-f]{6}$/.test(e) ? e : "#999999",
        );
  }
  async saveSettings() {
    (await this.saveData(this.settings),
      (this._effectiveConfigCache = null),
      (this._effectiveConfigCacheTs = 0));
  }
  initLeaf() {
    let { workspace: t } = this.app;
    if (t.getLeavesOfType(T).length > 0) return;
    let e = t.getRightLeaf(!1);
    e && e.setViewState({ type: T });
  }
  openOrCreateTodayDiary() {
    let t = window.moment().format("YYYY-MM-DD"),
      e = this.app.workspace.getLeavesOfType(T),
      a =
        e.length > 0
          ? e[0].view.diaryService
          : new G(this.app, this, new J(this.app), () => {});
    a.createDiary(t);
  }
  async activateHeatmapView() {
    let { workspace: t } = this.app,
      e = t.getLeavesOfType(T);
    if (e.length > 0) {
      t.revealLeaf(e[0]);
      return;
    }
    let a = t.getRightLeaf(!1);
    a && (await a.setViewState({ type: T, active: !0 }), t.revealLeaf(a));
  }
  closeHeatmapView() {
    this.app.workspace.detachLeavesOfType(T);
  }
  async getEffectiveConfig() {
    if (this.settings.useCustomConfig)
      return {
        folder: this.settings.customFolder,
        format: this.settings.customFormat,
        template: "",
      };
    let t = Date.now();
    if (
      this._effectiveConfigCache &&
      t - this._effectiveConfigCacheTs < 3e4
    )
      return this._effectiveConfigCache;
    let e = await ne(this.app);
    return (
      (this._effectiveConfigCache = e), (this._effectiveConfigCacheTs = t), e
    );
  }
};
