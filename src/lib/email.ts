export const EMAIL_MAX_LENGTH = 254;

// HTML の input[type=email] と同じ形式をサーバーでも検証する。
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

export function isValidEmail(value: string) {
  return value.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(value);
}
