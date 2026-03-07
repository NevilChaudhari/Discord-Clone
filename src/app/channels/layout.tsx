"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconInbox, IconHelpFilled, IconUserFilled, IconBasketFilled, IconBrandSafari, IconChevronDown, IconDiamondFilled, IconDownload, IconHeadphonesFilled, IconHeadphonesOff, IconMicrophone, IconMicrophoneOff, IconPlus, IconSettingsFilled, IconX, IconZoomQuestionFilled } from "@tabler/icons-react";
import { profile } from "console";
import { signOut } from "@/services/auth";
import { supabase } from "@/lib/supabase";
import { uploadToImgBB } from "@/lib/imgbb";

interface Servers {
    id: string;
    name: string;
}

export default function ChannelsLayout({ children }: { children: ReactNode }) {
    // const { channelId } = useParams();

    const handleSelectServer = (id: string) => {
        router.push(`/channels/${id}/${id}`);
        setSelectedServer(id)
    };

    const router = useRouter();

    const [session, setSession] = useState<any>(undefined);
    const [file, setFile] = useState<File | null>(null);
    const [profile, setProfile] = useState('https://i.ibb.co/7tKbDGFX/default-profile.jpg');
    const [username, setUsername] = useState('username');
    const [uid, setUid] = useState('');
    const [selectedServer, setSelectedServer] = useState<string | null>(null);
    const [servers, setServers] = useState<Servers[]>([]);
    const [mute, setMute] = useState(true);
    const [deafen, setDeafen] = useState(false);

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

    const handleUpload = async () => {
        try {
            if (!file) return;
            const url = await uploadToImgBB(file);

            const { data, error } = await supabase
                .from("users")
                .update({ profile: url })
                .eq("id", uid);

            if (error) throw error;
            getProfile(uid);

        } catch (err) {
            console.error(err);
            return null;
        }
    }

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
        setProfile(data?.profile);
        setUsername(data?.username);
    };

    const addServer = async () => {
        const { data, error } = await supabase.from("channels").insert({ id: 3, name: "test3" });
        if (error) {
            alert(JSON.stringify(error));
            return;
        }
    };

    useEffect(() => {
        getServers();
    }, []);

    const getServers = async () => {
        const { data, error } = await supabase.from("channels").select('*');
        if (error) {
            alert(JSON.stringify(error));
            return;
        }
        setServers(data);
    };


    return (
        <div className="bg-[#121214] w-screen h-dvh overflow-hidden flex flex-col">
            {/* Header */}
            <div className="relative min-h-10 w-full flex items-center justify-center">
                <div className="absolute flex gap-5 w-auto right-0 px-2">
                    <IconInbox stroke={2} className="hover:text-white text-[#808080] cursor-pointer" />
                    <IconHelpFilled className="hover:text-white text-[#808080] cursor-pointer" />
                </div>
                <IconUserFilled color="gray" size={20} />
                <span className="text-sm">Friends</span>
            </div>
            {/* Main content area: left sidebar + middle content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Side */}
                <div className="w-85 h-full flex flex-col">
                    <div className="w-full flex-1 min-h-0 flex">
                        {/* Servers/Friends List */}
                        <div className="w-15 flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden hide-scrollbar">

                            {/* Direct Message Tab */}
                            <div onClick={() => handleSelectServer("messages")} className="flex">
                                <div className="flex gap-2 items-center justify-center group">
                                    <div className={`bg-white ${selectedServer == 'messages' ? 'h-full' : 'h-2 group-hover:h-5'} w-1 rounded-r-md`}></div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-[#5865f2] cursor-pointer">
                                        <div className="w-7 h-auto overflow-hidden rounded-xl">
                                            <img src="../discord-logo.webp" alt="Direct Message" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {servers.map((server, index) => {
                                return (
                                    <div key={index} onClick={() => handleSelectServer(server.name)} className="flex">
                                        <div className="flex gap-2 items-center justify-center group">
                                            <div className={`bg-white ${selectedServer == server.name ? 'h-full' : 'h-2 group-hover:h-5'} w-1 rounded-r-md`}></div>
                                            <div className="w-10 h-auto overflow-hidden rounded-xl cursor-pointer">
                                                <img src="../Discord.jpg" alt="Direct Message" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Add Servver */}
                            <div onClick={addServer} className="flex">
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
                <div className="h-full w-full bg-[#1a1a1e] border-t border-[#303034] flex flex-col">
                    {children}
                </div>

            </div>
        </div>
    );
}