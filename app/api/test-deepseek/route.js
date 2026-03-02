import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    const diagnostics = {
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : 'none',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'OpenRouter API key not found in .env.local',
        diagnostics,
        fix: 'Add OPENROUTER_API_KEY=your-key-here to .env.local'
      }, { status: 500 });
    }

    // Test OpenRouter connection
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid OpenRouter API key',
        diagnostics
      }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      status: 'success',
      message: 'OpenRouter API connection successful!',
      data,
      diagnostics
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      diagnostics: {
        error: error.toString()
      }
    }, { status: 500 });
  }
}
