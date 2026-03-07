// /lib/imgbb.ts
export async function uploadToImgBB(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!); // Make this public for client-side

    const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!data.success) throw new Error("ImgBB upload failed");

    return data.data.url; // public image URL
}