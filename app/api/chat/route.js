import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyCEAyictrWgho4pBm4C9BDDly97WTrMhKk");

export async function POST(request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json(
                { message: 'Message is required' },
                { status: 400 }
            );
        }

        // Get the Gemini Pro model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate response
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { message: 'Failed to get response from Gemini' },
            { status: 500 }
        );
    }
} 