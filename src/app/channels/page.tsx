"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconInbox, IconHelpFilled, IconUserFilled, IconBasketFilled, IconBrandSafari, IconChevronDown, IconDiamondFilled, IconDownload, IconHeadphonesFilled, IconHeadphonesOff, IconMicrophone, IconMicrophoneOff, IconPlus, IconSettingsFilled, IconX, IconZoomQuestionFilled, IconHash, IconUserPlus, IconVolume } from "@tabler/icons-react";
import { profile } from "console";
import { signOut } from "@/services/auth";
import { supabase } from "@/lib/supabase";
import { uploadToImgBB } from "@/lib/imgbb";
import MessagesPage from '@/components/messagesPage';
import { v4 as uuidv4 } from 'uuid';
import { Oval, TailSpin } from "react-loader-spinner";
import { customAlphabet } from "nanoid";

interface Servers {
    id: string;
    name: string;
    icon: string;
}
interface Channels {
    id: string;
    name: string;
    type: string;
    serverId: string;
}

interface user {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
}

export default function ChannelsLayout() {


    const router = useRouter();

    const [session, setSession] = useState<any>(undefined);
    const [file, setFile] = useState<File | null>(null);
    const [user, setUser] = useState<user | null>(null);
    const [profile, setProfile] = useState('https://i.ibb.co/7tKbDGFX/default-profile.jpg');
    const [username, setUsername] = useState('username');
    const [uid, setUid] = useState('');
    const [selectedServer, setSelectedServer] = useState<string | null>("me");
    const [selectedServerId, setSelectedServerId] = useState<string | null>('me');
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [servers, setServers] = useState<Servers[]>([]);
    const [channels, setChannels] = useState<Channels[]>([]);
    const [mute, setMute] = useState(true);
    const [deafen, setDeafen] = useState(false);
    const [addChannelUI, setAddChannelUI] = useState(false);
    const [addServerUI, setAddServerUI] = useState(false);
    const [channelType, setChannelType] = useState("text");
    const [channelName, setChannelName] = useState("");
    const [serverName, setServerName] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (session === undefined) return; // still loading

        if (!session) {
            router.push("/login");
        }
    }, [session, router]);

    useEffect(() => {
        const getSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            const uidValue = data.session?.user?.id ?? "";
            setUid(uidValue);
            console.log(JSON.stringify(data));
            if (error) {
                alert(error);
                return;
            }
            setSession(data.session);
            getProfile(uidValue);
        };

        getSession();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true); // start spinner
        try {
            const { url, deleteUrl } = await uploadToImgBB(file);
            setPreview(url);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false); // stop spinner regardless of success/failure
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    }

    const getProfile = async (uid: string) => {
        const { data, error } = await supabase.from("users").select("*").eq("id", uid).single();
        if (error) {
            alert(JSON.stringify(error));
            return;
        }
        setUser(data);
        setProfile(data?.profile);
        setUsername(data?.username);
    };

    const addServer = async (name: string) => {
        if (!serverName) {
            return;
        }
        const id = uuidv4();
        const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6)
        const serverCode = nanoid()
        // alert(id);
        const { data, error } = await supabase.from("server").insert({ id: id, name: name, icon: preview, serverCode: serverCode});
        if (error) {
            return;
        }
        getServers();
        setAddServerUI(false);
        setPreview(null);
        setServerName('');
    };

    const cancelServerCreation = async () => {
        try {
            // if (deleteUrl) {
            //     await fetch(deleteUrl);
            // }

            setPreview(null);
            setAddServerUI(false);
            setServerName('');

        } catch (err) {
            console.error(err);
        }
    };

    const removeServer = async (id: string) => {
        try {
            await supabase
                .from("channels")
                .delete()
                .eq("serverId", id)

            const { data, error } = await supabase
                .from("server")
                .delete()
                .eq("id", id)

            if (error) {
                console.error("Failed to delete server:", error.message);
                return;
            }

            console.log("Deleted server:", data);

            // Refresh server list or update state
            getServers();
            setSelectedServerId('me')
        } catch (err) {
            console.error("Unexpected error deleting server:", err);
        }
    };

    const addChannel = async (name: string, type: string) => {
        const id = uuidv4();
        if (!selectedServerId) {
            return;
        }
        const { data, error } = await supabase.from("channels").insert({ id: id, name: name, type: type, serverId: selectedServerId });
        if (error) {
            return;
        }
        getChannels();
        setAddChannelUI(false);
    };

    useEffect(() => {
        getServers();
        getChannels();
    }, []);

    const getServers = async () => {
        const { data, error } = await supabase.from("server").select('*');
        if (error) {
            alert(JSON.stringify(error));
            return;
        }
        setServers(data);
    };

    const getChannels = async () => {
        const { data, error } = await supabase.from("channels").select('*');
        if (error) {
            alert(JSON.stringify(error));
            return;
        }
        setChannels(data);
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    return (
        <div className="bg-[#121214] w-screen h-dvh overflow-hidden flex flex-col relative">

            {/* Add Server UI */}
            {addServerUI && (<div className="absolute w-full h-full">
                <div className="relative flex items-center justify-center w-full h-full bg-black/50">
                    <div className="absolute w-120 h-auto bg-[#242429] rounded-xl p-5 flex flex-col gap-10">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-center">
                                <span className="text-xl font-semibold">Customize Your Channel</span>
                                <IconX onClick={() => setAddServerUI(false)} stroke={2} size={20} className="cursor-pointer absolute right-5 top-5" />
                            </div>
                            <span className="text-sm text-white/50 text-center px-10">Give your new server a personality with a name and an icon. You can always change it later.</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-32 h-32">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div
                                    onClick={openFilePicker}
                                    className="w-full h-full rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-300 cursor-pointer relative overflow-hidden"
                                >
                                    {preview ? (
                                        <>
                                            {loading && (
                                                <div className="absolutes inset-0 flex items-center justify-center bg-black/20 z-10">
                                                    <TailSpin
                                                        visible={true}
                                                        height="130"
                                                        width="130"
                                                        color="#615fff"
                                                        ariaLabel="tail-spin-loading"
                                                        radius="1"
                                                    />
                                                </div>
                                            )}
                                            <img
                                                src={preview}
                                                className={`absolute w-full h-full rounded-md object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
                                                alt="Server Icon"
                                            />
                                        </>
                                    ) : (
                                        <button className="w-full h-full rounded-md flex items-center justify-center cursor-pointer">
                                            Upload
                                        </button>
                                    )}
                                </div>

                                {/* Plus Button */}
                                <button
                                    type="button"
                                    onClick={openFilePicker}
                                    className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-md hover:bg-indigo-600"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span>Server Name</span>
                            <div className="flex items-center px-3 gap-2 bg-[#202024] w-full h-12 rounded-md border border-[#303034]">
                                <input type="text" value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="new-server" className="h-full w-full focus:outline-0" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { cancelServerCreation() }} className="w-full rounded-md h-10 cursor-pointer text-white bg-white/5">Cancel</button>
                            <button onClick={() => addServer(serverName)} disabled={!serverName} className={`w-full rounded-md h-10 cursor-pointer ${serverName == '' ? 'bg-[#5865f2]/50 text-white/50' : 'bg-[#5865f2] text-white'}`}>Create Server</button>
                        </div>
                    </div>
                </div>
            </div>)}

            {/* Add Channel UI */}
            {addChannelUI && (<div className="absolute w-full h-full">
                <div className="relative flex items-center justify-center w-full h-full bg-black/50">
                    <div className="absolute w-120 h-auto bg-[#242429] rounded-xl p-6 flex flex-col gap-10">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-semibold">Create Channel</span>
                                <IconX onClick={() => setAddChannelUI(false)} stroke={2} size={20} className="cursor-pointer" />
                            </div>
                            <span className="text-sm text-white/40">in {selectedServer}</span>
                        </div>
                        <div className="flex flex-col">
                            <span>Channel Type</span>
                            <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer">
                                {/* Radio */}
                                <input
                                    type="radio"
                                    name="channelType"
                                    value="text"
                                    checked={channelType === "text"}
                                    onChange={(e) => setChannelType(e.target.value)}
                                />
                                {/* Text */}
                                <div>
                                    <div className="flex items-center gap-1 font-semibold text-white">
                                        <IconHash stroke={2} size={20} />
                                        <span>Text</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Send messages, images, GIFs, emoji, opinions, and puns
                                    </p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer">
                                {/* Radio */}
                                <input
                                    type="radio"
                                    name="channelType"
                                    value="voice"
                                    checked={channelType === "voice"}
                                    onChange={(e) => setChannelType(e.target.value)}
                                />
                                {/* Text */}
                                <div>
                                    <div className="flex items-center gap-1 font-semibold text-white">
                                        <IconVolume stroke={2} size={20} />
                                        <span>Voice</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Hang out together with voice, video, and screen share
                                    </p>
                                </div>
                            </label>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span>Channel Name</span>
                            <div className="flex items-center px-3 gap-2 bg-[#202024] w-full h-12 rounded-md border border-[#303034]">
                                {channelType == 'text' ? <IconHash stroke={2} size={20} /> : <IconVolume stroke={2} size={20} />}
                                <input type="text" value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="new-channel" className="h-full w-full focus:outline-0" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setAddChannelUI(false)} className="w-full rounded-md h-10 cursor-pointer text-white bg-white/5">Cancel</button>
                            <button onClick={() => addChannel(channelName, channelType)} className={`w-full rounded-md h-10 cursor-pointer ${channelName == '' ? 'bg-[#5865f2]/50 text-white/50' : 'bg-[#5865f2] text-white'}`}>Create Channel</button>
                        </div>
                    </div>
                </div>
            </div>)}


            {/* Header */}
            <div className="relative min-h-10 w-full flex items-center justify-center">
                <div className="absolute flex gap-5 w-auto right-0 px-2">
                    <IconInbox stroke={2} className="hover:text-white text-[#808080] cursor-pointer" />
                    <IconHelpFilled className="hover:text-white text-[#808080] cursor-pointer" />
                </div>
                <IconUserFilled color="gray" size={20} />
                <span className="text-sm">{selectedServer}</span>
            </div>
            <div className="flex flex-1 overflow-hidden">
                {/* Left Side */}
                <div className="w-85 h-full flex flex-col">
                    <div className="w-full flex-1 min-h-0 flex">
                        {/* Servers/Friends List */}
                        <div className="w-15 flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden hide-scrollbar">

                            {/* Direct Message Tab */}
                            <div onClick={() => setSelectedServerId("me")} className="flex">
                                <div className="flex gap-2 items-center justify-center group">
                                    <div className={`bg-white ${selectedServerId == 'me' ? 'h-full' : 'h-2 group-hover:h-5'} w-1 rounded-r-md`}></div>
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${selectedServerId == 'me' ? 'bg-[#5865f2]' : 'bg-white/10'} hover:bg-[#5865f2] cursor-pointer`}>
                                        <div className="w-7 h-auto overflow-hidden rounded-xl">
                                            <img src="../discord-logo.webp" alt="Direct Message" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {servers.map((server) => {
                                return (
                                    <div key={server.id} onDoubleClick={() => removeServer(server.id)} onClick={() => { setSelectedServer(server.name); setSelectedServerId(server.id) }} className="flex">
                                        <div className="flex gap-2 items-center justify-center group">
                                            <div className={`bg-white ${selectedServerId == server.id ? 'h-full' : 'h-2 group-hover:h-5'} w-1 rounded-r-md`}></div>
                                            <div className="w-10 h-10 overflow-hidden rounded-xl cursor-pointer bg-white/5 flex justify-center items-center font-semibold">
                                                {server.icon ? <img src={server.icon} alt="Direct Message" className="object-cover w-full h-full" /> :
                                                    server.name
                                                        .split(' ')
                                                        .slice(0, 3)
                                                        .map(word => word[0]?.toUpperCase())
                                                        .join('')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Add Servver */}
                            <div onClick={() => setAddServerUI(true)} className="flex">
                                <div className="flex gap-2 items-center justify-center group">
                                    <div className="h-2 w-1"></div>
                                    <div className="w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center bg-white/10 hover:bg-[#5865f2]">
                                        <IconPlus stroke={2} />
                                    </div>
                                </div>
                            </div>

                            {/* Explore Servvers */}
                            <div className="flex">
                                <div className="flex gap-2 items-center justify-center group">
                                    <div className="h-2 w-1"></div>
                                    <div className="w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center bg-white/10 hover:bg-[#5865f2]">
                                        <IconBrandSafari stroke={2} />
                                    </div>
                                </div>
                            </div>

                            {/* Download Apps */}
                            <div className="flex">
                                <div className="flex gap-2 items-center justify-center group">
                                    <div className="h-2 w-1"></div>
                                    <div className="w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center bg-white/10 hover:bg-[#5865f2]">
                                        <IconDownload stroke={2} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Server - Channels */}
                        <div className="w-70 h-full border-t border-l rounded-tl-xl border-[#303034] bg-[#121214]">
                            {selectedServerId == 'me' && (<div className="flex flex-col">
                                {/* Header */}
                                <div className="h-10 w-full border-b border-[#303034] px-2 py-1">
                                    <button className="bg-white/5 hover:bg-white/10 cursor-pointer rounded-md w-full h-full text-sm">Find or start a conversation</button>
                                </div>

                                {/* Body(Friends) */}
                                <div className="w-full h-full flex flex-col p-3">
                                    <div className="w-full h-auto flex flex-col border-b border-[#303034]">
                                        <button className="flex items-center gap-5 p-2 rounded-md hover:bg-white/10 cursor-pointer text-white/50 hover:text-white"><IconUserFilled /> Friends</button>
                                        <button className="flex items-center gap-5 p-2 rounded-md hover:bg-white/10 cursor-pointer text-white/50 hover:text-white"><IconDiamondFilled /> Nitro</button>
                                        <button className="flex items-center gap-5 p-2 rounded-md hover:bg-white/10 cursor-pointer text-white/50 hover:text-white"><IconBasketFilled /> Shop</button>
                                        <button className="flex items-center gap-5 p-2 rounded-md hover:bg-white/10 cursor-pointer text-white/50 hover:text-white"><IconZoomQuestionFilled /> Quest</button>
                                    </div>

                                    {/* Friends Tab */}
                                    <div className="w-full h-auto flex flex-col py-2">
                                        <div className="flex hover:text-white text-white/50 place-content-between">
                                            <span className="text-sm p-2">Direct Messages</span>
                                            <button className="cursor-pointer"><IconPlus stroke={2} size={20} /></button>
                                        </div>
                                        <div className="flex items-center p-2 rounded-md hover:bg-white/10 cursor-pointer text-white/50 hover:text-white place-content-between">
                                            <div className="flex gap-3 items-center">
                                                <div className="rounded-full overflow-hidden w-8 h-8">
                                                    <img src="https://i.ibb.co/7tKbDGFX/default-profile.jpg" alt="" />
                                                </div>
                                                Friend
                                            </div>
                                            <IconX stroke={2} size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>)}
                            {selectedServerId != 'me' && (<div className="flex flex-col">
                                {/* Header */}
                                <div className="h-10 w-full border-b flex gap-2 border-[#303034] px-2 py-1">
                                    <span className="hover:bg-white/10 cursor-pointer flex items-center justify-center rounded-md w-full h-full font-semibold text-sm">{selectedServer}</span>
                                    <div className="flex items-center justify-center cursor-pointer hover:bg-white/10 p-1 rounded-md">
                                        <IconUserPlus stroke={2} size={20} />
                                    </div>
                                </div>

                                {/* Body(Friends) */}
                                <div className="w-full h-full flex flex-col p-3">
                                    <div className="w-full h-auto flex gap-3 flex-col">
                                        <div className="flex items-center cursor-pointer text-sm place-content-between text-white/50 hover:text-white">
                                            <div className="flex items-center gap-2">
                                                Text Channels
                                                <IconChevronDown stroke={2} size={15} />
                                            </div>
                                            <IconPlus onClick={() => setAddChannelUI(true)} stroke={2} size={15} />
                                        </div>
                                        {channels
                                            .filter(channel => channel.serverId === selectedServerId && channel.type === 'text')
                                            .map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => {
                                                        setSelectedChannel(channel.name);
                                                        setSelectedChannelId(channel.id);
                                                    }}
                                                    className={`flex items-center gap-2 p-1 rounded-md hover:bg-white/10 cursor-pointer w-full hover:text-white ${selectedChannelId === channel.id ? 'bg-[#2c2c30] text-white' : 'text-white/50'
                                                        }`}
                                                >
                                                    <IconHash stroke={2} size={20} /> {channel.name}
                                                </button>
                                            ))}
                                        <div className="flex items-center cursor-pointer text-sm place-content-between text-white/50 hover:text-white">
                                            <div className="flex items-center gap-2">
                                                Voice Channels
                                                <IconChevronDown stroke={2} size={15} />
                                            </div>
                                            <IconPlus onClick={() => setAddChannelUI(true)} stroke={2} size={15} />
                                        </div>
                                        {channels
                                            .filter(channel => channel.serverId === selectedServerId && channel.type === 'voice')
                                            .map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => setSelectedChannel('Voice Channel WIP')}
                                                    className={`flex items-center gap-2 p-1 rounded-md hover:bg-white/10 cursor-pointer hover:text-white ${selectedChannel === channel.id ? 'bg-[#2c2c30] text-white' : 'text-white/50'
                                                        }`}
                                                >
                                                    <IconVolume stroke={2} size={20} /> {channel.name}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>)}
                        </div>
                    </div>
                    {/* Bottom */}
                    <div className="w-full h-18 p-2">
                        <div className="w-full h-full border border-[#303034] rounded-md bg-[#202024] flex gap-2 items-center px-1">
                            <div onClick={handleLogout} className="flex items-center gap-3 hover:bg-[#333338] h-[90%] w-1/2 rounded-md cursor-pointer">
                                {/* Profile Pic */}
                                <div className="rounded-full w-8 h-8 overflow-hidden">
                                    <img src={profile} alt="Profile Image" className="object-cover w-full h-full" />
                                </div>

                                {/* Username/Status */}
                                <div className="flex flex-col">
                                    <span className="font-semibold text-md">{username}</span>
                                    <span className="text-xs text-gray-300">Online</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 h-[90%] w-1/2">
                                {/* Microphone */}
                                <div className={`flex rounded-md ${mute ? 'bg-red-900/20' : 'bg-transparent'} group`}>
                                    <div className={`border-r border-[#202024] cursor-pointer p-2 ${mute ? 'hover:bg-red-600/20' : 'hover:bg-white/20 group-hover:bg-white/5'} rounded-l-md`} onClick={() => setMute(!mute)}>
                                        {!mute && (<IconMicrophone stroke={1} size={20} />)}
                                        {mute && (<IconMicrophoneOff size={20} color="red" />)}
                                    </div>
                                    <div className={`flex items-center ${mute ? 'hover:bg-red-600/20' : 'hover:bg-white/20 group-hover:bg-white/5'} rounded-r-md cursor-pointer`}>
                                        <IconChevronDown stroke={2} size={20} color={`${mute ? "red" : "white"}`} />
                                    </div>
                                </div>

                                {/* Deafen */}
                                <div className={`flex rounded-md ${deafen ? 'bg-red-900/20' : 'bg-transparent'} group`}>
                                    <div className={`border-r border-[#202024] cursor-pointer p-2 ${deafen ? 'hover:bg-red-600/20' : 'hover:bg-white/20 group-hover:bg-white/5'} rounded-l-md`} onClick={() => setDeafen(!deafen)}>
                                        {!deafen && (<IconHeadphonesFilled size={20} />)}
                                        {deafen && (<IconHeadphonesOff stroke={2} size={20} color="red" />)}
                                    </div>
                                    <div className={`flex items-center ${deafen ? 'hover:bg-red-600/20' : 'hover:bg-white/20 group-hover:bg-white/5'} rounded-r-md cursor-pointer`}>
                                        <IconChevronDown stroke={2} size={20} color={`${deafen ? "red" : "white"}`} />
                                    </div>
                                </div>

                                <div className="hover:bg-white/10 rounded-md p-1 cursor-pointer">
                                    <IconSettingsFilled size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="h-full w-full bg-[#1a1a1e] border-t border-[#303034] flex flex-col">
                    <MessagesPage selectedChannel={selectedChannel ?? ""} selectedChannelId={selectedChannelId ?? ""} user={user!} />
                </div>
            </div>
        </div>
    );
}
