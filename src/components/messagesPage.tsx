"use client";

import { supabase } from "@/lib/supabase";
import { IconBellFilled, IconCheckFilled, IconGif, IconGift, IconHash, IconMoodHappy, IconPinFilled, IconPlus, IconSticker2, IconUser, IconUserFilled, IconXFilled } from "@tabler/icons-react";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

interface user {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
}

interface friend {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
    // chatId: string;
    friend?: user;
}

interface Messages {
    id: number;
    sender: string;
    message: string;
    destination: string;
    created_at: string;
}

interface DirectMessages {
    id: number;
    senderId: string;
    receiverId: string;
    message: string;
    created_at: string;
}

interface Server {
    id: string;
    name: string;
    icon: string;
}

type UserCardProps = {
    selectedChannel: string;
    selectedChannelId: string;
    user?: user;
    selectedServer: Server;
    selectedFriend: friend;
};

export default function MessagesPage({ selectedChannel, selectedChannelId, user, selectedServer, selectedFriend }: UserCardProps) {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Messages[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessages[]>([]);
    const [users, setUsers] = useState<user[]>([]);
    const [showUsers, setShowUsers] = useState(false);
    const [serverUsers, setServerUsers] = useState<user[]>([]);
    const [searchFriend, setSearchFriend] = useState('');
    const [friendsUI, setFriendsUI] = useState('pending');
    const [searchFriendResult, setSearchFriendResult] = useState<user[]>([]);
    const [pendingRequest, setPendingRequest] = useState<friend[]>([]);
    const [receivedRequest, setReceivedRequest] = useState<friend[]>([]);
    const [chatId, setChatId] = useState('');

    useEffect(() => {
        getUsers();
    }, [messages, directMessages])

    useEffect(() => {
        if (!user) { return }
        const fetchChatId = async () => {
            const { data, error } = await supabase
                .from("friends")
                .select("chatId")
                .or(
                    `and(userId.eq.${user.id},friendId.eq.${selectedFriend.id}),and(userId.eq.${selectedFriend.id},friendId.eq.${user.id})`
                )
                .single();
            if (error) {
                console.log("error:", JSON.stringify(error, null, 2));
                return;
            }
            if (data) {
                setChatId(data.chatId);
                // alert(JSON.stringify(data))
            }
        };

        fetchChatId();
    }, [selectedFriend])

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("destination", selectedChannelId)
                .order("created_at");

            setMessages(data || []);
        };

        fetchMessages();
    }, [selectedChannelId]);
    useEffect(() => {
        const channel = supabase
            .channel(`messages-${selectedChannelId}`)
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

    // DM's

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) {
                return;
            }
            const { data } = await supabase
                .from("directMessage")
                .select("*")
                .or(`senderId.eq.${user.id},receiverId.eq.${user.id}`)
                .order("created_at");

            setDirectMessages(data || []);
        };

        fetchMessages();
    }, [selectedFriend]);
    useEffect(() => {
        const channel = supabase
            .channel(`messages-${selectedChannelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "directMessage",
                    filter: `destination=eq.${selectedChannelId}`,
                },
                (payload) => {
                    const newMessage = payload.new as DirectMessages;

                    setDirectMessages((prev) => {
                        if (prev.some((m) => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedFriend]);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !message) {
            alert('user or message is null')
            return;
        }
        if (selectedServer.id == 'Me' && selectedFriend) {
            const { data, error } = await supabase.from('directMessage').insert({ senderId: user.id, message: message, chatId: chatId })
            if (error) {
                alert(error.message);
                return;
            }
        }
        if (selectedServer.id != 'Me' && selectedChannel) {
            const { data, error } = await supabase.from('messages').insert({ sender: user.id, message: message, destination: selectedChannelId })
            if (error) {
                alert(error.message);
                return;
            }
        }
        // getMessage();
        setMessage('')
    }

    useEffect(() => {
        if (!chatId) return;

        // 1. Initial fetch
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("directMessage")
                .select("*")
                .eq("chatId", chatId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Fetch error:", JSON.stringify(error));
                return;
            }

            setDirectMessages(data || []);
        };

        fetchMessages();

        // 2. Realtime subscription
        const channel = supabase
            .channel(`chat-${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "directMessage",
                    filter: `chatId=eq.${chatId}`,
                },
                (payload) => {
                    const newMessage = payload.new as DirectMessages;

                    // Avoid duplicates (important)
                    setDirectMessages((prev) => {
                        if (prev.find((m) => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe();

        // 3. Cleanup (people forget this and leak memory)
        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId]);


    const getUsers = async () => {

        if (selectedServer.id == 'Me' && selectedFriend) {
            const senderIds = [...new Set(directMessages.map(m => m.senderId))];

            if (!senderIds.length) return;
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .in("id", senderIds);

            if (error) return;
            setUsers(data || []);
        }

        if (selectedServer.id != 'Me' && selectedChannel) {
            const senderIds = [...new Set(messages.map(m => m.sender))];

            if (!senderIds.length) return;
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .in("id", senderIds);

            if (error) return;
            setUsers(data || []);
        }
    };

    useEffect(() => { getServerUsers() }, [selectedServer])

    const getServerUsers = async () => {
        if (selectedServer.id == 'Me') {
            return;
        }
        const { data: members, error } = await supabase.from('members').select('userId').eq('serverId', selectedServer.id)
        if (error) {
            alert("server user says: " + error.message);
        }

        const userIds = members?.map(m => m.userId) || [];

        const { data: userData, error: userError } = await supabase.from('users').select('*').in('id', userIds)
        if (userError) {
            alert("server user's data says:" + userError.message);
        }
        setServerUsers(userData || []);

        // alert(JSON.stringify(userData))
    }

    const handleSearchFriend = async () => {
        const { data, error } = await supabase.from('users').select('*').ilike('username', `%${searchFriend}%`).limit(10);
        if (error) {
            alert("Search Friend says:" + error.message);
        }
        console.log(JSON.stringify(data));

        setSearchFriendResult(data ?? []);
    }

    const handleFriendRequest = async (friendId: string) => {
        if (!user?.id || !friendId) {
            return;
        }
        const { data, error } = await supabase.from('friends').insert({ userId: user.id, friendId: friendId, status: 'pending' });
        if (error) {
            alert("Search Friend says:" + error.message);
        }
        setSearchFriend('')
        setSearchFriendResult([])
    }

    useEffect(() => { handlePendingRequest(); }, [])

    const handlePendingRequest = async () => {
        if (!user?.id) {
            return;
        }
        const { data } = await supabase
            .from("friends")
            .select(`
                friend:users!friends_friendId_fkey (
                    id,
                    email,
                    username,
                    refcode,
                    profile
                    )
                `)
            .eq("userId", user?.id).eq('status', 'pending') as { data: friend[] | null };
        setPendingRequest(data ?? []);

        const { data: received } = await supabase
            .from("friends")
            .select(`
                friend:users!friends_userId_fkey (
                    id,
                    email,
                    username,
                    refcode,
                    profile
                    )
                `)
            .eq("friendId", user?.id).eq('status', 'pending') as { data: friend[] | null };
        setReceivedRequest(received ?? []);
    }

    const cancelSentRequest = async (friendId: string) => {
        if (!user?.id) {
            return;
        }
        const { data } = await supabase
            .from("friends")
            .delete().eq('userId', user.id).eq('friendId', friendId);
        handlePendingRequest()
    }
    const acceptReceivedRequest = async (friendId: string) => {
        if (!user?.id) {
            return;
        }
        const { data, error } = await supabase
            .from("friends")
            .update({ status: 'accepted' }).eq('friendId', user.id).eq('userId', friendId);

        if (error) {
            alert(error.message)
        }
        handlePendingRequest()
    }

    return (
        <div className="flex flex-1 flex-col text-white pb-2 w-full h-full">
            {/* header */}
            <div className="h-12 flex items-center p-3 w-full border-b border-[#303034] place-content-between">
                {selectedServer.id != 'Me' && (<div className="flex gap-3">
                    <div className="w-6 h-6 overflow-hidden rounded-full">
                        <IconHash stroke={2} size={20} color="gray" />
                    </div>
                    {selectedChannel}
                </div>)}

                {selectedServer.id == 'Me' && selectedFriend && (<div className="flex gap-3">
                    <div className="w-6 h-6 overflow-hidden rounded-full">
                        <img src={selectedFriend.profile} alt="" className="w-full h-full object-cover" />
                    </div>
                    {selectedFriend.username}
                    {/* {chatId} */}
                </div>)}

                {selectedServer.id != 'Me' && selectedChannel && (<div className="flex gap-5">
                    <IconBellFilled size={20} className="text-white/50 hover:text-white cursor-pointer" />
                    <IconPinFilled size={20} className="text-white/50 hover:text-white cursor-pointer" />
                    <IconUserFilled size={20} className="text-white/50 hover:text-white cursor-pointer" onClick={() => { getServerUsers(); setShowUsers(!showUsers) }} />
                </div>)}
                {selectedServer.id == 'Me' && !selectedFriend && (<div className="flex gap-5 py-1">
                    <button onClick={() => { setFriendsUI('pending'); handlePendingRequest(); }} className={`cursor-pointer px-2 py-1 hover:bg-white/5 rounded-md ${friendsUI == 'pending' ? 'bg-white/10' : 'bg-transparent'}`}>Pending</button>
                    <button onClick={() => { setFriendsUI('add') }} className={`cursor-pointer px-2 py-1 hover:bg-[#5865f2]/30 rounded-md ${friendsUI == 'add' ? 'bg-[#5865f2]/50' : 'bg-[#5865f2]'}`}>Add Friend</button>
                </div>)}
            </div>
            {/* Main Chat Area */}
            <div className="flex w-full h-full">

                {/* Left Side */}
                {(selectedServer.id != 'Me' || selectedFriend) && (<div className="flex flex-col w-full h-full">
                    {/* Messages Area */}
                    {(selectedServer.id != 'Me' && selectedChannel) && (<div ref={bottomRef} className="w-full h-full py-2 flex flex-col justify-end gap-5 overflow-y-auto scrollbar-minimal">

                        {messages.map((message) => {
                            const user = users.find(u => u.id === message.sender);

                            return (
                                <div key={message.id} className="hover:bg-[#242428] p-2 flex gap-3">
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

                    </div>)}
                    {(selectedServer.id == 'Me' && selectedFriend) && (<div ref={bottomRef} className="w-full h-full py-2 flex flex-col justify-end gap-5 overflow-y-auto scrollbar-minimal">
                        {directMessages.map((message) => {
                            const user = users.find(u => u.id === message.senderId);

                            return (
                                <div key={message.id} className="hover:bg-[#242428] p-2 flex gap-3">
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

                    </div>)}

                    <div className="px-3 w-full h-15 items-center">
                        {((selectedServer.id == 'Me' && selectedFriend) || (selectedServer.id != 'Me' && selectedChannel)) && (<div className="flex px-3 gap-5 items-center rounded-md border border-[#303034] bg-[#222327] w-full h-full">
                            {/* add Files */}
                            <div className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer hover:bg-white/20 p-1 rounded-md">
                                <IconPlus stroke={2} />
                            </div>
                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="w-full h-full">
                                {selectedServer.id != 'Me' && selectedChannel && (<input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message #${selectedChannel}`} className="w-full h-full focus:outline-0 font-thin text-white/60" />)}
                                {selectedServer.id == 'Me' && selectedFriend && (<input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message @${selectedFriend.username}`} className="w-full h-full focus:outline-0 font-thin text-white/60" />)}
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
                        </div>)}
                    </div>
                </div>)}

                {/* Add Friend UI */}
                {selectedServer.id == 'Me' && !selectedFriend && friendsUI == 'add' && (<div className="flex flex-col w-full h-full">
                    {/* Messages Area */}
                    <div ref={bottomRef} className="w-full h-full p-2 flex flex-col gap-5 overflow-y-auto scrollbar-minimal">
                        <div className="flex flex-col gap-5 py-2 px-3">
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-xl">Add Friend</span>
                                <span className="">You can add friends with their Discord username.</span>
                            </div>
                            <div className="flex border h-15 border-[#303034] w-full bg-[#17171a] rounded-md px-2 py-3">
                                <input value={searchFriend} onChange={(e) => { setSearchFriend(e.target.value); handleSearchFriend(); }} type="text" placeholder="You can add friends with their Discord username" className="h-full w-full focus:outline-0" />
                            </div>

                            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-5">
                                {searchFriendResult.map((friend) => {
                                    if (friend.id == user?.id) {
                                        return;
                                    }
                                    return (<div key={friend.id} className="flex bg-white/5 px-2 py-2 rounded-md items-center gap-3 place-content-between">
                                        <div className="flex items-center gap-3">
                                            <div className="overflow-hidden rounded-full w-12 h-12">
                                                <img src={friend.profile} alt="profile" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-semibold">{friend.username}</span>
                                        </div>
                                        <button onClick={() => { handleFriendRequest(friend.id) }} className="h-10 whitespace-nowrap px-2 bg-[#5865f2] hover:bg-[#5865f2]/70 cursor-pointer text-xs font-semibold rounded-md">Request</button>
                                    </div>)
                                })}
                            </div>
                        </div>
                    </div>
                </div>)}

                {/* Pending Friend Request UI */}
                {selectedServer.id == 'Me' && !selectedFriend && friendsUI == 'pending' && (<div className="flex flex-col w-full h-full">
                    {/* Messages Area */}
                    <div ref={bottomRef} className="w-full h-full p-2 flex flex-col px-5 overflow-y-auto scrollbar-minimal">
                        {pendingRequest.length != 0 && (<div className="flex flex-col">
                            <span className="text-xs border-b border-[#303034] py-3">Sent - {pendingRequest.length}</span>
                            {pendingRequest.map(({ friend }) => {
                                if (!friend) { return }
                                return (
                                    <div key={friend.id} className="flex p-3 border-b border-[#303034] place-content-between items-center cursor-pointer hover:bg-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="overflow-hidden rounded-full">
                                                <img src={friend.profile} alt="Profile" className="w-10 h-10" />
                                            </div>
                                            <span className="font-semibold">{friend.username}</span>
                                        </div>

                                        <div onClick={() => { cancelSentRequest(friend.id) }} className="rounded-full hover:bg-black/50 flex items-center justify-center w-10 h-10 hover:text-red-500 cursor-pointer">
                                            <IconXFilled />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>)}

                        {receivedRequest.length != 0 && (<div className="flex flex-col">
                            <span className="text-xs border-b border-[#303034] py-3">Received - {receivedRequest.length}</span>
                            {receivedRequest.map(({ friend }) => {
                                if (!friend) { return }
                                return (
                                    <div key={friend.id} className="flex p-3 border-b border-[#303034] place-content-between items-center cursor-pointer hover:bg-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="overflow-hidden rounded-full">
                                                <img src={friend.profile} alt="Profile" className="w-10 h-10" />
                                            </div>
                                            <span className="font-semibold">{friend.username}</span>
                                        </div>

                                        <div className="flex">
                                            <div onClick={() => { acceptReceivedRequest(friend.id) }} className="rounded-full hover:bg-black/50 flex items-center justify-center w-10 h-10 hover:text-green-500 cursor-pointer">
                                                <IconCheckFilled />
                                            </div>
                                            <div onClick={() => { cancelSentRequest(friend.id) }} className="rounded-full hover:bg-black/50 flex items-center justify-center w-10 h-10 hover:text-red-500 cursor-pointer">
                                                <IconXFilled />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>)}
                    </div>
                </div>)}

                {/* Show Users */}
                {showUsers && selectedServer.id != 'Me' && selectedChannel && (<div className="flex flex-col gap-3 h-full w-[20vw] min-w-60 border-l border-[#303034] px-3 py-5">
                    {/* users template */}
                    <span className="text-white/50">Server users:</span>

                    {serverUsers.map((su) => {
                        return (
                            <div key={su.id} className="flex items-center gap-3 group hover:bg-white/5 px-2 py-1 rounded-md cursor-pointer">
                                <div className="w-9 h-9 overflow-hidden rounded-full">
                                    <img src={su.profile} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-white/50 group-hover:text-white">{su.username}</span>
                            </div>
                        )
                    })}
                </div>)}
                {selectedServer.id == 'Me' && (<div className="flex flex-col gap-3 h-full w-[20vw] min-w-60 border-l border-[#303034] px-3 py-5 md:hidden lg:flex">
                    {/* users template */}
                    <span className="text-white/50">WIP</span>
                </div>)}
            </div>
        </div>
    );
}