import { createBrowserClient } from '@supabase/ssr'

// Check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!(url && url !== 'your-project-url' && url.match(/^https?:\/\//i));
}

// Create a mock client for when Supabase is not configured
function createMockClient(): any {
    const mockAuth = {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signInWithOAuth: async () => ({ error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
    };
    return { auth: mockAuth, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }) };
}

export function createClient() {
    if (!isSupabaseConfigured()) {
        return createMockClient();
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
