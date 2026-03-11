import { ChatMessage } from '@/types';
import { Bot, User } from 'lucide-react';
import { ResultRenderer } from './ResultRenderer';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
    if (messages.length === 0) return null;

    return (
        <div className="w-full pt-4 md:pt-6">
            <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 md:px-6 pb-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm mt-1">
                                <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                        )}

                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end max-w-[85%]' : 'items-start w-full'}`}>
                            <div
                                className={`py-3 px-5 rounded-2xl shadow-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-transparent text-zinc-800 dark:text-zinc-200 rounded-bl-sm w-full'
                                    }`}
                            >
                                {msg.role === 'assistant' && msg.metadata ? (
                                    <ResultRenderer content={msg.content} metadata={msg.metadata} />
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-sm mt-1">
                                <User className="w-5 h-5 text-zinc-500" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
