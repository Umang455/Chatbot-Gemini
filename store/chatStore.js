import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatStore = create(
    persist(
        (set) => ({
            messages: [],
            savedChats: [],
            setMessages: (messages) => set({ messages }),
            addMessage: (message) => set((state) => ({
                messages: [...state.messages, message]
            })),
            clearMessages: () => set({ messages: [] }),
            saveChat: (chat) => set((state) => ({
                savedChats: [...state.savedChats, chat]
            })),
            removeSavedChat: (chatId) => set((state) => ({
                savedChats: state.savedChats.filter(chat => chat.id !== chatId)
            })),
        }),
        {
            name: 'chat-storage',
        }
    )
);

export default useChatStore; 