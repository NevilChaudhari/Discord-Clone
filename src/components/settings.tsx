"use client";

import { signOut } from "@/services/auth";
import { IconAccessibleFilled, IconAppsFilled, IconBellFilled, IconCaretLeftFilled, IconChevronRightFilled, IconCoinRupeeFilled, IconConfettiFilled, IconCreditCardFilled, IconDeviceDesktopFilled, IconDiamondsFilled, IconGiftFilled, IconKeyboardFilled, IconLinkFilled, IconMeteorFilled, IconMicrophoneFilled, IconPaletteFilled, IconPencilFilled, IconSearch, IconShieldCheckFilled, IconShieldLockFilled, IconStarFilled, IconUserFilled, IconWorldFilled, IconXFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { MouseEventHandler, useState } from "react";
import WIP from "./wip";
import MyAccount from "./Settings/MyAccount";
import Profile from "./Settings/Profile";

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

interface SettingsUiProps {
    user?: user;
    close: MouseEventHandler<HTMLDivElement>;
    save?: () => void;
    defaultTab?: string;
};

const settingsSections = [
    {
        label: "User Settings",
        items: [
            { id: "1", label: "My Account", icon: IconUserFilled },
            { id: "2", label: "Content & Social", icon: IconShieldCheckFilled },
            { id: "3", label: "Data & Privacy", icon: IconShieldLockFilled },
            { id: "4", label: "Family Center", icon: IconUserFilled },
            { id: "5", label: "Authorized Apps", icon: IconAppsFilled },
            { id: "6", label: "Devices", icon: IconDeviceDesktopFilled },
            { id: "7", label: "Connections", icon: IconLinkFilled },
            { id: "8", label: "Notifications", icon: IconBellFilled },
        ],
    },
    {
        label: "Billing Settings",
        items: [
            { id: "9", label: "Nitro", icon: IconMeteorFilled },
            { id: "10", label: "Server Boost", icon: IconDiamondsFilled },
            { id: "11", label: "Subscription", icon: IconCoinRupeeFilled },
            { id: "12", label: "Gift Inventory", icon: IconGiftFilled },
            { id: "13", label: "Billing", icon: IconCreditCardFilled },
        ],
    },
    {
        label: "App Settings",
        items: [
            { id: "14", label: "Voice & Video", icon: IconMicrophoneFilled },
            { id: "15", label: "Display", icon: IconPaletteFilled },
            { id: "16", label: "Accessibility", icon: IconAccessibleFilled },
            { id: "17", label: "Party Mode", icon: IconConfettiFilled },
            { id: "18", label: "Keybinds", icon: IconKeyboardFilled },
            { id: "19", label: "Language & Time", icon: IconWorldFilled },
        ],
    },
];

export default function SettingsUi({ user, close, save, defaultTab = 'My Account' }: SettingsUiProps) {
    const router = useRouter();

    const [search, setSearch] = useState('');
    const [openedTab, setOpenedTab] = useState('');

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    }

    return (
        <div className="flex items-center justify-center w-full h-full bg-black/50">
            {/* Main Area */}
            <div className="flex md:w-350 md:h-200 w-full h-full md:rounded-xl border border-[#303034] overflow-hidden">
                {/* Left Area */}
                <div className={`md:flex bg-[#1a1a1e] h-full w-full md:w-[21%] flex-col ${openedTab ? 'hidden' : 'block'}`}>
                    <div className="md:hidden flex w-full p-2 place-content-end">
                        <div className="flex cursor-pointer h-7 items-end" onClick={close}>
                            <IconXFilled size={20} color="gray" />
                        </div>
                    </div>
                    <div className="flex flex-col p-4 gap-2">
                        {/* Profile tab */}
                        <div onClick={() => { setOpenedTab('Profile') }} className={`${openedTab === 'Profile' ? 'bg-[#2e2e33] text-white' : 'hover:bg-[#1f1f23] text-white/50 hover:text-white'} flex items-center gap-3 group h-15 w-full rounded-md cursor-pointer px-2 py-2`}>
                            {/* Profile Pic */}
                            <div className="rounded-full w-12 h-12 overflow-hidden">
                                <img src={user?.profile} alt="Profile Image" className="object-cover w-full h-full" />
                            </div>

                            {/* Username/Status */}
                            <div className="flex flex-col">
                                <span className="font-semibold text-md text-white">{user?.username}</span>
                                <span className="text-xs flex gap-2">Edit Profile<IconPencilFilled size={15} /></span>
                            </div>
                        </div>

                        {/* Search box */}
                        <div className="flex gap-2 border border-[#303034] bg-[#17171a] w-full h-12 rounded-md items-center px-2">
                            <IconSearch stroke={2} size={20} />
                            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value) }} className="focus-within:outline-0 w-full h-full" placeholder="Search" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex pl-4 flex-col w-full h-full overflow-y-auto scrollbar-minimal">
                        {settingsSections.map((section, index) => (
                            <div key={index}>
                                <label className="text-white/50 text-xs px-2 pt-3">
                                    {section.label}
                                </label>

                                <div className="flex flex-col gap-1 border-b border-[#303034] py-2">
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setOpenedTab(item.label)}
                                            className={`flex gap-2 items-center rounded-md w-full h-9 px-2 cursor-pointer
                                                ${openedTab === item.label
                                                    ? "text-white bg-[#2e2e33]"
                                                    : "text-white/50 hover:bg-[#1f1f23] hover:text-white"
                                                }`}
                                        >
                                            <item.icon size={20} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Activity */}
                        <label className="text-white/50 text-xs px-2 pt-3">Activity Settings</label>
                        <div className="flex flex-col gap-1 border-b border-[#303034] py-2">
                            <button
                                onClick={() => setOpenedTab('Activity Privacy')}
                                className={`flex gap-2 items-center rounded-md w-full h-9 px-2 cursor-pointer
                                    ${openedTab === 'Activity Privacy'
                                        ? "text-white bg-[#2e2e33]"
                                        : "text-white/50 hover:bg-[#1f1f23] hover:text-white"
                                    }`}
                            >
                                <IconUserFilled size={20} />
                                Activity Privacy
                            </button>
                        </div>

                        {/* Logout */}
                        <div className="flex flex-col gap-1 py-2">
                            <button onClick={handleLogout} className="flex gap-2 items-center hover:bg-[#281c20] rounded-md w-full h-9 px-2 text-red-500 cursor-pointer">
                                <IconChevronRightFilled size={20} />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
                {/* Right Area */}
                <div className={`md:flex flex-col bg-[#202024] h-full w-full ${openedTab ? 'block' : 'hidden'}`}>
                    <div className="flex w-full min-h-12 items-center border-b border-[#303034] px-5 place-content-between">
                        <div className="flex items-center gap-2 text-white">
                            <div className="flex hover:text-white cursor-pointer md:hidden" onClick={() => setOpenedTab('')}><IconCaretLeftFilled color="gray" /></div>
                            <label>{openedTab}</label>
                        </div>
                        <div onClick={close} className="flex items-center justify-center w-7 h-7 cursor-pointer hover:bg-[#323237] md:rounded-md"><IconXFilled size={20} /></div>
                    </div>

                    {openedTab === 'My Account' && (<MyAccount user={user} edit={() => setOpenedTab('Profile')} />)}
                    {openedTab === 'Profile' && (<Profile user={user} edit={() => setOpenedTab('Profile')} save={save} />)}
                    {openedTab != 'Profile' && openedTab != 'My Account' && (<WIP />)}
                </div>
            </div>
        </div>
    );
}