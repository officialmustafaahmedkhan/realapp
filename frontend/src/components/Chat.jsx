import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, LogOut, MessageSquare, User, Search, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function Chat() {
    const { user, logout } = useAuth();
    const { socket, isConnected } = useSocket();

    const [users, setUsers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Note: URL is relative now thanks to Proxy
        axios.get('/api/users')
            .then(res => setUsers(res.data.filter(u => u.id != user.id)))
            .catch(console.error);
    }, [user.id]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (message) => {
            if (activeChat && (message.sender_id === activeChat.id || message.sender_id === user.id)) {
                setMessages(prev => [...prev, message]);
            }
        };

        socket.on('receive_message', handleMessage);
        return () => socket.off('receive_message', handleMessage);
    }, [socket, activeChat, user.id]);

    useEffect(() => {
        if (activeChat) {
            axios.get(`/api/messages/${user.id}/${activeChat.id}`)
                .then(res => setMessages(res.data))
                .catch(console.error);
        }
    }, [activeChat, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !activeChat || !socket) return;

        socket.emit('send_message', {
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: input
        });
        setInput('');
    };

    return (
        <div className="w-full max-w-7xl h-[85vh] bg-slate-900 rounded-2xl shadow-2xl flex border border-slate-800 overflow-hidden animate-fade-in">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/50">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {user.email ? user.email[0].toUpperCase() : <User />}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-100 leading-tight">My Chat</h2>
                            <div className="flex items-center gap-1.5">
                                <Circle size={8} className={clsx("fill-current", isConnected ? "text-green-500" : "text-red-500")} />
                                <span className="text-xs text-slate-400">{isConnected ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input placeholder="Search contacts..." className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-300" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => setActiveChat(u)}
                            className={clsx(
                                "w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left group",
                                activeChat?.id === u.id
                                    ? "bg-cyan-500/10 border border-cyan-500/20"
                                    : "hover:bg-slate-800 border border-transparent"
                            )}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold group-hover:bg-slate-700 transition-colors">
                                    {u.email ? u.email[0].toUpperCase() : <User size={20} />}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={clsx("font-medium truncate", activeChat?.id === u.id ? "text-cyan-400" : "text-slate-200")}>
                                    {u.email || u.phone}
                                </p>
                                <p className="text-xs text-slate-500 truncate">Click to start chatting</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900 relative">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                                {activeChat.email ? activeChat.email[0].toUpperCase() : <User />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-100">{activeChat.email || activeChat.phone}</h3>
                                <p className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active Now</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                                    <MessageSquare size={48} className="mb-2" />
                                    <p>No messages yet. Say hello!</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === user.id;
                                return (
                                    <div key={idx} className={clsx("flex", isMe ? 'justify-end' : 'justify-start')}>
                                        <div className={clsx(
                                            "max-w-[70%] p-3.5 rounded-2xl shadow-sm relative group",
                                            isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                        )}>
                                            <p className="leading-relaxed">{msg.content}</p>
                                            <span className={clsx(
                                                "text-[10px] mt-1 block text-right opacity-70",
                                                isMe ? "text-cyan-100" : "text-slate-500"
                                            )}>
                                                {format(new Date(msg.timestamp), 'h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3 items-center">
                            <input
                                className="flex-1 bg-slate-900 text-white rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-slate-800 ring-offset-slate-950 transition-all placeholder:text-slate-600"
                                placeholder="Type your message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={!isConnected}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || !isConnected}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white p-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-600">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <MessageSquare size={40} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300">Start Messaging</h3>
                        <p className="text-slate-500 mt-2">Select a contact from the sidebar to connect.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
