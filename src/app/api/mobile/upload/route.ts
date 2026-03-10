import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = (formData as any).get("file") as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        const utapi = new UTApi();
        const response = await utapi.uploadFiles(file);

        if (response.error) {
            return new NextResponse(response.error.message, { status: 500 });
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.log("[MOBILE_UPLOAD_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
