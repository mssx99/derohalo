import LocalStorage from 'browserStorage/localStorage';
import { getWalletAddress } from 'hooks/deroHooks';
import HaloButtonBase64 from './HaloButtonBase64';
import { FALLBACK_DELAY } from 'Constants';

export const createDefaultHaloButtonConfig = () => {
    return {
        tooltip: 'Chat with me!',
        fallbackUrl: LocalStorage.getFallbackUrl(),
        size: 50,
        action: 'OPEN_CHAT' as HaloButtonActionType,
        data: createNewDefaultChatButton(),
    };
};

export const createNewDefaultChatButton = () => {
    return { alias: 'MyAlias', address: getWalletAddress() ?? '' };
};

export const createNewDefaultScidButton = () => {
    return { scid: '' };
};

export const HALO_BUTTON_JSCODE = `function createDeroHaloButton(percentage = 100, fallbackUrl, tooltipText = 'Click Me!', action, data) {
    const FALLBACK_DELAY = ${FALLBACK_DELAY};
    const newSize = 200 * (percentage / 100);

    const button = document.createElement('button');
    button.className = 'button';
    button.setAttribute('draggable', false);
    button.style.position = 'relative';
    button.style.padding = '0';
    button.style.width = newSize + 'px';
    button.style.height = newSize + 'px';
    button.style.border = \`\${newSize / 50}px solid #888888\`;
    button.style.outline = 'none';
    button.style.backgroundColor = '#f4f5f6';
    button.style.borderRadius = newSize / 5 + 'px';
    button.style.boxShadow = '-6px -20px 35px #ffffff, -6px -10px 15px #ffffff, -20px 0px 30px #ffffff, 6px 20px 25px rgba(0, 0, 0, 0.2)';
    button.style.transition = '0.13s ease-in-out';
    button.style.cursor = 'pointer';
    button.style.boxSizing = 'border-box';
    button.style.WebkitTapHighlightColor = 'transparent';
    button.style.userSelect = 'none';
    button.setAttribute('title', tooltipText);

    const buttonContent = document.createElement('div');
    buttonContent.className = 'button__content';
    buttonContent.style.position = 'relative';
    buttonContent.style.display = 'flex';
    buttonContent.style.alignItems = 'center';
    buttonContent.style.justifyContent = 'center';
    buttonContent.style.padding = '6px';
    buttonContent.style.paddingTop = newSize / 10 + 'px';
    buttonContent.style.width = '100%';
    buttonContent.style.height = '100%';
    buttonContent.style.boxShadow = 'inset 0px -8px 0px #dddddd, 0px -8px 0px #f4f5f6';
    buttonContent.style.borderRadius = newSize / 5 + 'px';
    buttonContent.style.transition = '0.13s ease-in-out';
    buttonContent.style.zIndex = '1';
    buttonContent.style.boxSizing = 'border-box';
    buttonContent.style.WebkitTapHighlightColor = 'transparent';

    const buttonIcon = document.createElement('div');
    buttonIcon.className = 'button__icon';
    buttonIcon.style.position = 'relative';
    buttonIcon.style.display = 'flex';
    buttonIcon.style.transform = 'translate3d(0px, -4px, 0px)';
    buttonIcon.style.gridColumn = '4';
    buttonIcon.style.alignSelf = 'start';
    buttonIcon.style.justifySelf = 'end';
    buttonIcon.style.width = newSize * 0.9 + 'px';
    buttonIcon.style.height = newSize * 0.75 + 'px';
    buttonIcon.style.transition = '0.13s ease-in-out';

    const img = document.createElement('img');
    img.setAttribute('draggable', false);
    img.src = '${HaloButtonBase64}';
    img.style.width = newSize * 0.9 + 'px';
    img.style.height = newSize * 0.75 + 'px';
    img.style.userSelect = 'none';

    buttonIcon.appendChild(img);

    buttonContent.appendChild(buttonIcon);

    button.appendChild(buttonContent);

    button.addEventListener('mousedown', () => {
        button.style.boxShadow = 'none';
        buttonContent.style.boxShadow = 'none';
        buttonIcon.style.transform = 'translate3d(0px, 0px, 0px)';
    });

    function resetButtonStyle() {
        button.style.boxShadow = '-6px -20px 35px #ffffff, -6px -10px 15px #ffffff, -20px 0px 30px #ffffff, 6px 20px 25px rgba(0, 0, 0, 0.2)';
        buttonContent.style.boxShadow = 'inset 0px -8px 0px #dddddd, 0px -8px 0px #f4f5f6';
        buttonIcon.style.transform = 'translate3d(0px, -4px, 1000px)';
    }

    button.addEventListener('mouseup', resetButtonStyle);
    button.addEventListener('mouseleave', resetButtonStyle);
    button.addEventListener('mouseout', resetButtonStyle);

    const checkProtocolSupported = () =>
        new Promise((resolve, reject) => {
            var iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            var timeoutId = setTimeout(() => {
                window.removeEventListener('message', messageListener);
                document.body.removeChild(iframe);

                reject();
            }, FALLBACK_DELAY);

            const messageListener = (event) => {
                if (event.data !== 'derohalo supported') return;
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageListener);
                document.body.removeChild(iframe);

                resolve();
            };

            window.addEventListener('message', messageListener);

            iframe.src = 'web+derohalo:test';
        });

    const clickLink = (url) => {
        const link = document.createElement('a');
        link.href = url;
        link.style.display = 'none';
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    button.addEventListener('click', () => {
        urlSearchParams = \`action=\${encodeURIComponent(action)}&data=\${encodeURIComponent(JSON.stringify(data))}\`;
        checkProtocolSupported()
            .then(() => {
                clickLink(\`web+derohalo:\${urlSearchParams}\`);
            })
            .catch((e) => {
                clickLink(\`\${fallbackUrl}/?url=\${encodeURIComponent(urlSearchParams)}\`);
            });
    });

    return button;
}`;

export const getHaloButtonInsertCode = (percentage: number, fallbackUrl: string, tooltipText: string, action: string, data: IHaloButtonChatActionParameters | IHaloButtonScidActionParameters) => {
    return `const haloButton = createDeroHaloButton(${percentage}, \`${fallbackUrl}\`, \`${tooltipText}\`, '${action}', ${JSON.stringify(data)});
document.currentScript.parentNode.insertBefore(haloButton, document.currentScript.nextSibling);`;
};

export const getHaloButtonHtmlPage = (percentage: number, fallbackUrl: string, tooltipText: string, action: string, data: IHaloButtonChatActionParameters | IHaloButtonScidActionParameters) => `<html>
<head>
<script>
${HALO_BUTTON_JSCODE}
</script>
</head>
<body>
<script>
${getHaloButtonInsertCode(percentage, fallbackUrl, tooltipText, action, data)}
</script>
</body>
</html>`;
