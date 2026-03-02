import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    const diagnostics = {
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : 'none',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'DeepSeek API key not found in environment',
        diagnostics,
        instructions: 'Add DEEPSEEK_API_KEY to .env.local file'
      }, { status: 500 });
    }
    
    // Test API connection
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to DeepSeek API',
        apiResponse: { status: response.status, error },
        diagnostics
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'DeepSeek API connection successful!',
      models: data,
      diagnostics,
      credits: '$9 available (approx 64,000 analyses)'
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      diagnostics: {
        apiKeyPresent: !!process.env.DEEPSEEK_API_KEY,
        error: error.toString()
      }
    }, { status: 500 });
  }
}
