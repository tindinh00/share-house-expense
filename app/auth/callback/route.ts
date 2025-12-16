import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${error.message}`);
    }
    
    // Redirect with success flag
    return NextResponse.redirect(`${requestUrl.origin}${next}?login=success`);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
