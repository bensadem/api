import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '*';

    // Handle CORS for all API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Handle normal requests
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        return response;
    }



    // Protect Dashboard Routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('admin_token');
        if (!token) {
            return NextResponse.redirect(new URL('/control-panel-access', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/dashboard/:path*'],
};
