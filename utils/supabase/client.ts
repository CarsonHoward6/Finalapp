import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton client instance
let client: SupabaseClient | Partial<SupabaseClient> | null = null;

// Check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!(url && url !== 'your-project-url' && url.match(/^https?:\/\//i));
}

// Create a mock client for when Supabase is not configured
function createMockClient(): Partial<SupabaseClient> {
    const mockAuth = {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signInWithOAuth: async () => ({ error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
    };

    const mockChannel = {
        on: () => mockChannel,
        subscribe: () => ({ unsubscribe: async () => {} }),
    };

    return {
        auth: mockAuth as any,
        from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }) as any,
        channel: () => mockChannel as any,
        removeChannel: async () => 'ok' as const
    };
}

// Lazy initialization getter
export function getSupabase() {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!client) {
        if (!isSupabaseConfigured()) {
            client = createMockClient();
        } else {
            client = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
        }
    }

    return client as SupabaseClient;
}

// For backwards compatibility
export function createClient() {
    return getSupabase();
}