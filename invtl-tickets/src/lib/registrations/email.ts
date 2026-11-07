// Pass emails, sent through Resend's HTTP API (no SDK needed).
// Set RESEND_API_KEY and verify theinvtl.com as a sending domain in Resend.
import 'server-only';
import { type EventView, type Registration, formatShowDate, padNo, siteUrl } from './server';

const FROM = process.env.PASS_EMAIL_FROM ?? 'INVTL <passes@theinvtl.com>';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function passEmailHtml(kind: 'confirm' | 'reminder', r: Registration, ev: EventView) {
  const d = formatShowDate(ev.dateISO);
  const link = `${siteUrl()}/pass/${r.pass_code}`;
  const heading = kind === 'confirm' ? `You're in, ${esc(r.first_name)}.` : `See you tomorrow, ${esc(r.first_name)}.`;
  const lead =
    kind === 'confirm'
      ? `Your pass for ${esc(ev.title)} is ready. Open it on your phone at the gate. Screenshots won't be accepted.`
      : `Gates open${ev.timeLabel ? ' at ' + esc(ev.timeLabel) : ''}. Open your pass before you arrive so it's ready when you pull up. The gate word appears on it in the morning.`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:11px 0;border-bottom:1px solid #2a2a2c;font:11px 'IBM Plex Mono',Menlo,monospace;letter-spacing:.12em;color:#8e8e93">${k}</td><td align="right" style="padding:11px 0;border-bottom:1px solid #2a2a2c;font:13px 'IBM Plex Mono',Menlo,monospace;color:#fff">${v}</td></tr>`;
  const party = `${r.party_size} ${r.party_size > 1 ? 'GUESTS' : 'GUEST'}`;

  return `<!doctype html><html><body style="margin:0;background:#000;color:#fff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#000;border:1px solid #1d1d1f">
<tr><td align="center" style="padding:30px 20px 22px;font:700 22px 'Space Grotesk',Helvetica,Arial,sans-serif;letter-spacing:.32em;color:#fff">INVTL</td></tr>
${ev.image ? `<tr><td><img src="${esc(ev.image)}" width="600" alt="" style="display:block;width:100%;height:auto;max-height:260px;object-fit:cover"></td></tr>` : ''}
<tr><td style="padding:30px 30px 34px;font-family:'Space Grotesk',Helvetica,Arial,sans-serif">
<h1 style="margin:0 0 10px;font-size:30px;line-height:1.1;color:#fff">${heading}</h1>
<p style="margin:0 0 22px;color:#cfcfd2;font-size:15px;line-height:1.5">${lead}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2a2a2c;margin-bottom:26px">
${row('PASS', 'Nº ' + padNo(r.pass_number))}
${row('EVENT', esc(ev.title.toUpperCase()))}
${row('DATE', `${d.short} ${d.dots}${ev.timeLabel ? ' · ' + esc(ev.timeLabel) : ''}`)}
${ev.venue ? row('VENUE', esc(ev.venue.toUpperCase())) : ''}
${row('PARTY', party)}
</table>
<a href="${link}" style="display:block;text-align:center;background:#fff;color:#000;font:700 14px 'Space Grotesk',Helvetica,Arial,sans-serif;letter-spacing:.2em;padding:18px;text-decoration:none">OPEN MY PASS</a>
<p style="margin:18px 0 0;font-size:13px;color:#8e8e93">Tip: open the pass, then add it to your home screen so it's one tap away on the day.</p>

<p style="margin:14px 0 0;padding:12px 14px;border:1px solid #fff;font-size:13px;color:#cfcfd2"><b style="color:#fff">SHOW ENTRY ONLY.</b> This ticket gets you into the show as a guest. It does not register a car for display and does not include parking.</p>
</td></tr>
<tr><td style="border-top:1px solid #1d1d1f;padding:18px 30px;font:11px 'IBM Plex Mono',Menlo,monospace;color:#8e8e93;letter-spacing:.1em">@THEINVTL &nbsp;·&nbsp; THEINVTL.COM</td></tr>
<tr><td style="padding:0 30px 18px;font:9.5px 'IBM Plex Mono',Menlo,monospace;color:#6e6e73;letter-spacing:.14em">CREATED FOR INVTL BY &nbsp;<img src="${siteUrl()}/torq-technologies.png" alt="TorqTechnologies" height="14" style="height:14px;width:auto;vertical-align:middle;opacity:.8"></td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendPassEmail(kind: 'confirm' | 'reminder', r: Registration, ev: EventView) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: 'RESEND_API_KEY is not set' };
  const subject =
    kind === 'confirm' ? `Your INVTL pass — Nº ${padNo(r.pass_number)}` : `Tomorrow: INVTL — your pass inside`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: r.email, subject, html: passEmailHtml(kind, r, ev) }),
  });
  if (!res.ok) return { ok: false as const, error: `Email failed (${res.status}): ${await res.text()}` };
  return { ok: true as const };
}
