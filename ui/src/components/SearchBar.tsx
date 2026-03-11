import { Search, Send, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onAbort?: () => void;
    isLoading?: boolean;
}

export function SearchBar({ onSearch, onAbort, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setQuery('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-3xl mx-auto shadow-lg rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500/50">
            <div className="flex items-center px-4 py-3">
                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a legal question, find judgments, or upload a document..."
                    className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base py-6 h-auto px-4 !bg-transparent outline-none"
                />
                <div className="flex items-center gap-2 shrink-0">
                    {isLoading && onAbort ? (
                        <Button 
                            type="button" 
                            onClick={onAbort} 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 px-3 gap-1.5"
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Stop
                        </Button>
                    ) : (
                        <Button type="button" size="icon" variant="ghost" className="rounded-full text-zinc-500 hover:text-blue-600 transition-colors" title="Upload Document">
                            <FileText className="w-5 h-5" />
                        </Button>
                    )}
                    <Button type="submit" size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform active:scale-95" disabled={!query.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </form>
    );
}
