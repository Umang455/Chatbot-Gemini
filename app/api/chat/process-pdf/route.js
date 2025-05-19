import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const pdfFile = formData.get('pdf');

        if (!pdfFile) {
            return NextResponse.json(
                { message: 'PDF file is required' },
                { status: 400 }
            );
        }

        // Validate file type
        if (pdfFile.type !== 'application/pdf') {
            return NextResponse.json(
                { message: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (10MB limit)
        if (pdfFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { message: 'File size should be less than 10MB' },
                { status: 400 }
            );
        }

        try {
            // Convert the PDF file to buffer
            const bytes = await pdfFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create a temporary file path
            const tempFilePath = join(tmpdir(), `${Date.now()}-${pdfFile.name}`);

            // Write the buffer to a temporary file
            await writeFile(tempFilePath, buffer);

            // Load the PDF using LangChain's PDFLoader
            const loader = new PDFLoader(tempFilePath);
            const docs = await loader.load();

            // Split the text into chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

            const chunks = await textSplitter.splitDocuments(docs);

            // Combine all chunks into a single text
            const fullText = chunks.map(chunk => chunk.pageContent).join('\n\n');

            // Clean up the temporary file
            await unlink(tempFilePath);

            if (!fullText.trim()) {
                throw new Error('No text could be extracted from the PDF');
            }

            // Return the processed text
            return NextResponse.json({
                text: fullText,
                pages: docs.length,
                filename: pdfFile.name
            });

        } catch (parseError) {
            console.error('PDF parsing error:', parseError);
            return NextResponse.json(
                { message: 'Error parsing PDF: ' + parseError.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('PDF processing error:', error);
        return NextResponse.json(
            { message: 'Error processing PDF: ' + error.message },
            { status: 500 }
        );
    }
} 