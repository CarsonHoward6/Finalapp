import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // If credentials are not set or are placeholders, skip Supabase logic to allow app to run
    if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'your-project-url' ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
        return NextResponse.next({
            request,
        })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new Response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        // Fetch profile to check onboarding status
        // We select 'onboarding_completed' specifically
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        const isOnboarded = profile?.onboarding_completed === true
        const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
        const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
        const isRootPage = request.nextUrl.pathname === '/'

        // REDIRECT LOGIC
        // 1. If NOT onboarded and NOT on onboarding page -> Redirect to /onboarding
        //    (Skip if on root page, maybe? Usually landing page is fine.
        //     But prompt says "Only brand-new users should see onboarding".
        //     Let's assume we force them if they are logged in.)
        if (!isOnboarded && !isOnboardingPage) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }

        // 2. If ALREADY onboarded and ON onboarding page -> Redirect to /dashboard
        if (isOnboarded && isOnboardingPage) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    } else {
        // Not authenticated
        // Protect protected routes if necessary, but arguably that's a separate concern.
        // For now, let's just handle the onboarding logic which assumes a user exists.
        // But if a user tries to go to /onboarding without auth, they should probably be kicked to login.
        if (request.nextUrl.pathname.startsWith('/onboarding')) {
            const url = request.nextUrl.clone()
            url.pathname = '/login' // or root
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
