/** 2秒後にカーソルを非表示に */
const TIMEOUT_MS = 2000;

/**
 * DOMに対して、カーソルを最後に動かしてから一定時間後にカーソルを消す処理を追加
 *
 * @param {HTMLElement} element
 * @returns {() => void} カーソルを表示し、DOMに追加した処理を削除するための関数
 */
export function registerCursorTimeout(element) {
  let timeoutId;

  const showCursorAndSetCursorTimeout = () => {
    element.style.cursor = 'inherit';

    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      element.style.cursor = 'none';
    }, TIMEOUT_MS);
  };

  element.addEventListener('pointermove', showCursorAndSetCursorTimeout);

  return () => {
    element.removeEventListener('pointermove', showCursorAndSetCursorTimeout);

    clearTimeout(timeoutId);

    element.style.cursor = 'inherit';
  };
}
