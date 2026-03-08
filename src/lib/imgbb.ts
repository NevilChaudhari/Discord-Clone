// /lib/imgbb.ts

type ImgBBUploadResult = {
    url: string;
    deleteUrl: string;
};

export async function uploadToImgBB(file: File): Promise<ImgBBUploadResult> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);

    const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!data.success) throw new Error("ImgBB upload failed");

    return {
        url: data.data.url,
        deleteUrl: data.data.delete_url,
    };
}