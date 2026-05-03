"use client";

import { supabase } from "@/lib/supabase";
import { IconBellFilled, IconCheckFilled, IconCopyFilled, IconDotsFilled, IconDotsVerticalFilled, IconGif, IconGift, IconHash, IconMenu2Filled, IconMessageCircleFilled, IconMoodHappy, IconPencilFilled, IconPinFilled, IconPlus, IconPlusFilled, IconSticker2, IconTrashFilled, IconUser, IconUserFilled, IconXFilled, IconZoom } from "@tabler/icons-react";
import { format, set } from "date-fns";
import { useEffect, useRef, useState } from "react";
import WIP from "./wip";
import { uploadToImgBB } from "@/lib/imgbb";
import { TailSpin } from "react-loader-spinner";

interface user {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
    banner: string;
    bio: string;
    created_at: string;
}

interface friend {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
    chatId: string;
    status: string;
    friend?: user;
}

type Attachment = {
    id: number;
    messageId: number | null;
    chatMessageId: number | null;
    fileUrl: string;
    fileType: string;
    server: boolean;
}

interface Messages {
    id: number;
    sender: string;
    message: string;
    destination: string;
    created_at: string;
    attachments: Attachment[];
}

interface DirectMessages {
    id: number;
    senderId: string;
    receiverId: string;
    message: string;
    created_at: string;
    attachments: Attachment[];
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
    setSelectedFriend: (friend: friend) => void;
    toggleServers: boolean;
    setToggleServers: (value: boolean) => void;
};

export default function MessagesPage({ selectedChannel, selectedChannelId, user, selectedServer, selectedFriend, setSelectedFriend, toggleServers, setToggleServers }: UserCardProps) {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Messages[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessages[]>([]);
    const [users, setUsers] = useState<user[]>([]);
    const [showUsers, setShowUsers] = useState(false);
    const [serverUsers, setServerUsers] = useState<user[]>([]);
    const [searchFriend, setSearchFriend] = useState('');
    const [friendsUI, setFriendsUI] = useState('all');
    const [searchFriendResult, setSearchFriendResult] = useState<user[]>([]);
    const [pendingRequest, setPendingRequest] = useState<friend[]>([]);
    const [receivedRequest, setReceivedRequest] = useState<friend[]>([]);
    const [chatId, setChatId] = useState('');
    const [selectedProfileCard, setSelectedProfileCard] = useState('');
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [position, setPosition] = useState<"top" | "bottom">("bottom");
    const [sendDM, setSendDM] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editedMessage, setEditedMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState([] as string[]);
    const [friends, setFriends] = useState<friend[]>([]);

    const handleClick = (
        e: React.MouseEvent<HTMLDivElement>,
        id: string
    ) => {
        const rect = e.currentTarget.getBoundingClientRect();

        const CARD_HEIGHT = 260; // adjust based on your UI

        const spaceBelow = window.innerHeight - rect.bottom;

        if (spaceBelow < CARD_HEIGHT) {
            setPosition("top"); // not enough space below → show above
        } else {
            setPosition("bottom"); // enough space → show below
        }

        setSelectedProfileCard(id);
    };

    useEffect(() => {
        setDirectMessages([]);
    }, [selectedFriend])

    useEffect(() => {
        handleFriends();
    }, [user])

    const handleFriends = async () => {
        console.log("USER:", user);

        if (!user?.id) return;

        const { data, error } = await supabase
            .from("friends")
            .select(`
            status,
            userId,
            friendId,
            user:users!friends_userId_fkey (*),
            friend:users!friends_friendId_fkey (*)
        `)
            .or(`userId.eq.${user.id},friendId.eq.${user.id}`)
            .eq('status', 'accepted');

        console.log("ERROR:", error);

        if (error) return;

        const formatted = data
            ?.map((row) => {
                const other =
                    row.userId === user.id ? row.friend : row.user;

                return Array.isArray(other) ? other[0] : other;
            })
            .filter(Boolean);

        setFriends(formatted ?? []);
    };

    useEffect(() => {
        setUsers([]);
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
                .select(`
                    *,
                    attachments (
                        id,
                        fileUrl,
                        messageId,
                        fileType,
                        server
                    )
                `)
                .eq("destination", selectedChannelId)
                .order("created_at");

            console.log('*********************************');
            console.table(data);

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
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `destination=eq.${selectedChannelId}`,
                },
                (payload) => {
                    console.log("Realtime event:", payload.eventType, payload);
                    if (payload.eventType === "INSERT") {
                        const newMessage = payload.new as Messages;
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage]; // attachments is undefined → crashes on .map/.filter later
                        });
                    }

                    if (payload.eventType === "UPDATE") {
                        const updatedMessage = payload.new as Messages;
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === updatedMessage.id
                                    ? { ...updatedMessage, attachments: m.attachments }
                                    : m
                            )
                        );
                    }

                    if (payload.eventType === "DELETE") {
                        const deletedMessage = payload.old as { id: number };
                        setMessages((prev) =>
                            prev.filter((m) => m.id !== deletedMessage.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChannelId]);

    useEffect(() => {
        if (!chatId) return;

        const dmAttachmentsChannel = supabase
            .channel(`dm-attachments-${chatId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "attachments" },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const a = payload.new as Attachment;
                        if (!a.chatMessageId) return;

                        setDirectMessages(prev => {
                            const messageExists = prev.some(m => m.id === a.chatMessageId);

                            if (messageExists) {
                                return prev.map(m =>
                                    m.id === a.chatMessageId
                                        ? { ...m, attachments: [...(m.attachments || []), a] }
                                        : m
                                );
                            } else {
                                supabase
                                    .from("directMessage")
                                    .select("*")
                                    .eq("id", a.chatMessageId)
                                    .single()
                                    .then(({ data }) => {
                                        if (!data) return;
                                        setDirectMessages(prev2 => {
                                            if (prev2.some(m => m.id === data.id)) return prev2;
                                            return [...prev2, { ...data, attachments: [a] }];
                                        });
                                    });
                                return prev; // return unchanged for now
                            }
                        });
                    }

                    if (payload.eventType === "DELETE") {
                        const a = payload.old as { id: number; chatMessageId: number };
                        if (!a.chatMessageId) return;
                        setDirectMessages(prev =>
                            prev.map(m =>
                                m.id === a.chatMessageId
                                    ? { ...m, attachments: m.attachments.filter(att => att.id !== a.id) }
                                    : m
                            )
                        );
                    }
                }
            ).subscribe();

        return () => {
            supabase.removeChannel(dmAttachmentsChannel);
        };
    }, [chatId]);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, directMessages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || (!message && !preview.length)) {
            alert('user or message is null')
            return;
        }
        const msg = message.trim();
        const files = preview;
        const savedMessage = msg;
        const savedPreview = [...preview];
        setPreview([]);
        setMessage('');
        if (selectedServer.id == 'Me' && selectedFriend) {
            const { data: messageData, error } = await supabase.from('directMessage').insert({ senderId: user.id, message: msg, chatId: chatId }).select().single();
            if (error) {
                setMessage(savedMessage);
                setPreview(savedPreview);
                alert('Failed to send: ' + error.message);
                alert(error.message);
                return;
            }
            if (files.length) {
                const { data, error: attachmentError } = await supabase
                    .from("attachments")
                    .insert(
                        files.map((url) => ({
                            fileUrl: url,
                            chatMessageId: messageData?.id,
                            fileType: 'image',
                            server: false,
                        }))
                    );
                if (attachmentError) {
                    alert(JSON.stringify(attachmentError));
                }
            }
        }
        if (selectedServer.id != 'Me' && selectedChannel) {
            const { data: messageData, error } = await supabase.from('messages').insert({ sender: user.id, message: msg, destination: selectedChannelId }).select().single();
            if (error) {
                alert(error.message);
                return;
            }
            if (files.length) {
                const { data, error: attachmentError } = await supabase
                    .from("attachments")
                    .insert(
                        files.map((url) => ({
                            fileUrl: url,
                            messageId: messageData?.id,
                            fileType: 'image',
                            server: false,
                        }))
                    );
                if (attachmentError) {
                    alert(attachmentError.message);
                }
            }
        }
        // getMessage();
    }

    const handleDeleteMessage = async (id: number) => {
        // alert(id)
        if (selectedServer.id == 'Me' && selectedFriend) {
            const { data, error } = await supabase.from('directMessage').delete().eq('id', id);
            if (error) {
                alert(error.message);
                return;
            }
        }
        if (selectedServer.id != 'Me' && selectedChannel) {
            const { data, error } = await supabase.from('messages').delete().eq('id', id);
            if (error) {
                alert(error.message);
                return;
            }
        }
    }

    const handleEditedMessage = async (e: React.FormEvent, id: number, editedMessage: string) => {
        e.preventDefault();
        // alert(id)
        const trimmed = editedMessage?.trim();
        setEditedMessage('');
        if (selectedServer.id == 'Me' && selectedFriend) {
            const { data, error } = await supabase.from('directMessage').update({ message: trimmed }).eq('id', id);
            if (error) {
                alert(error.message);
                return;
            }
        }
        if (selectedServer.id != 'Me' && selectedChannel) {
            const { data, error } = await supabase.from('messages').update({ message: trimmed }).eq('id', id);
            if (error) {
                alert(error.message);
                return;
            }
        }
    }

    const handleDeleteAttachment = async (id: number, messageId: number) => {
        if (selectedServer.id === 'Me') {
            setDirectMessages(prev =>
                prev.map(m =>
                    m.id === messageId
                        ? { ...m, attachments: m.attachments.filter(a => a.id !== id) }
                        : m
                )
            );
        } else {
            setMessages(prev =>
                prev.map(m =>
                    m.id === messageId
                        ? { ...m, attachments: m.attachments.filter(a => a.id !== id) }
                        : m
                )
            );
        }

        const { error } = await supabase.from('attachments').delete().eq('id', id);
        if (error) alert(error.message);
    };

    useEffect(() => {
        if (!chatId) return;

        // 1. Initial fetch
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("directMessage")
                .select("*")
                .eq("chatId", chatId)
                .order("created_at", { ascending: true });

            if (error) { console.error("Fetch error:", JSON.stringify(error)); return; }

            const messages = data || [];
            if (!messages.length) { setDirectMessages([]); return; }

            const messageIds = messages.map(m => m.id);
            const { data: attachments } = await supabase
                .from("attachments")
                .select("*")
                .in("chatMessageId", messageIds);

            const merged = messages.map(m => ({
                ...m,
                attachments: attachments?.filter(a => a.chatMessageId === m.id) || []
            }));

            setDirectMessages(merged);
        };

        fetchMessages();

        // 2. Realtime subscription
        const channel = supabase
            .channel(`chat-${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "directMessage",
                    filter: `chatId=eq.${chatId}`,
                },
                (payload) => {
                    console.log("Realtime event:", payload.eventType, payload);
                    if (payload.eventType === "INSERT") {
                        const newMessage = {
                            ...payload.new,
                            created_at: payload.new.created_at ?? new Date().toISOString(),
                            attachments: [],
                        } as unknown as DirectMessages;

                        setDirectMessages((prev) => {
                            if (prev.find((m) => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage];
                        });
                    }

                    if (payload.eventType === "UPDATE") {
                        const updatedMessage = payload.new as DirectMessages;
                        setDirectMessages((prev) =>
                            prev.map((m) =>
                                m.id === updatedMessage.id
                                    ? { ...updatedMessage, attachments: m.attachments } // ✅ same fix
                                    : m
                            )
                        );
                    }

                    if (payload.eventType === "DELETE") {
                        const deletedMessage = payload.old as { id: number };
                        setDirectMessages((prev) =>
                            prev.filter((m) => m.id !== deletedMessage.id)
                        );
                    }
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

    const sendDirectMessage = async (fid: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !sendDM) {
            alert('user or message is null')
            return;
        }
        const { data: userData, error: userError } = await supabase
            .from('friends')
            .insert({
                userId: user.id,
                friendId: fid,
                status: 'none'
            })
            .select();

        if (userError) {
            console.error(userError);
            return;
        }

        alert(userData?.[0]?.chatId);

        const { data, error } = await supabase.from('directMessage').insert({ senderId: user.id, message: sendDM, chatId: userData?.[0]?.chatId })
        if (error) {
            alert(error.message);
            return;
        }
        setSendDM('');
    };

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert("Copied!");
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        if (preview.length + fileArray.length > 10) {
            alert("You can only upload up to 10 images per message.");
            return;
        }

        setLoading(true);
        try {
            const uploadPromises = fileArray.map(file => uploadToImgBB(file));
            const results = await Promise.all(uploadPromises);
            const urls = results.map(res => res.url);

            setPreview(prev => [...prev, ...urls]);
        } catch (err) {
            alert(err);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setLoading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openFilePicker = () => {
        // if (preview.length >= 4) {
        //     return alert("You can only upload up to 4 images per message.");
        // }
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };


    return (
        <div className="flex flex-1 flex-col text-white pb-2 w-full h-full">
            {/* image message preview full screen */}
            {/* <div className="absolute bg-amber-200 w-full h-full z-999"></div> */}
            {/* header */}
            <div className="h-12 flex items-center p-3 w-full border-b border-[#303034] place-content-between">
                {selectedServer.id != 'Me' && (<div className="flex gap-3 items-center">
                    <button onClick={() => { setToggleServers(!toggleServers) }} className={`cursor-pointer px-2 py-1 hover:bg-white/5 rounded-md md:hidden`}><IconMenu2Filled size={20} /></button>
                    <div className="w-6 h-6 overflow-hidden rounded-full">
                        <IconHash stroke={2} size={20} color="gray" />
                    </div>
                    {selectedChannel}
                </div>)}

                {selectedServer.id == 'Me' && selectedFriend && (<div className="flex gap-3 items-center">
                    <button onClick={() => { setToggleServers(!toggleServers) }} className={`cursor-pointer px-2 py-1 hover:bg-white/5 rounded-md md:hidden`}><IconMenu2Filled size={20} /></button>
                    <div className="w-6 h-6 overflow-hidden rounded-full">
                        <img src={selectedFriend.profile} alt="" className="w-full h-full object-cover" />
                    </div>
                    {selectedFriend.username}
                    {/* {chatId} */}
                </div>)}

                {selectedServer.id != 'Me' && (<div className="flex gap-5">
                    <IconBellFilled size={20} className="text-white/50 hover:text-white cursor-pointer" />
                    <IconPinFilled size={20} className="text-white/50 hover:text-white cursor-pointer" />
                    <IconUserFilled size={20} className="text-white/50 hover:text-white cursor-pointer" onClick={() => { getServerUsers(); setShowUsers(!showUsers) }} />
                </div>)}
                {selectedServer.id == 'Me' && !selectedFriend && (<div className="flex gap-5 py-1">
                    <button onClick={() => { setToggleServers(!toggleServers) }} className={`cursor-pointer px-2 py-1 hover:bg-white/5 rounded-md md:hidden`}><IconMenu2Filled size={20} /></button>
                    <button onClick={() => { setFriendsUI('all'); }} className={`cursor-pointer px-2 py-1 hover:bg-white/5 rounded-md ${friendsUI == 'all' ? 'bg-white/10' : 'bg-transparent'}`}>All</button>
                    <button onClick={() => { setFriendsUI('pending'); handlePendingRequest(); }} className={`cursor-pointer px-2 py-1 hover:bg-white/5 rounded-md ${friendsUI == 'pending' ? 'bg-white/10' : 'bg-transparent'}`}>Pending</button>
                    <button onClick={() => { setFriendsUI('add') }} className={`cursor-pointer px-2 py-1 hover:bg-[#5865f2]/30 rounded-md ${friendsUI == 'add' ? 'bg-[#5865f2]/50' : 'bg-[#5865f2]'}`}>Add Friend</button>
                </div>)}
            </div>
            {/* Main Chat Area */}
            <div className="flex w-full h-full overflow-hidden">

                {/* Left Side */}
                {(selectedServer.id != 'Me' || selectedFriend) && (<div className="flex flex-col w-full h-full min-w-0 overflow-hidden">

                    {/* Messages Area */}
                    {(selectedServer.id != 'Me' && selectedChannel) && (<div ref={bottomRef} className="flex-1 min-h-0 py-2 flex flex-col-reverse gap-5 overflow-y-auto scrollbar-minimal overflow-hidden ">

                        {[...messages].reverse().map((message) => {
                            const muser = users.find(u => u.id === message.sender);
                            console.table(message)
                            return (
                                <div key={message.id} className="hover:bg-[#242428] p-2 flex gap-3 relative group min-w-0">
                                    {(message.message || message.sender === user?.id) && (<div className="hidden absolute w-auto h-8 bg-[#242428] group-hover:flex cursor-pointer rounded-md -top-4 right-10 border border-[#303034] items-center justify-end px-1 py-0.5 gap-1 hover:shadow-xl/20">
                                        {message.sender === user?.id && (<div onClick={() => { setEditingMessageId(message.id); setEditedMessage(message.message); setEditingMessageId(editingMessageId == message.id ? null : message.id); }} className="text-white/50 hover:text-white hover:bg-[#303034] w-8 h-full flex items-center justify-center rounded-sm">
                                            <IconPencilFilled size={20} />
                                        </div>)}
                                        {message.message && (<div onClick={() => { copyText(message.message) }} className="text-white/50 hover:text-white hover:bg-[#303034] w-8 h-full flex items-center justify-center rounded-sm">
                                            <IconCopyFilled size={20} />
                                        </div>)}
                                        {message.sender === user?.id && (<div onClick={() => { handleDeleteMessage(message.id) }} className="text-red-500 hover:bg-[#303034] w-8 h-full flex items-center justify-center rounded-sm">
                                            <IconTrashFilled size={20} />
                                        </div>)}
                                    </div>)}
                                    <div className="min-w-10 max-w-10 h-10 rounded-full overflow-hidden">
                                        <img src={muser?.profile} className="h-full w-full object-cover" />
                                    </div>

                                    <div className="flex flex-col w-full pr-5 min-w-0">
                                        <div className="flex gap-3">
                                            <span className="text-sm font-semibold">{muser?.username}</span>
                                            <span className="text-xs text-white/50">{format(new Date(message.created_at), "hh:mm a")}</span>
                                        </div>
                                        {editingMessageId !== message.id && message.message?.trim() !== '' && (<span className="text-white wrap-break-word whitespace-pre-wrap pr-6">{message.message}</span>)}
                                        {message.attachments?.length > 0 && (
                                            <div className="flex gap-2 mt-1 overflow-x-scroll scrollbar-minimal pb-4 max-w-full">
                                                {message.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="relative">
                                                        {attachment.fileType === 'image' && (
                                                            <div className="flex w-50 h-50 rounded-md overflow-hidden border border-[#303034] bg-[#17171a] relative group/img cursor-pointer">
                                                                <img
                                                                    src={attachment.fileUrl}
                                                                    className="w-full h-full object-cover"
                                                                    onClick={() => window.open(attachment.fileUrl, "_blank")}
                                                                />
                                                                {message.attachments.length > 1 && editingMessageId === message.id && (
                                                                    <div onClick={() => handleDeleteAttachment(attachment.id, message.id)} className="absolute top-2 right-2 cursor-pointer text-red-500 hover:bg-black bg-[#222327] border border-[#303034] w-8 h-8 hidden group-hover/img:flex items-center justify-center rounded-sm">
                                                                        <IconTrashFilled size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {editingMessageId === message.id && (<form onSubmit={(e) => { setEditingMessageId(null); handleEditedMessage(e, message.id, editedMessage); }} className="w-full my-2">
                                            <div className="flex w-full h-13 px-5 py-0.5 items-center justify-end border border-[#303034] rounded-md gap-1">
                                                <input type="text" value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} className="w-full h-full focus:outline-0 font-thin text-white/60" placeholder="edit message" />
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="text-xs py-1">escape to</span>
                                                <span onClick={() => { setEditingMessageId(null) }} className="text-xs py-1 text-blue-500 hover:underline cursor-pointer">cancel</span>
                                                <span className="text-xs py-1">- enter to save</span>
                                                <span onClick={(e) => { setEditingMessageId(null); handleEditedMessage(e, message.id, editedMessage); }} className="text-xs py-1 text-blue-500 hover:underline cursor-pointer">save</span>
                                            </div>
                                        </form>)}
                                    </div>
                                </div>
                            );
                        })}

                    </div>)}
                    {(selectedServer.id == 'Me' && selectedFriend) && (<div ref={bottomRef} className="flex-1 min-h-0 py-2 flex flex-col-reverse overflow-y-auto scrollbar-minimal">
                        {[...directMessages].reverse().map((message) => {
                            const muser = users.find(u => u.id === message.senderId);

                            return (
                                <div key={message.id} className="hover:bg-[#242428] group p-2 flex gap-3 relative">
                                    {/* <span>{directMessages[directMessages.length - 2]?.senderId}</span> */}
                                    <div className="hidden absolute w-auto h-8 bg-[#242428] group-hover:flex cursor-pointer rounded-md -top-4 right-10 border border-[#303034] items-center justify-end px-1 py-0.5 gap-1 hover:shadow-xl/20">
                                        {message.senderId === user?.id && (<div onClick={() => { setEditingMessageId(message.id); setEditedMessage(message.message) }} className="text-white/50 hover:text-white hover:bg-[#303034] w-8 h-full flex items-center justify-center rounded-sm">
                                            <IconPencilFilled size={20} />
                                        </div>)}
                                        <div onClick={() => { copyText(message.message) }} className="text-white/50 hover:text-white hover:bg-[#303034] w-8 h-full flex items-center justify-center rounded-sm">
                                            <IconCopyFilled size={20} />
                                        </div>
                                        {message.senderId === user?.id && (<div onClick={() => { handleDeleteMessage(message.id) }} className="text-red-500 hover:bg-[#281c20] w-8 h-full flex items-center justify-center rounded-sm">
                                            <IconTrashFilled size={20} />
                                        </div>)}
                                    </div>

                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                        <img src={muser?.profile} className="h-full w-full object-cover" />
                                    </div>

                                    <div className="flex flex-col w-full pr-5">
                                        <div className="flex gap-3">
                                            <span className="text-sm font-semibold">{muser?.username}</span>
                                            <span className="text-xs text-white/50">{format(new Date(message.created_at), "hh:mm a")}</span>
                                        </div>
                                        {message.attachments?.length > 0 && (
                                            <div className="flex gap-2 mt-1 overflow-x-scroll scrollbar-minimal pb-4 max-w-full">
                                                {message.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="relative">
                                                        {attachment.fileType === 'image' && (
                                                            <div className="flex w-50 h-50 rounded-md overflow-hidden border border-[#303034] bg-[#17171a] relative group/img cursor-pointer">
                                                                <img
                                                                    src={attachment.fileUrl}
                                                                    className="w-full h-full object-cover"
                                                                    onClick={() => window.open(attachment.fileUrl, "_blank")}
                                                                />
                                                                {message.attachments.length > 1 && editingMessageId === message.id && (
                                                                    <div onClick={() => handleDeleteAttachment(attachment.id, message.id)} className="absolute top-2 right-2 cursor-pointer text-red-500 hover:bg-black bg-[#222327] border border-[#303034] w-8 h-8 hidden group-hover/img:flex items-center justify-center rounded-sm">
                                                                        <IconTrashFilled size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {editingMessageId !== message.id && (<span className="text-white">{message.message}</span>)}
                                        {editingMessageId === message.id && (<form onSubmit={(e) => { setEditingMessageId(null); handleEditedMessage(e, message.id, editedMessage); }} className="w-full my-2">
                                            <div className="flex w-full h-13 px-5 py-0.5 items-center justify-end border border-[#303034] rounded-md gap-1">
                                                <input type="text" value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} className="w-full h-full focus:outline-0 font-thin text-white/60" />
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="text-xs py-1">escape to</span>
                                                <span onClick={() => { setEditingMessageId(null) }} className="text-xs py-1 text-blue-500 hover:underline cursor-pointer">cancel</span>
                                                <span className="text-xs py-1">- enter to save</span>
                                                <span onClick={(e) => { setEditingMessageId(null); handleEditedMessage(e, message.id, editedMessage); }} className="text-xs py-1 text-blue-500 hover:underline cursor-pointer">save</span>
                                            </div>
                                        </form>)}
                                    </div>
                                </div>
                            );
                        })}

                    </div>)}


                    {/* Message Input Area */}

                    <div className="px-3 w-full min-h-15 h-auto items-center mt-4">
                        {((selectedServer.id == 'Me' && selectedFriend) || (selectedServer.id != 'Me' && selectedChannel)) && (<div className="flex flex-col px-3 gap-5 items-start justify-center rounded-md border border-[#303034] bg-[#222327] w-full h-full overflow-hidden">
                            {/* add Files */}
                            {(preview.length > 0 || loading) && (<div className="flex gap-2 pt-4 pb-4 min-w-full max-w-full overflow-x-scroll scrollbar-minimal">
                                {preview.map((url, index) => (<div key={index} className="relative rounded-md overflow-hidden min-w-42 max-w-42 min-h-30 max-h-30 border border-[#303034] bg-[#17171a] flex items-center justify-center">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    {loading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {!loading && preview && (<div onClick={() => { setPreview((prev) => prev.filter((_, i) => i !== index)); }} className="absolute top-2 right-2 cursor-pointer text-red-500 hover:bg-black bg-[#222327] border border-[#303034] w-8 h-8 flex items-center justify-center rounded-sm">
                                        <IconTrashFilled size={20} />
                                    </div>)}
                                </div>))}
                            </div>)}
                            <div className="flex w-full h-10 items-center gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange} />
                                <div onClick={openFilePicker} className="flex items-center justify-center text-white/50 hover:text-white cursor-pointer hover:bg-white/20 p-1 rounded-md">
                                    <IconPlus stroke={2} />
                                </div>
                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="w-full h-full">
                                    {selectedServer.id != 'Me' && selectedChannel && (<input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message #${selectedChannel}`} className="w-full h-full focus:outline-0 font-thin text-white" />)}
                                    {selectedServer.id == 'Me' && selectedFriend && (<input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message @${selectedFriend.username}`} className="w-full h-full focus:outline-0 font-thin text-white" />)}
                                </form>
                                {/* Extra Options */}
                                <div className="flex gap-2">
                                    <div className="hidden md:flex items-center justify-center text-white/50 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1 rounded-md">
                                        <IconGift stroke={2} />
                                    </div>
                                    <div className="hidden md:flex items-center justify-center text-white/50 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1 rounded-md">
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

                {/* Friends List */}
                {selectedServer.id == 'Me' && selectedFriend == null && friendsUI == 'all' && (
                    <div className="flex flex-col w-full h-full px-5 py-4 gap-3">
                        <div className="flex w-full h-12 border rounded-lg bg-[#17171a] border-[#303034] items-center justify-center px-2 gap-2">
                            <IconZoom stroke={2} size={20} />
                            <input type="text" className="w-full h-full focus:outline-0" placeholder="search (W.I.P.)" />
                        </div>
                        {friends.length > 0 && (<div className="flex flex-col gap-3 justify-center">
                            {/* User Card */}
                            {friends.map((friend) => {
                                return (
                                    <div onClick={() => setSelectedFriend(friend)} className="flex border-t border-[#303034] py-2 px-2 items-center gap-3 place-content-between cursor-pointer hover:border-[#ffffff00] hover:rounded-md hover:bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                                <img src={friend?.profile} className="w-full h-full object-cover" />
                                            </div>
                                            <span>{friend?.username}</span>
                                        </div>
                                        <div className="flex">
                                            <IconMessageCircleFilled />
                                            <IconDotsVerticalFilled />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>)}
                    </div>
                )}

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
                {showUsers && selectedServer.id != 'Me' && (<div className="flex flex-col gap-3 h-full min-w-[20vw] border-l border-[#303034] px-3 py-5">
                    {/* users template */}
                    <span className="text-white/50">Server users:</span>

                    {serverUsers.map((su) => {
                        return (
                            <div onClick={(e) => { setSelectedProfileCard(su.id); selectedProfileCard === su.id ? setShowProfileCard(!showProfileCard) : setShowProfileCard(true); handleClick(e, su.id) }} key={su.id} className={`flex relative items-center gap-3 group px-2 py-1 rounded-md cursor-pointer ${(selectedProfileCard === su.id && showProfileCard) ? 'bg-[#333338] text-white' : 'text-white/50 hover:bg-white/5'}`}>
                                {/* Profile Card */}
                                {selectedProfileCard === su.id && showProfileCard && (
                                    <div onClick={(e) => e.stopPropagation()} className={`z-2 cursor-default flex flex-col items-start absolute right-[20vw] bg-[#242429] w-80 h-auto rounded-xl overflow-hidden shadow-xl ${position === "top" ? "bottom-0" : "top-0"}`}>
                                        {/* Banner */}
                                        <div className="w-full min-h-30 relative flex" style={{ backgroundColor: su?.banner }}>
                                            {selectedProfileCard !== user?.id && (<div className="absolute flex gap-2 right-2 top-2">
                                                <div onClick={() => { handleFriendRequest(su.id); setSelectedProfileCard(''); }} className="flex w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center cursor-pointer"><IconPlusFilled /></div>
                                                <div className="flex w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center cursor-pointer"><IconDotsFilled /></div>
                                            </div>)}
                                        </div>
                                        {/* Profile */}
                                        <div className="flex flex-col gap-5 w-full h-full px-3 pb-5">
                                            <div className="flex w-full">
                                                <div className="relative min-w-28 min-h-13">
                                                    <div className="w-25 h-25 absolute z-10 -top-15 rounded-full overflow-hidden border-6 border-[#242429]">
                                                        <img src={su.profile} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start h-full w-full">
                                                <label className="text-white font-semibold text-xl">{su?.username}</label>
                                                <label className="text-white text-sm">{su?.bio}</label>
                                            </div>

                                            {/* Message User */}
                                            {selectedProfileCard !== user?.id && (<div className="flex bg-[#202024] w-full h-12 items-center justify-center gap-3 px-3 rounded-md overflow-hidden border border-[#303034]">
                                                <form onSubmit={(e) => sendDirectMessage(su.id, e)} className="w-full h-full">
                                                    <input value={sendDM} onChange={(e) => setSendDM(e.target.value)} type="text" className="w-full h-full focus:outline-0" placeholder={`Message @${su.username}`} />
                                                </form>
                                            </div>)}
                                        </div>
                                    </div>)}
                                <div className="w-9 h-9 overflow-hidden rounded-full">
                                    <img src={su.profile} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="group-hover:text-white">{su.username}</span>
                            </div>
                        )
                    })}
                </div>)}
                {selectedServer.id == 'Me' && (<div className="md:flex flex-col gap-3 h-full w-[20vw] min-w-60 border-l border-[#303034] px-3 py-5 hidden lg:flex">
                    {/* users template */}
                    <span className="text-white/50"><WIP /></span>
                </div>)}
            </div>
        </div>
    );
}