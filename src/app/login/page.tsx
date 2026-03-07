'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/services/auth";


export default function login() {
    const router = useRouter();

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSignIn = async () => {
        const data = await signIn(email, password);
        // alert(data);
        if (data?.error) {
            setError(data.error.message);
            return;
        }
        router.push("/");
    };

    const handleRegister = () => {
        router.push("/register");
    }

    return (
        <div className="relative flex items-center justify-center w-screen h-screen overflow-hidden">
            <img src="./authBG.jpg" alt="" className="absolute object-cover -z-1" />

            {/* Login Box */}
            <div className="bg-[#393a41] w-150 h-auto rounded-md p-10 flex flex-col gap-5 items-start">
                <div className="flex flex-col items-center justify-center w-full">
                    <label className="font-semibold text-xl">Welcome Back</label>
                    <label className="text-md text-white/80">We are so excited to see you again!</label>
                </div>

                {/* Email or Phone Input */}
                <div className="flex flex-col gap-2 w-full">
                    <label className="font text-sm">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" className="bg-[#35353c] h-12 rounded-md border border-gray-600" />
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-2 w-full">
                    <label className="font text-sm">Password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="bg-[#35353c] h-12 rounded-md border border-gray-600" />

                    {/* Forgot Password */}
                    <button className="text-start text-sm text-[#8d9ce7] cursor-pointer">Forgot your Password?</button>
                </div>

                {/* Login Button */}
                {error !=='' && (<label className="font text-sm text-red-600">{error}</label>)}

                <button className="bg-[#5865f2] w-full h-10 rounded-md cursor-pointer hover:bg-[#5865f2]/70" onClick={handleSignIn}>Log In</button>
                <div className="flex gap-1">
                    <label className="text-start text-sm text-gray-500">Need an account?</label>
                    <button className="text-start text-sm text-[#8d9ce7] hover:underline cursor-pointer" onClick={handleRegister}>Register</button>
                </div>
            </div>
        </div>
    );
}
