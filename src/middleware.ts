import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要登入才能訪問的路徑
const protectedPaths = ['/dashboard'];

// 管理後台的域名（你的主網域）
const adminDomains = ['localhost', 'saas260120.vercel.app']; // 部署後改成你的域名

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // 取得主域名（去掉 port 和 www）
  const domain = hostname.split(':')[0].replace('www.', '');
  
  // 如果是管理後台域名，正常處理
  if (adminDomains.some(d => domain.includes(d))) {
    return NextResponse.next();
  }
  
  // 如果是其他域名（子網域站點），重寫到 /site/[domain] 路徑
  // 這會讓 mattress.brand-a.com 變成 /site/mattress.brand-a.com
  const url = request.nextUrl.clone();
  url.pathname = `/site/${domain}${pathname}`;
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
