"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadToImgBB } from "@/lib/imgbb";
import { useRouter } from "next/navigation";
import { signOut } from "@/services/auth";

export default function Home() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState('https://i.ibb.co/7tKbDGFX/default-profile.jpg');
  const [uid, setUid] = useState('');

  useEffect(() => {
    if (session === null) return;
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
  }

  const getProfile = async (uid: string) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", uid).single();
    if (error) {
      alert(JSON.stringify(error));
      return;
    }
    setProfile(data?.profile);
  };

  return (
    <div>
      <span>{session ? session.user.email : "Not logged in"}</span><br />
      <span>{profile}</span>
      {profile != '' && (<img src={profile} className="w-100 h-100" />)}
      <input type="file" className="border" onChange={(e) => setFile(e.target.files?.[0] || null)} /><br />
      <button className=" px-5 py-5 border cursor-pointer" onClick={handleUpload}>Upload</button><br />
      <button className=" px-5 py-5 border cursor-pointer bg-red-400" onClick={handleLogout}>Logout</button>
    </div>
  );
}