"use client";

import { useParams } from "next/navigation";

export default function ChannelPage() {
    const { serverId } = useParams();

    return (
        <div className="flex flex-col flex-1 p-6 text-white">
            <h1 className="text-xl font-bold mb-2">Channel: {serverId}</h1>
            <div className="flex-1 bg-[#2a2a2e] rounded p-4 overflow-auto">
                {/* Your channel's messages, channels, or other dynamic content here */}
                <p>This is where the content for the channel <strong>{serverId}</strong> will appear.</p>
            </div>
        </div>
    );
}