// Keeps the Pitlane sign-in fresh and sends signed-out visitors to the login page.
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await sb.auth.getUser();
  const path = req.nextUrl.pathname;
  if (!data.user && path.startsWith('/pitlane') && path !== '/pitlane/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/pitlane/login';
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ['/pitlane/:path*', '/api/pitlane/:path*'] };
