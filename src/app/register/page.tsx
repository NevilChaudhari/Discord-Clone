'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "../../services/auth";
import { customAlphabet } from "nanoid";


export default function register() {
    const router = useRouter();

    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handleSignUp = async () => {
        if (!email || !username || !password) {
            alert('Empty Fields');
            return;
        }
        const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6)
        const refCode = nanoid()
        alert(refCode);
        signUp(email, username, password, refCode);
        router.push("/login");
    };

    const handleLogin = () => {
        router.push("/login");
    }

    return (
        <div className="relative flex items-center justify-center w-screen h-screen overflow-hidden">
            <img src="./authBG.jpg" alt="" className="absolute object-cover -z-1" />

            {/* Login Box */}
            <div className="bg-[#393a41] w-130 h-auto rounded-md p-10 flex flex-col gap-5 items-center">
                <label className="font-semibold text-xl">Create an account</label>

                {/* Email or Phone Input */}
                <div className="flex flex-col gap-2 w-full">
                    <label className="font text-sm">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="px-2 bg-[#35353c] h-12 rounded-md border border-gray-600" />
                </div>

                {/* Username */}
                <div className="flex flex-col gap-2 w-full">
                    <label className="font text-sm">Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" className="px-2 bg-[#35353c] h-12 rounded-md border border-gray-600" />
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-2 w-full">
                    <label className="font text-sm">Password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="px-2 bg-[#35353c] h-12 rounded-md border border-gray-600" />
                </div>

                {/* Login Button */}
                <button className="bg-[#5865f2] w-full h-10 rounded-md cursor-pointer hover:bg-[#5865f2]/70" onClick={handleSignUp}>Create Account</button>
                <div className="flex gap-1">
                    <label className="text-start text-sm text-gray-500">Alreadt have an account?</label>
                    <button className="text-start text-sm text-[#8d9ce7] hover:underline cursor-pointer" onClick={handleLogin}>Log in</button>
                </div>
            </div>
        </div>
    );
}
