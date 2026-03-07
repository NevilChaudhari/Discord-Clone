"use client";

import { IconHash } from "@tabler/icons-react";
import { useParams } from "next/navigation";

type UserCardProps = {
    selectedChannel: string;
};

export default function MessagesPage({ selectedChannel }: UserCardProps) {
    const { serverId } = useParams();

    return (
        <div className="flex flex-col flex-1 text-white">
            <div className="h-10 flex items-center px-3 w-full border-b border-[#303034]">
                <div className="flex gap-3">
                    <IconHash stroke={2} size={20} color="gray" />{selectedChannel}
                </div>
            </div>
        </div>
    );
}