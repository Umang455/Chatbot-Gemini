import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const chatId = params.id;

        // Verify the chat belongs to the user
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userId: session.user.id,
            },
        });

        if (!chat) {
            return NextResponse.json(
                { message: 'Chat not found' },
                { status: 404 }
            );
        }

        // Delete the chat
        await prisma.chat.delete({
            where: {
                id: chatId,
            },
        });

        return NextResponse.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Delete chat error:', error);
        return NextResponse.json(
            { message: 'Failed to delete chat' },
            { status: 500 }
        );
    }
} 