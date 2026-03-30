import { IconDotsFilled } from "@tabler/icons-react";
import { MouseEventHandler } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { deleteUser, signOut } from "@/services/auth";
import { useRouter } from "next/navigation";

interface user {
    id: string;
    email: string;
    username: string;
    refcode: string;
    profile: string;
    created_at: string;
}

interface Props {
    user?: user;
    edit: MouseEventHandler<HTMLButtonElement>;
};

export default function MyAccount({ user, edit }: Props) {
    const router = useRouter();

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert("Copied!");
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const removerUser = async () => {
        if (!user?.id) { return; }
        alert(user.id)
        // const { error } = await supabase
        //     .from("users")
        //     .delete()
        //     .eq("id", user.id);

        await signOut();
        await deleteUser(user.id);
        router.push("/login");

        // if (error) {
        //     alert("Failed to Delete User:" + error.message);
        //     return;
        // }
    }
    return (
        <div className="flex flex-col gap-15 items-center h-full w-full text-center text-white/70 overflow-y-auto px-60 py-30 scrollbar-minimal">
            {/* Profile Card */}
            <div className="flex flex-col items-start relative bg-[#121214] w-full min-h-120 rounded-xl overflow-hidden">
                {/* Banner */}
                <div className="w-full min-h-[20%] bg-purple-300"></div>
                {/* Profile */}
                <div className="flex flex-col w-full h-full px-5 pb-5">
                    <div className="flex w-full">
                        <div className="relative min-w-28 min-h-20">
                            <div className="w-25 h-25 absolute z-10 -top-6 rounded-full overflow-hidden border-6 border-[#121214]">
                                <img src={user?.profile} alt="" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex place-content-between w-full items-center h-15">
                            <div className="flex gap-2 items-center">
                                <label className="font-semibold text-xl text-white">{user?.username}</label>
                                <label className="font-semibold text-xl text-white/50 hover:text-white/80 cursor-pointer"><IconDotsFilled /></label>
                            </div>
                            <button onClick={edit} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Edit User profile</button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-5 bg-[#1a1a1e] w-full h-full rounded-md p-5">
                        {/* Username */}
                        <div className="flex items-center place-content-between">
                            <div className="flex flex-col items-start">
                                <label className="text-white">Username</label>
                                <label className="text-white font-semibold">{user?.username}</label>
                            </div>
                            <button onClick={edit} className="bg-[#242428] px-4 py-2 h-8 flex items-center rounded-md text-sm text-white hover:bg-[#2e2e33] cursor-pointer border border-[#303034]">Edit</button>
                        </div>
                        {/* Email */}
                        <div className="flex items-center place-content-between">
                            <div className="flex flex-col items-start">
                                <label className="text-white">Email</label>
                                <label className="text-white font-semibold">{user?.email}</label>
                            </div>
                            <button onClick={edit} className="bg-[#242428] px-4 py-2 h-8 flex items-center rounded-md text-sm text-white hover:bg-[#2e2e33] cursor-pointer border border-[#303034]">Edit</button>
                        </div>
                        {/* Referal Code */}
                        <div className="flex items-center place-content-between">
                            <div className="flex flex-col items-start">
                                <label className="text-white">Referal Code</label>
                                <label className="text-white font-semibold">{user?.refcode}</label>
                            </div>
                            <button onClick={() => { copyText(user!.refcode) }} className="bg-[#242428] px-4 py-2 h-8 flex items-center rounded-md text-sm text-white hover:bg-[#2e2e33] cursor-pointer border border-[#303034]">Copy</button>
                        </div>
                        {/* Created At */}
                        <div className="flex items-center place-content-between">
                            <div className="flex flex-col items-start">
                                <label className="text-white">Created At</label>
                                <label className="text-white font-semibold">{user?.created_at && format(new Date(user.created_at.slice(0, 23)), "dd / MM / yyyy")}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#303034] w-full" />

            <div className="flex flex-col items-start w-full gap-10">
                <label className="text-2xl text-white">Password and Authentication</label>
                <button onClick={(edit)} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Change Password</button>
                <div className="flex flex-col gap-2 text-start">
                    <label className="text-white font-semibold">Authenticator App</label>
                    <label className="text-sm">Configuring an authenticator app is a good way to add an extra layer of security to your Discord account to make sure that only you have the ability to log in.</label>
                    <div className="flex gap-2">
                        <button onClick={() => { }} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">View Backup Codes</button>
                        <button onClick={() => { }} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Enable Authenticator App</button>
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-start">
                    <label className="text-white font-semibold">Security Keys</label>
                    <label className="text-sm">Add an additional layer of protection to your account with a Security Key.</label>
                    <div className="flex gap-2">
                        <button onClick={edit} className="text-white hover:bg-[#4c5ad1] bg-[#5865f2] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Enable Authenticator App</button>
                    </div>
                </div>
            </div>

            <div className="border border-[#303034] w-full" />

            <div className="flex flex-col items-start w-full gap-10">
                <div className="flex flex-col gap-2 text-start">
                    <label className="text-white font-semibold">Account Removal</label>
                    <label className="text-sm">Deleting your account means you can not recover it at any cost after taking this action.</label>
                    <div className="flex gap-2">
                        <button onClick={removerUser} className="text-white hover:bg-[#a70c21] bg-[#d22d39] px-2 py-1 rounded-md h-8 text-sm cursor-pointer">Delete Account</button>
                    </div>
                </div>
            </div>
        </div>
    );
}