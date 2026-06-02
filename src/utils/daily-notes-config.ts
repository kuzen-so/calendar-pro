import { App, normalizePath, Notice } from "obsidian";

export interface DailyNotesConfig {
  folder: string;
  format: string;
  template: string;
}

const DEFAULT_CONFIG: DailyNotesConfig = {
  folder: "",
  format: "YYYY-MM-DD",
  template: "",
};

export async function getDailyNotesConfig(app: App): Promise<DailyNotesConfig> {
  // 1. 尝试读取 Daily Notes 核心插件配置
  try {
    const configPath = normalizePath(".obsidian/daily-notes.json");
    if (await app.vault.adapter.exists(configPath)) {
      const content = await app.vault.adapter.read(configPath);
      const config = JSON.parse(content);
      return {
        folder: config.folder || "",
        format: config.format || "YYYY-MM-DD",
        template: config.template || "",
      };
    }
  } catch (e) {
    console.error("[Diary Heatmap] Failed to read daily-notes config:", e);
  }

  // 2. 尝试读取 Calendar 插件配置作为降级
  try {
    const calendarConfigPath = normalizePath(".obsidian/calendar-plugin.json");
    if (await app.vault.adapter.exists(calendarConfigPath)) {
      const content = await app.vault.adapter.read(calendarConfigPath);
      const config = JSON.parse(content);
      return {
        folder: config.dailyNotesFolder || "",
        format: config.dailyNoteFormat || "YYYY-MM-DD",
        template: "",
      };
    }
  } catch (e) {
    console.error("[Diary Heatmap] Failed to read calendar-plugin config:", e);
  }

  return { ...DEFAULT_CONFIG };
}

export function getDateFormat(config: DailyNotesConfig): string {
  return config.format || "YYYY-MM-DD";
}

export function getFolderPath(config: DailyNotesConfig): string {
  return config.folder ? normalizePath(config.folder) : "";
}

export function getDiaryFilePath(date: moment.Moment, config: DailyNotesConfig): string {
  const folder = getFolderPath(config);
  const format = getDateFormat(config);
  const fileName = date.format(format) + ".md";
  return folder ? normalizePath(`${folder}/${fileName}`) : fileName;
}

export async function readTemplateContent(app: App, templatePath: string): Promise<string> {
  if (!templatePath) return "";
  try {
    const normalized = normalizePath(templatePath);
    if (await app.vault.adapter.exists(normalized)) {
      return await app.vault.adapter.read(normalized);
    }
  } catch (e) {
    console.error("[Diary Heatmap] Failed to read template:", e);
    new Notice("日记模板读取失败");
  }
  return "";
}
