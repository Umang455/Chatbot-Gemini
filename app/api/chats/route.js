import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            console.error('Unauthorized: No session or user ID found');
            return NextResponse.json(
                { message: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        const { title, messages } = await request.json();

        if (!title || !messages) {
            return NextResponse.json(
                { message: 'Title and messages are required' },
                { status: 400 }
            );
        }

        const chat = await prisma.chat.create({
            data: {
                title,
                messages: JSON.stringify(messages),
                userId: session.user.id,
            },
        });

        return NextResponse.json({
            ...chat,
            messages: JSON.parse(chat.messages)
        });
    } catch (error) {
        console.error('Save chat error:', error);
        return NextResponse.json(
            { message: 'Failed to save chat: ' + error.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            console.error('Unauthorized: No session or user ID found');
            return NextResponse.json(
                { message: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        const chats = await prisma.chat.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Parse the messages JSON string back to an object
        const parsedChats = chats.map(chat => ({
            ...chat,
            messages: JSON.parse(chat.messages)
        }));

        return NextResponse.json(parsedChats);
    } catch (error) {
        console.error('Get chats error:', error);
        return NextResponse.json(
            { message: 'Failed to get chats: ' + error.message },
            { status: 500 }
        );
    }
} 