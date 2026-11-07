// Per-pass manifest so "Add to Home Screen" opens this guest's own pass, not the homepage.
// Uses your existing favicon/icon files; replace the icon paths if yours differ.
export const dynamic = 'force-dynamic';

export function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = /^[a-z0-9]{8,32}$/i.test(params.code) ? params.code : '';
  return Response.json(
    {
      name: 'INVTL Pass',
      short_name: 'INVTL Pass',
      start_url: `/pass/${code}`,
      scope: `/pass/${code}`,
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
