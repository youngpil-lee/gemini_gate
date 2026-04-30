import { App, Modal } from 'obsidian';
import { createWebviewTag } from './fns/createWebviewTag';
import { createIframe } from './fns/createIframe';
import { Platform } from 'obsidian';
import WebviewTag = Electron.WebviewTag;

export class GatePopupModal extends Modal {
    private url: string;
    private frame: WebviewTag | HTMLIFrameElement;
    private profileKey: string;

    constructor(app: App, url: string, profileKey?: string) {
        super(app);
        this.url = url;
        // OAuth 인증을 위해 부모 게이트와 동일한 세션 사용
        this.profileKey = profileKey || 'default';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('gate-popup-modal');
        // Simple header
        const header = contentEl.createDiv({ cls: 'gate-popup-header' });
        header.createEl('h3', { text: 'Quick View' }); // Localized: English

        const body = contentEl.createDiv({ cls: 'gate-popup-body' });
        // Use full height 
        body.style.height = '600px';
        body.style.width = '100%';

        const onReady = () => {
            // Frame ready
        };

        const options = {
            id: 'popup',
            title: 'Popup',
            icon: 'globe',
            url: this.url,
            // OAuth 인증을 위해 부모 게이트와 동일한 profileKey 사용
            profileKey: this.profileKey,
        };

        if (Platform.isMobileApp) {
            // @ts-ignore
            this.frame = createIframe(options, onReady);
        } else {
            // @ts-ignore
            this.frame = createWebviewTag(options, onReady, contentEl.doc);

            // 팝업 내에서 window.close()가 호출되거나 로그인이 완료되어 창이 닫혀야 할 때 모달도 함께 닫음
            (this.frame as WebviewTag).addEventListener('close', () => {
                this.close();
            });
        }

        body.appendChild(this.frame as unknown as HTMLElement);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
