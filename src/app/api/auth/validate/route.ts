import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await request.json();
    
    console.log('🔍 DEBUG: Cookie validation request received');
    console.log('🔍 Cookies received length:', cookies?.length || 0);
    console.log('🔍 Cookies preview:', cookies?.substring(0, 100) || 'EMPTY');
    
    // Check if empty
    if (!cookies || cookies.trim().length === 0) {
      console.log('❌ Validation failed: No cookies');
      return Response.json({ 
        valid: false, 
        error: 'No cookies provided',
        details: 'Cookie string is empty'
      }, { status: 401 });
    }

    // Check for Gemini cookie patterns
    const hasGeminiCookie = cookies.includes('PSID') || 
                            cookies.includes('NID') || 
                            cookies.includes('__Secure');
    
    console.log('🔍 Has PSID:', cookies.includes('PSID'));
    console.log('🔍 Has NID:', cookies.includes('NID'));
    console.log('🔍 Has __Secure:', cookies.includes('__Secure'));
    console.log('🔍 Has Gemini cookie pattern:', hasGeminiCookie);

    if (!hasGeminiCookie) {
      console.log('❌ Validation failed: No Gemini cookie pattern found');
      return Response.json({ 
        valid: false, 
        error: 'Invalid cookie format',
        details: 'Cookies must contain PSID, NID, or __Secure tokens from gemini.google.com',
        received: cookies.substring(0, 100)
      }, { status: 401 });
    }

    console.log('✅ Validation successful: Gemini cookies detected');
    return Response.json({ 
      valid: true, 
      message: 'Cookies accepted',
      cookieLength: cookies.length
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    return Response.json({ 
      valid: false, 
      error: 'Validation error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
