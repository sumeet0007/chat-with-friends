import "@uploadthing/react/styles.css";

import { UploadDropzone } from "@/lib/uploadthing";

import { X } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface FileUploadProps {
    onChange: (url?: string) => void;
    value: string;
    endpoint: "messageFile" | "serverImage"
}

export const FileUpload = ({
    onChange,
    value,
    endpoint
}: FileUploadProps) => {
    const fileType = value?.split(".").pop();

    if (value && fileType !== "pdf") {
        return (
            <div className={cn(
                "relative h-40 w-40",
                endpoint === "serverImage" ? "h-20 w-20" : "h-40 w-40"
            )}>
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className={cn(
                        "object-cover",
                        endpoint === "serverImage" ? "rounded-full" : "rounded-md"
                    )}
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm z-10"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }

    return (
        <UploadDropzone
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].url);
            }}
            onUploadError={(error: Error) => {
                console.log(error);
            }}
        />
    )
}
