"use client";

import { supabase } from "@/lib/supabase";
import { IconGif, IconGift, IconHash, IconMoodHappy, IconPlus, IconSticker2 } from "@tabler/icons-react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface user {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
}
interface Messages {
    id: number;
    sender: string;
    message: string;
    destination: string;
    created_at: string;
}

type UserCardProps = {
    selectedChannel: string;
    selectedChannelId: string;
    user?: user;
};

export default function MessagesPage({ selectedChannel, selectedChannelId, user }: UserCardProps) {
    const { serverId } = useParams();
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Messages[]>([]);
    const [users, setUsers] = useState<user[]>([])
    useEffect(() => {
        getMessage();
    }, [selectedChannelId])
    useEffect(() => {
        getUsers();
    }, [messages])

    useEffect(() => {
        const channel = supabase
            .channel("realtime-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `destination=eq.${selectedChannelId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Messages;

                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChannelId]);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !message || !selectedChannelId) {
            return;
        }
        const { data, error } = await supabase.from('messages').insert({ sender: user.id, message: message, destination: selectedChannelId })
        if (error) {
            alert(error.message);
            return;
        }
        // getMessage();
        setMessage('')
    }

    const getMessage = async () => {
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("destination", selectedChannelId)
            .order("created_at", { ascending: true })
            .limit(20);

        if (error) return;

        setMessages(data || []);
    };

    const getUsers = async () => {
        const senderIds = [...new Set(messages.map(m => m.sender))];

        if (!senderIds.length) return;

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .in("id", senderIds);

        if (error) return;

        setUsers(data || []);
    };

    return (
        <div className="flex flex-col flex-1 text-white pb-2 w-full h-full">

            {/* header */}
            <div className="h-10 flex items-center p-3 w-full border-b border-[#303034]">
                <div className="flex gap-3">
                    <IconHash stroke={2} size={20} color="gray" />{selectedChannel}
                </div>
            </div>

            {/* Messages Area */}
            <div ref={bottomRef} className="w-full h-full p-2 flex flex-col justify-end gap-5 overflow-y-auto scrollbar-minimal">

                {messages.map((message) => {
                    const user = users.find(u => u.id === message.sender);

                    return (
                        <div key={message.id} className="flex gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img src={user?.profile} className="h-full w-full object-cover" />
                            </div>

                            <div className="flex flex-col">
                                <div className="flex gap-3">
                                    <span className="text-sm font-semibold">{user?.username}</span>
                                    <span className="text-xs text-white/50">{format(new Date(message.created_at), "hh:mm a")}</span>
                                </div>
                                {message.message}
                            </div>
                        </div>
                    );
                })}

            </div>

            <div className="px-3 w-full h-15 items-center">
                <div className="flex px-3 gap-5 items-center rounded-md border border-[#303034] bg-[#222327] w-full h-full">
                    {/* add Files */}
                    <div className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer hover:bg-white/20 p-1 rounded-md">
                        <IconPlus stroke={2} />
                    </div>
                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="w-full h-full">
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message #${selectedChannel}`} className="w-full h-full focus:outline-0 font-thin text-white/60" />
                    </form>
                    {/* Extra Options */}
                    <div className="flex gap-2">
                        <div className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1 rounded-md">
                            <IconGift stroke={2} />
                        </div>
                        <div className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1 rounded-md">
                            <IconGif stroke={2} />
                        </div>
                        <div className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1 rounded-md">
                            <IconSticker2 stroke={2} />
                        </div>
                        <div className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1 rounded-md">
                            <IconMoodHappy stroke={2} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}