export function formatRelativeTime(timestamp: string, language: string, now = Date.now()) {
  const elapsedSeconds = (new Date(timestamp).getTime() - now) / 1000;
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ] as const;
  const [, divisor] = units.find(([, seconds]) => Math.abs(elapsedSeconds) >= seconds) ?? units.at(-1)!;
  const unit = units.find(([, seconds]) => seconds === divisor)![0];
  return new Intl.RelativeTimeFormat(language, {numeric: 'auto'}).format(Math.round(elapsedSeconds / divisor), unit);
}
