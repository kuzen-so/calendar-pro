# Calendar Pro

日历视图结合热力图，支持日记与周记管理。

## 功能特性

- **双视图切换**：日历视图 + 热力图视图，一键切换
- **日记管理**：点击日期快速创建/打开日记，支持模板变量替换
- **周记支持**：独立的周记文件夹，周标签点击创建/打开周记
- **字数统计**：中日文字数统计，支持 frontmatter 自动过滤
- **阶梯圆点**：日历日期下方显示圆点标记，随字数增加逐步填满
- **热力图图例**：5 档颜色阈值，直观展示写作密度
- **键盘导航**：按 ← → 键快速切换月份/年份
- **深浅主题**：自动适配 Obsidian 浅色/深色主题

## 安装

### 方式一：BRAT（推荐）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 打开命令面板 → `BRAT: Add a beta plugin for testing`
3. 输入 `https://github.com/kuzen-so/calendar-pro`
4. 点击 `Add Plugin`

### 方式二：手动安装

1. 下载本仓库 Release 中的 `main.js`、`manifest.json`、`styles.css`
2. 在你的 Obsidian Vault 中创建文件夹 `.obsidian/plugins/calendar-pro/`
3. 将下载的 3 个文件放入该文件夹
4. 重启 Obsidian，在 **设置 → 社区插件** 中启用「Calendar Pro」

## 使用

- 点击左侧边栏的 **日历图标** 打开视图
- 点击日期格子打开/创建日记
- 右键有日记的日期可删除、复制路径
- 点击周标签数字打开/创建周记
- 按 `←` `→` 键切换月份/年份

## 设置

进入 **设置 → 第三方插件 → Calendar Pro → 选项**：

| 设置项 | 说明 |
|--------|------|
| 使用自定义日记配置 | 覆盖 Daily Notes 插件配置 |
| 日记文件夹 | 日记存放路径 |
| 日期格式 | moment.js 格式，如 `YYYY-MM-DD` |
| 周记文件夹 | 周记独立存放路径 |
| 周开始日 | 日历以周几作为一周起始 |
| 展现周数 | 日历左侧显示周数标签 |
| 热力图颜色阈值 | 5 档字数阈值，默认 50/150/300/500/800 |

## 命令面板

- `Calendar Pro: 打开 Calendar Pro`
- `Calendar Pro: 关闭 Calendar Pro`
- `Calendar Pro: 跳转到今天`

## 兼容性

- Obsidian 最低版本：v0.15.0
- 支持桌面端和移动端

## License

MIT
