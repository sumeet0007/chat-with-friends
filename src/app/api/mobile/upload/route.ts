import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!process.env.UPLOADTHING_TOKEN) {
            console.error("[MOBILE_UPLOAD] UPLOADTHING_TOKEN is missing in environment variables");
            return new NextResponse("Upload configuration missing", { status: 500 });
        }

        const formData = await req.formData();
        const file = (formData as any).get("file") as File;

        if (!file) {
            console.error("[MOBILE_UPLOAD] No file found in form data");
            return new NextResponse("No file provided", { status: 400 });
        }

        console.log(`[MOBILE_UPLOAD] Attempting to upload file: ${file.name} (${file.size} bytes)`);

        const utapi = new UTApi();
        const response = await utapi.uploadFiles(file);

        if (response.error) {
            console.error("[MOBILE_UPLOAD] UploadThing Error:", response.error);
            return new NextResponse(response.error.message, { status: 500 });
        }

        console.log("[MOBILE_UPLOAD] Upload successful:", response.data.url);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("[MOBILE_UPLOAD_POST_ERROR]", {
            message: error.message,
            stack: error.stack
        });
        return new NextResponse("Internal Error", { status: 500 });
    }
}
