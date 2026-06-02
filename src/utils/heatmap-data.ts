import { App, TFile } from "obsidian";
import { DailyNotesConfig, getDiaryFilePath } from "./daily-notes-config";

export interface HeatmapDayData {
  date: string;
  wordCount: number;
  exists: boolean;
  filePath: string;
  inYear?: boolean;
}

/**
 * 统计字数：中文字符 + 英文单词
 */
export function countWords(content: string): number {
  const withoutFrontmatter = content.replace(/^---\s*[\s\S]*?---\s*/, "");
  const cleanText = withoutFrontmatter
    .replace(/[#*\-\[\]\(\)!|`>_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const chineseChars = (cleanText.match(/[一-鿿]/g) || []).length;
  const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

/**
 * 根据字数获取热力等级
 */
export function getHeatLevel(wordCount: number, thresholds: number[]): number {
  if (wordCount === 0) return 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (wordCount <= thresholds[i]) return i + 1;
  }
  return thresholds.length + 1;
}

/**
 * 文件缓存项
 */
interface CacheEntry {
  wordCount: number;
  mtime: number;
}

/**
 * 数据缓存管理器
 * 基于 Vault 中实际文件的状态进行缓存，避免重复 IO
 */
export class DataCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private app: App) {}

  /**
   * 使指定路径的缓存失效
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取指定日期的日记数据（带缓存）
   */
  async getDayData(date: moment.Moment, config: DailyNotesConfig): Promise<{
    wordCount: number;
    exists: boolean;
    filePath: string;
  }> {
    const filePath = getDiaryFilePath(date, config);
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (!(file instanceof TFile)) {
      // 文件不存在，检查缓存中是否还有旧记录（可能刚被删除）
      if (this.cache.has(filePath)) {
        this.cache.delete(filePath);
      }
      return { wordCount: 0, exists: false, filePath };
    }

    const cached = this.cache.get(filePath);
    if (cached && cached.mtime === file.stat.mtime) {
      return { wordCount: cached.wordCount, exists: true, filePath };
    }

    try {
      const content = await this.app.vault.read(file);
      const wordCount = countWords(content);
      this.cache.set(filePath, { wordCount, mtime: file.stat.mtime });
      return { wordCount, exists: true, filePath };
    } catch (e) {
      console.error(`[Diary Heatmap] Failed to read ${filePath}:`, e);
      return { wordCount: 0, exists: true, filePath };
    }
  }

  /**
   * 批量获取日期范围的数据
   */
  async getRangeData(
    config: DailyNotesConfig,
    start: moment.Moment,
    end: moment.Moment,
    yearFilter?: number
  ): Promise<HeatmapDayData[]> {
    const result: HeatmapDayData[] = [];
    const current = start.clone();

    while (current.isSameOrBefore(end, "day")) {
      const dateStr = current.format("YYYY-MM-DD");
      const inYear = yearFilter !== undefined ? current.year() === yearFilter : true;

      if (inYear) {
        const { wordCount, exists, filePath } = await this.getDayData(current, config);
        result.push({ date: dateStr, wordCount, exists, filePath, inYear });
      } else {
        const filePath = getDiaryFilePath(current, config);
        result.push({ date: dateStr, wordCount: 0, exists: false, filePath, inYear: false });
      }

      current.add(1, "day");
    }

    return result;
  }
}

/**
 * 获取指定年份的完整热力图数据
 */
export async function getYearHeatmapData(
  cache: DataCache,
  config: DailyNotesConfig,
  year: number
): Promise<HeatmapDayData[]> {
  const startOfYear = window.moment(`${year}-01-01`, "YYYY-MM-DD");
  const endOfYear = window.moment(`${year}-12-31`, "YYYY-MM-DD");
  const start = startOfYear.clone().startOf("week");
  const end = endOfYear.clone().endOf("week");
  return cache.getRangeData(config, start, end, year);
}

/**
 * 获取近一年的热力图数据
 */
export async function getRecentYearHeatmapData(
  cache: DataCache,
  config: DailyNotesConfig
): Promise<HeatmapDayData[]> {
  const endDate = window.moment();
  const startDate = endDate.clone().subtract(1, "year").add(1, "day");
  const start = startDate.clone().startOf("week");
  const end = endDate.clone().endOf("week");
  return cache.getRangeData(config, start, end);
}

/**
 * 获取指定月份的热力图数据
 */
export async function getMonthHeatmapData(
  cache: DataCache,
  config: DailyNotesConfig,
  year: number,
  month: number
): Promise<HeatmapDayData[]> {
  const startOfMonth = window.moment([year, month]);
  const endOfMonth = startOfMonth.clone().endOf("month");
  const start = startOfMonth.clone().startOf("week");
  const end = endOfMonth.clone().endOf("week").add(1, "week");
  return cache.getRangeData(config, start, end);
}
