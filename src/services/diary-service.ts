import { App, TFile, Menu, Notice, normalizePath } from "obsidian";
import DiaryHeatmapPlugin from "../main";
import { HeatmapDayData, DataCache } from "../utils/heatmap-data";
import {
  getFolderPath,
  getDiaryFilePath,
  readTemplateContent,
} from "../utils/daily-notes-config";
import { ConfirmModal } from "../ui/confirm-modal";

export class DiaryService {
  constructor(
    private app: App,
    private plugin: DiaryHeatmapPlugin,
    private cache: DataCache,
    private onRefresh: () => void
  ) {}

  openDiary(filePath: string): void {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
    }
  }

  async createDiary(dateStr: string): Promise<void> {
    const config = await this.plugin.getEffectiveConfig();
    const date = window.moment(dateStr, "YYYY-MM-DD");
    const filePath = getDiaryFilePath(date, config);

    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof TFile) {
      this.app.workspace.getLeaf().openFile(existing);
      return;
    }

    const formattedDate = date.format("YYYY年M月D日");

    new ConfirmModal(
      this.app,
      `是否创建 ${formattedDate} 的日记？`,
      async () => {
        try {
          let content = "";
          if (config.template) {
            content = await readTemplateContent(this.app, config.template);
          }

          const dayOfWeek = date.format("dddd");
          content = content
            .replace(/\{\{date\}\}/g, formattedDate)
            .replace(/\{\{title\}\}/g, formattedDate)
            .replace(/\{\{time\}\}/g, date.format("HH:mm"))
            .replace(/\{\{date:([^}]+)\}\}/g, (_, fmt: string) => date.format(fmt))
            .replace(/\{\{time:([^}]+)\}\}/g, (_, fmt: string) => date.format(fmt))
            .replace(/\{\{yesterday\}\}/g, date.clone().subtract(1, "day").format("YYYY年M月D日"))
            .replace(/\{\{tomorrow\}\}/g, date.clone().add(1, "day").format("YYYY年M月D日"));

          if (!content.trim()) {
            content = "";
          }

          const folder = getFolderPath(config);
          if (folder && !(await this.app.vault.adapter.exists(folder))) {
            await this.app.vault.createFolder(folder);
          }

          const newFile = await this.app.vault.create(filePath, content);
          this.app.workspace.getLeaf().openFile(newFile);
          new Notice(`已创建日记: ${formattedDate}`);
        } catch (e) {
          console.error(`[Diary Heatmap] Failed to create diary:`, e);
          new Notice("创建日记失败");
        }
      }
    ).open();
  }

  async openOrCreateWeeklyDiary(year: number, week: number): Promise<void> {
    const { filePath, folder } = await this.getWeeklyFileInfo(year, week);

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
      return;
    }

    new ConfirmModal(
      this.app,
      `是否创建 ${year}年第${week}周的周记？`,
      async () => {
        try {
          const content = "";
          if (folder && !(await this.app.vault.adapter.exists(folder))) {
            await this.app.vault.createFolder(folder);
          }
          const newFile = await this.app.vault.create(filePath, content);
          this.app.workspace.getLeaf().openFile(newFile);
          new Notice(`已创建周记: ${year}年第${week}周`);
        } catch (e) {
          console.error(`[Diary Heatmap] Failed to create weekly note:`, e);
          new Notice("创建周记失败");
        }
      }
    ).open();
  }

  showCalendarContextMenu(evt: MouseEvent, dayData: HeatmapDayData): void {
    const file = this.app.vault.getAbstractFileByPath(dayData.filePath);
    if (!(file instanceof TFile)) return;

    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle("打开日记")
        .setIcon("file-text")
        .onClick(() => this.openDiary(dayData.filePath))
    );
    menu.addItem((item) =>
      item
        .setTitle("复制路径")
        .setIcon("copy")
        .onClick(() => {
          navigator.clipboard.writeText(dayData.filePath);
          new Notice("路径已复制到剪贴板");
        })
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle("删除日记")
        .setIcon("trash")
        .onClick(async () => {
          await this.app.fileManager.trashFile(file);
          this.cache.invalidate(dayData.filePath);
          this.onRefresh();
          new Notice("日记已移至回收站");
        })
    );
    menu.showAtMouseEvent(evt);
  }

  async showWeeklyContextMenu(
    evt: MouseEvent,
    year: number,
    week: number
  ): Promise<void> {
    const { filePath } = await this.getWeeklyFileInfo(year, week);

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setTitle("打开周记")
          .setIcon("file-text")
          .onClick(() => this.openDiary(filePath))
      );
      menu.addItem((item) =>
        item
          .setTitle("复制路径")
          .setIcon("copy")
          .onClick(() => {
            navigator.clipboard.writeText(filePath);
            new Notice("路径已复制到剪贴板");
          })
      );
      menu.addSeparator();
      menu.addItem((item) =>
        item
          .setTitle("删除周记")
          .setIcon("trash")
          .onClick(async () => {
            await this.app.fileManager.trashFile(file);
            this.onRefresh();
            new Notice("周记已移至回收站");
          })
      );
      menu.showAtMouseEvent(evt);
    } else {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setTitle("创建周记")
          .setIcon("plus")
          .onClick(() => this.openOrCreateWeeklyDiary(year, week))
      );
      menu.showAtMouseEvent(evt);
    }
  }

  private async getWeeklyFileInfo(
    year: number,
    week: number
  ): Promise<{ filePath: string; folder: string }> {
    const weeklyFolder = this.plugin.settings.weeklyFolder
      ? normalizePath(this.plugin.settings.weeklyFolder)
      : "";
    const config = await this.plugin.getEffectiveConfig();
    const diaryFolder = getFolderPath(config);
    const folder = weeklyFolder || diaryFolder;
    const fileName = `${year}-第${week}周.md`;
    const filePath = folder
      ? normalizePath(`${folder}/${fileName}`)
      : fileName;
    return { filePath, folder };
  }
}
