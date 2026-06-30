(function () {
    'use strict';

    const INPUT_ID = 'input';
    const TOGGLE_ID = 'mfp-toggle';
    const POPUP_ID = 'mfp-popup';
    const REPOSITION_EVENTS = ['resize', 'scroll', 'orientationchange', 'focusin', 'input'];
    const EDGE_GAP = 8;
    const FORM_EDGE_GAP = 8;

    let toggleBtn = null;
    let popupEl = null;
    let raf = 0;
    let listenersAttached = false;

    const formats = [
        { key: 'bold', label: 'B', code: '\x02', title: 'Bold', style: 'font-weight:bold' },
        { key: 'italic', label: 'I', code: '\x1D', title: 'Italic', style: 'font-style:italic' },
        { key: 'underline', label: 'U', code: '\x1F', title: 'Underline', style: 'text-decoration:underline' },
        { key: 'strikethrough', label: 'S', code: '\x1E', title: 'Strikethrough', style: 'text-decoration:line-through' },
        { key: 'monospace', label: 'M', code: '\x11', title: 'Monospace', style: 'font-family:monospace' },
        { key: 'color', label: '🎨', code: '', title: 'Colour', isColor: true },
        { key: 'reset', label: '✕', code: '\x0F', title: 'Reset formatting', isReset: true }
    ];

    const colors = [
        { code: '00', hex: '#FFFFFF', name: 'White' },
        { code: '01', hex: '#000000', name: 'Black' },
        { code: '02', hex: '#00007F', name: 'Blue' },
        { code: '03', hex: '#009300', name: 'Green' },
        { code: '04', hex: '#FF0000', name: 'Red' },
        { code: '05', hex: '#7F0000', name: 'Brown' },
        { code: '06', hex: '#9C009C', name: 'Purple' },
        { code: '07', hex: '#FC7F00', name: 'Orange' },
        { code: '08', hex: '#FFFF00', name: 'Yellow' },
        { code: '09', hex: '#00FC00', name: 'Lime' },
        { code: '10', hex: '#009393', name: 'Teal' },
        { code: '11', hex: '#00FFFF', name: 'Cyan' },
        { code: '12', hex: '#0000FC', name: 'Light Blue' },
        { code: '13', hex: '#FF00FF', name: 'Pink' },
        { code: '14', hex: '#7F7F7F', name: 'Grey' },
        { code: '15', hex: '#D2D2D2', name: 'Light Grey' }
    ];

    function getInput() {
        return document.getElementById(INPUT_ID);
    }

    function emitInput(textarea) {
        try {
            textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
        } catch (err) {
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function focusInput(textarea) {
        try {
            textarea.focus({ preventScroll: true });
        } catch (err) {
            textarea.focus();
        }
    }

    function stateAtCursor(textarea) {
        const text = textarea.value.slice(0, textarea.selectionStart || 0);
        const state = {
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            monospace: false,
            color: false,
            colorCode: null
        };

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === '\x02') {
                state.bold = !state.bold;
            } else if (char === '\x1D') {
                state.italic = !state.italic;
            } else if (char === '\x1F') {
                state.underline = !state.underline;
            } else if (char === '\x1E') {
                state.strikethrough = !state.strikethrough;
            } else if (char === '\x11') {
                state.monospace = !state.monospace;
            } else if (char === '\x0F') {
                state.bold = false;
                state.italic = false;
                state.underline = false;
                state.strikethrough = false;
                state.monospace = false;
                state.color = false;
                state.colorCode = null;
            } else if (char === '\x03') {
                const rest = text.slice(i + 1);
                const match = rest.match(/^(\d{1,2})(?:,(\d{1,2}))?/);

                if (match) {
                    state.color = true;
                    state.colorCode = match[1].padStart(2, '0');
                    i += match[0].length;
                } else {
                    state.color = false;
                    state.colorCode = null;
                }
            }
        }

        return state;
    }

    function updateActiveButtons() {
        if (!popupEl) return;

        const textarea = getInput();
        const state = textarea ? stateAtCursor(textarea) : {};
        const anyActive = Boolean(state.bold || state.italic || state.underline || state.strikethrough || state.monospace || state.color);

        popupEl.querySelectorAll('[data-mfp-key]').forEach((button) => {
            const key = button.dataset.mfpKey;
            const active = key === 'reset' ? false : Boolean(state[key]);
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (toggleBtn) {
            toggleBtn.classList.toggle('is-active', anyActive);
            toggleBtn.setAttribute('aria-pressed', anyActive ? 'true' : 'false');
        }
    }

    function insertAtSelection(textarea, insertText, selectStartOffset, selectEndOffset) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || start;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + insertText + value.substring(end);
        emitInput(textarea);

        const nextStart = start + selectStartOffset;
        const nextEnd = start + selectEndOffset;
        textarea.setSelectionRange(nextStart, nextEnd);
        focusInput(textarea);
        updateActiveButtons();
        schedulePosition();
    }

    function applyFormat(format) {
        const textarea = getInput();
        if (!textarea) return;

        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || start;
        const hasSelection = start !== end;
        const value = textarea.value;
        const selected = value.substring(start, end);

        if (format.isReset) {
            if (hasSelection) {
                const resetText = format.code + selected;
                textarea.value = value.substring(0, start) + resetText + value.substring(end);
                emitInput(textarea);
                textarea.setSelectionRange(start, start + resetText.length);
                focusInput(textarea);
                updateActiveButtons();
                schedulePosition();
            } else {
                insertAtSelection(textarea, format.code, format.code.length, format.code.length);
            }
            return;
        }

        if (hasSelection) {
            const wrapped = format.code + selected + format.code;
            textarea.value = value.substring(0, start) + wrapped + value.substring(end);
            emitInput(textarea);
            textarea.setSelectionRange(start, start + wrapped.length);
            focusInput(textarea);
            updateActiveButtons();
            schedulePosition();
            return;
        }

        // With no selection, behave like real IRC formatting: one tap starts a mode,
        // another tap inserts the same control code to end that mode.
        insertAtSelection(textarea, format.code, format.code.length, format.code.length);
    }

    function applyColor(color) {
        const textarea = getInput();
        if (!textarea) return;

        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || start;
        const hasSelection = start !== end;
        const value = textarea.value;
        const selected = value.substring(start, end);
        const prefix = '\x03' + color.code;
        const suffix = '\x03';

        if (hasSelection) {
            const wrapped = prefix + selected + suffix;
            textarea.value = value.substring(0, start) + wrapped + value.substring(end);
            emitInput(textarea);
            textarea.setSelectionRange(start, start + wrapped.length);
            focusInput(textarea);
        } else {
            // Colour starts a colour mode. Reset/another colour code can end/change it.
            textarea.value = value.substring(0, start) + prefix + value.substring(end);
            emitInput(textarea);
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
            focusInput(textarea);
        }

        hideColorView(popupEl);
        updateActiveButtons();
        schedulePosition();
    }

    function onPress(element, handler, options = {}) {
        const usePointerDown = options.pointerDown !== false;
        let lastPointer = 0;

        if (usePointerDown) {
            element.addEventListener('pointerdown', (event) => {
                if (event.button && event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                lastPointer = Date.now();
                handler(event);
                if (document.activeElement === element) element.blur();
            });
        }

        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (usePointerDown && Date.now() - lastPointer < 500) return;
            handler(event);
            if (document.activeElement === element) element.blur();
        });
    }

    function closePopup() {
        if (!popupEl) return;
        popupEl.remove();
        popupEl = null;
    }

    function setColorView(popup, open) {
        if (!popup) return;

        const colorView = popup.querySelector('.mfp-colors');
        const colorButton = popup.querySelector('[data-mfp-key=\"color\"]');

        colorView.hidden = !open;
        popup.dataset.colorOpen = open ? 'true' : 'false';

        if (colorButton) {
            colorButton.classList.toggle('is-color-open', open);
            colorButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        // Let the popup shrink/grow to the visible panel instead of keeping stale width.
        popup.style.width = 'auto';
        updateActiveButtons();
        schedulePosition();
    }

    function hideColorView(popup) {
        setColorView(popup, false);
    }

    function toggleColorView(popup) {
        setColorView(popup, popup?.dataset.colorOpen !== 'true');
    }

    function openPopup() {
        closePopup();

        const popup = document.createElement('div');
        popup.id = POPUP_ID;
        popup.className = 'mfp-popup';
        popup.dataset.colorOpen = 'false';
        popup.setAttribute('role', 'menu');
        popup.setAttribute('aria-label', 'IRC text formatting');

        const mainView = document.createElement('div');
        mainView.className = 'mfp-main';

        formats.forEach((format) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'mfp-btn';
            button.title = format.title;
            button.textContent = format.label;
            button.dataset.mfpKey = format.key;
            button.setAttribute('role', 'menuitem');
            button.setAttribute('aria-pressed', 'false');
            if (format.style) button.setAttribute('style', format.style);

            if (format.isColor) {
                button.setAttribute('aria-haspopup', 'true');
                button.setAttribute('aria-expanded', 'false');
                onPress(button, () => toggleColorView(popup), { pointerDown: false });
            } else {
                onPress(button, () => applyFormat(format));
            }

            mainView.appendChild(button);
        });

        const colorView = document.createElement('div');
        colorView.className = 'mfp-colors';
        colorView.hidden = true;

        const grid = document.createElement('div');
        grid.className = 'mfp-color-grid';

        colors.forEach((color) => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'mfp-swatch';
            swatch.title = color.name;
            swatch.style.backgroundColor = color.hex;
            swatch.setAttribute('aria-label', color.name);
            if (color.code === '00') swatch.classList.add('mfp-swatch-light');

            onPress(swatch, () => applyColor(color));
            grid.appendChild(swatch);
        });

        colorView.appendChild(grid);
        popup.appendChild(mainView);
        popup.appendChild(colorView);
        document.body.appendChild(popup);
        popupEl = popup;

        updateActiveButtons();
        schedulePosition();
    }

    function positionFloatingUi() {
        raf = 0;

        const input = getInput();
        const form = document.getElementById('form');
        if (!input || !form || !toggleBtn || !document.body.contains(input)) {
            closePopup();
            if (toggleBtn) toggleBtn.hidden = true;
            return;
        }

        toggleBtn.hidden = false;

        if (toggleBtn.parentElement !== form) {
            form.appendChild(toggleBtn);
        }

        const formRect = form.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const uploadRect = document.getElementById('upload')?.getBoundingClientRect();
        const submitRect = document.getElementById('submit')?.getBoundingClientRect();
        const buttonWidth = toggleBtn.offsetWidth || 34;
        const buttonHeight = toggleBtn.offsetHeight || 34;
        const viewportWidth = window.visualViewport?.width || window.innerWidth;
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const viewportLeft = window.visualViewport?.offsetLeft || 0;
        const viewportTop = window.visualViewport?.offsetTop || 0;
        const inputMidY = inputRect.top + (inputRect.height / 2);

        // Do not change The Lounge's input sizing. Overlay the toggle in the
        // natural action-button cluster, between upload and send when possible.
        const candidateCenters = [uploadRect, submitRect]
            .filter(Boolean)
            .map((rect) => rect.left + (rect.width / 2));
        let pageLeft;

        if (candidateCenters.length >= 2) {
            pageLeft = ((Math.min(...candidateCenters) + Math.max(...candidateCenters)) / 2) - (buttonWidth / 2);
        } else if (candidateCenters.length === 1) {
            pageLeft = candidateCenters[0] - buttonWidth - 10;
        } else {
            pageLeft = inputRect.right - buttonWidth - 6;
        }

        const pageTop = inputMidY - (buttonHeight / 2);
        const left = Math.max(FORM_EDGE_GAP, Math.min(pageLeft - formRect.left, formRect.width - buttonWidth - FORM_EDGE_GAP));
        const top = Math.max(FORM_EDGE_GAP, Math.min(pageTop - formRect.top, formRect.height - buttonHeight - FORM_EDGE_GAP));

        toggleBtn.style.left = left + 'px';
        toggleBtn.style.top = top + 'px';

        if (!popupEl) return;

        const toggleRect = toggleBtn.getBoundingClientRect();
        const popupWidth = popupEl.offsetWidth || 280;
        const popupHeight = popupEl.offsetHeight || 50;
        let popupLeft = toggleRect.left + (buttonWidth / 2) - (popupWidth / 2);
        let popupTop = toggleRect.top - popupHeight - 8;

        if (popupTop < viewportTop + EDGE_GAP) popupTop = toggleRect.bottom + 8;
        popupLeft = Math.max(viewportLeft + EDGE_GAP, Math.min(popupLeft, viewportLeft + viewportWidth - popupWidth - EDGE_GAP));
        popupTop = Math.max(viewportTop + EDGE_GAP, Math.min(popupTop, viewportTop + viewportHeight - popupHeight - EDGE_GAP));

        popupEl.style.left = popupLeft + 'px';
        popupEl.style.top = popupTop + 'px';
    }

    function schedulePosition() {
        if (raf) return;
        raf = window.requestAnimationFrame(positionFloatingUi);
    }

    function ensureToggle() {
        if (!getInput()) {
            if (toggleBtn) toggleBtn.hidden = true;
            return;
        }

        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.id = TOGGLE_ID;
            toggleBtn.className = 'mfp-toggle';
            toggleBtn.title = 'Text formatting';
            toggleBtn.setAttribute('aria-label', 'Text formatting');
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>';
            (document.getElementById('form') || document.body).appendChild(toggleBtn);

            onPress(toggleBtn, () => {
                if (popupEl) closePopup();
                else openPopup();
                schedulePosition();
            });
        }

        toggleBtn.hidden = false;
        attachListeners();
        updateActiveButtons();
        schedulePosition();
    }

    function attachListeners() {
        if (listenersAttached) return;
        listenersAttached = true;

        REPOSITION_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, () => {
                updateActiveButtons();
                schedulePosition();
            }, true);
        });

        document.addEventListener('selectionchange', updateActiveButtons);
        document.addEventListener('keyup', updateActiveButtons, true);
        document.addEventListener('click', updateActiveButtons, true);

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', schedulePosition);
            window.visualViewport.addEventListener('scroll', schedulePosition);
        }

        document.addEventListener('pointerdown', (event) => {
            if (!popupEl) return;
            if (popupEl.contains(event.target) || event.target === toggleBtn || toggleBtn.contains(event.target)) return;
            closePopup();
        }, true);
    }

    const observer = new MutationObserver(() => ensureToggle());

    function init() {
        ensureToggle();
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
}());
