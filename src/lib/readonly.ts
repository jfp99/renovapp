/**
 * Read-only build flag.
 *
 * The hosted copy shared with a third party must not be able to change
 * anything: there is no local server behind it, so a write would only ever
 * corrupt that person's own browser copy while looking like it had saved.
 *
 * Set at build time:  NEXT_PUBLIC_READONLY=1 npm run build
 *
 * Two layers depend on it. The UI hides the write affordances, and
 * `freezeWrites()` neutralises the stores themselves — so a control that slips
 * through the UI pass still cannot mutate anything.
 */
export const IS_READONLY = process.env.NEXT_PUBLIC_READONLY === '1';
