/** Email-safe header icons — SVG is stripped by Gmail/spam; emoji + table layout always renders. */

export const emailIconEmoji = {
  mail: '✉️',
  key: '🔑',
  shield: '🛡️',
  sparkles: '✨',
  bag: '🛍️',
  cart: '🛒',
  receipt: '🧾',
  check: '✅',
} as const

export type EmailIconKind = keyof typeof emailIconEmoji

export function getEmailIconEmoji(kind: EmailIconKind) {
  return emailIconEmoji[kind]
}
