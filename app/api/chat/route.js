import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Function to truncate text to a maximum length
function truncateText(text, maxLength = 4000) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { message, pdfText } = await request.json();

        if (!message) {
            return NextResponse.json(
                { message: 'Message is required' },
                { status: 400 }
            );
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Create a prompt that includes the PDF text if available
        let prompt = message;
        if (pdfText) {
            // Split the PDF text into chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 4000,
                chunkOverlap: 200,
            });

            const chunks = await textSplitter.splitText(pdfText);

            // Use the first chunk for now (you could implement more sophisticated chunk selection)
            const context = chunks[0];

            prompt = `Context from PDF: ${context}\n\nQuestion: ${message}\n\nPlease answer the question based on the PDF content. If the answer cannot be found in the PDF, please say so.`;
        }

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { message: 'Error processing request: ' + error.message },
            { status: 500 }
        );
    }
} 