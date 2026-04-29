import { IconDotsFilled, IconPencilFilled } from "@tabler/icons-react";
import { MouseEventHandler, useEffect, useRef, useState } from "react";
import { format, set } from "date-fns";
import { supabase } from "@/lib/supabase";
import { deleteUser, signOut } from "@/services/auth";
import { useRouter } from "next/navigation";
import { uploadToImgBB } from "@/lib/imgbb";

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

interface Props {
    user?: user;
    edit: MouseEventHandler<HTMLButtonElement>;
    save?: () => void;
};

export default function Profile({ user, edit, save }: Props) {

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [bannerColor, setBannerColor] = useState("#e9eaff");
    const [saveUI, setSaveUI] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const maxBioChars = 190;

    useEffect(() => {
        setUsername(user!.username);
        setBio(user!.bio);
        setBannerColor(user!.banner);
        setPreview(user!.profile);
    }, [user])

    useEffect(() => {
        if (!user) { return; }
        if (user.username != username || user.bio != bio || user.banner != bannerColor || (preview != user.profile && preview != null)) {
            console.log('changed');
            setSaveUI(true);
        } else {
            setSaveUI(false);
        }
    }, [username, bio, bannerColor, preview])

    const handleReset = () => {
        setSaveUI(false);
        setUsername(user!.username);
        setBio(user!.bio);
        setBannerColor(user!.banner);
        setPreview(user!.profile);
    }
    const handleSave = async () => {
        setSaveUI(false);
        const { error } = await supabase.from('users').update({ username: username, bio: bio, banner: bannerColor, profile: preview }).eq('id', user!.id);
        const { data, error: selectError } = await supabase.from("users").select("*").eq("id", user!.id).single();
        if (error || selectError) {
            console.log(error || selectError);
        } else {
            setUsername(data?.username);
            setBio(data?.bio);
            setBannerColor(data?.banner);
            setPreview(data?.profile);

            console.log('updated');
        }
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

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
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex md:flex-row flex-col items-center gap-5 h-full w-full text-center relative text-white/70 overflow-y-auto scrollbar-minimal px-5 py-15 md:px-60 md:py-30">
                {/* Left Side */}
                <div className="flex flex-col gap-5 text-start w-full md:min-w-[50%] h-full order-2 md:order-1">
                    {/* Username */}
                    <div className="flex flex-col gap-1">
                        <label className="text-white">Username</label>
                        <input type="text" value={username} onChange={(e) => { setUsername(e.target.value) }} className="bg-[#1c1c20] w-full h-10 px-2 py-1 border border-[#303034] rounded-md" />
                    </div>

                    <div className="border-b border-[#303034] w-full" />

                    {/* Profile */}
                    <div className="flex flex-col gap-1">
                        <label className="text-white">Avatar</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange} />
                            <button onClick={() => { openFilePicker() }} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Change Avatar</button>
                            <button onClick={() => { setPreview('https://i.ibb.co/7tKbDGFX/default-profile.jpg') }} className="text-white hover:bg-[#333338] bg-[#29292d] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Remove Avatar</button>
                        </div>
                    </div>

                    <div className="border-b border-[#303034] w-full" />

                    {/* Profile Decoration */}
                    <div className="flex flex-col gap-1">
                        <label className="text-white">Avatar Decoration</label>
                        <div className="flex gap-2">
                            <button onClick={() => { }} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Change Decoration</button>
                        </div>
                    </div>

                    <div className="border-b border-[#303034] w-full" />

                    {/* Nameplate */}
                    <div className="flex flex-col gap-1">
                        <label className="text-white">Nameplate</label>
                        <div className="flex gap-2">
                            <button onClick={() => { }} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Change Nameplate</button>
                        </div>
                    </div>

                    <div className="border-b border-[#303034] w-full" />

                    {/* Profile Effect */}
                    <div className="flex flex-col gap-1">
                        <label className="text-white">Profile Effect</label>
                        <div className="flex gap-2">
                            <button onClick={() => { }} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Change Effect</button>
                        </div>
                    </div>

                    <div className="border-b border-[#303034] w-full" />

                    {/* Banner Color */}
                    <div className="flex flex-col gap-1">
                        <label className="text-white">Banner Color</label>
                        <div className="flex gap-2 w-18 h-13 items-center rounded-md overflow-hidden relative" style={{ backgroundColor: bannerColor }}>
                            <input
                                type="color"
                                value={bannerColor}
                                onChange={(e) => setBannerColor(e.target.value)}
                                className="opacity-0 w-full h-full cursor-pointer"
                            />
                            <div className="absolute text-black top-0 right-0 p-1">
                                <IconPencilFilled size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-[#303034] w-full" />

                    {/* Bio */}
                    <div className="flex flex-col gap-1 w-full">
                        <label className="text-white">Bio</label>
                        <div className="flex gap-2 relative">
                            <textarea value={bio} onChange={(e) => { setBio(e.target.value) }} className="bg-[#19191c] rounded-md border border-[#303034] focus:outline-0 resize-none w-full min-h-40 scrollbar-minimal" />
                            <p className="text-sm text-gray-500 mt-1">
                                <label className="text-white absolute bottom-2 right-5 font-semibold">{maxBioChars - bio.length}</label>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col gap-10 h-auto w-full text-start w-[50%] md:sticky top-0 order-1 md:order-2">
                    {/* Profile card preview */}
                    <div className="flex flex-col w-full gap-1">
                        <label className="text-white">Preview</label>
                        {/* Profile Card */}
                        <div className="flex flex-col items-start relative bg-[#242429] w-full h-100 rounded-xl overflow-hidden shadow-xl">
                            {/* Banner */}
                            <div className="w-full min-h-30" style={{ backgroundColor: bannerColor }}></div>
                            {/* Profile */}
                            <div className="flex flex-col w-full h-full px-5 pb-5">
                                <div className="flex w-full">
                                    <div className="relative min-w-28 min-h-13">
                                        <div className="w-25 h-25 absolute z-10 -top-15 rounded-full overflow-hidden border-6 border-[#242429]">
                                            <img src={preview ? preview : user?.profile} alt="" className="w-full h-full object-cover" />
                                            {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start place-content-between h-full w-full">
                                    <label className="text-white font-semibold text-xl">{username}</label>
                                    <label className="text-white text-sm">{bio}</label>
                                    <button onClick={(edit)} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer w-full">Sample button</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nameplate */}
                    <div className="flex flex-col gap-1 w-full">
                        <label className="text-white">Nameplate</label>
                        <div className="flex w-full h-12 items-center gap-2 bg-[#333338] rounded-md px-2">
                            <div className="rounded-full overflow-hidden w-9 h-9">
                                <img src={user?.profile} alt="" className="w-full h-full object-cover" />
                            </div>
                            <label className="text-white font-semibold">{username}</label>
                        </div>
                    </div>
                </div>

                {/* save UI */}
                {saveUI && (<div className="flex fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#2c2d32] p-2 rounded-md w-full px-5 md:px-0 md:min-w-[60%] place-content-between items-center shadow-xl">
                    <label className="text-white text-sm font-semibold">Careful — you have unsaved changes!</label>
                    <div className="flex">
                        <button className="text-[#98afff] hover:text-[#6c79b6] py-2 px-4 rounded-md cursor-pointer hover:underline" onClick={handleReset}>
                            Reset
                        </button>
                        <button className="bg-[#008545] hover:bg-[#006c37] text-white py-2 px-4 rounded-md cursor-pointer" onClick={() => { handleSave(); save && save(); }}>
                            Save Changes
                        </button>
                    </div>
                </div>)}
            </div>
        </>
    );
}