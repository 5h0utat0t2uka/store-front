// Shopify のハンドルの上限。
const MAX_HANDLE_LENGTH = 255;
// ハンドルに含まれない空白・制御文字・パスの区切り文字。
const INVALID_HANDLE_CHARACTERS = /[\s/\\\p{Cc}]/u;

// URL のパラメーターは % エンコードされたまま渡されるため、復号してから検証する。
// 不正な値は Shopify に問い合わせず、キャッシュにも残さない。
export function parseHandle(param: string): string | null {
  let handle: string;
  try {
    handle = decodeURIComponent(param);
  } catch {
    return null;
  }
  if (handle.length === 0 || handle.length > MAX_HANDLE_LENGTH) return null;
  if (INVALID_HANDLE_CHARACTERS.test(handle)) return null;
  return handle;
}
