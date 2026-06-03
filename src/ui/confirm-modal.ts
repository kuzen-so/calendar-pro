import { App, Modal, ButtonComponent } from "obsidian";

/**
 * 确认对话框 Modal
 */
export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });

    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    new ButtonComponent(buttonContainer)
      .setButtonText("取消")
      .onClick(() => {
        this.close();
      });

    new ButtonComponent(buttonContainer)
      .setButtonText("创建")
      .setCta()
      .onClick(() => {
        this.onConfirm();
        this.close();
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
