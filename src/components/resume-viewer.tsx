import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileText, ExternalLink } from "lucide-react";

interface SimpleResumeViewerProps {
    resumeUrl: string;
    candidateName: string;
}

export function SimpleResumeViewer({
    resumeUrl,
    candidateName,
}: SimpleResumeViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Convert Google Drive view URL to embed URL
    const getEmbedUrl = (url: string) => {
        if (url.includes("drive.google.com")) {
            const fileIdMatch = url.match(/\/d\/([^\/]+)/);
            if (fileIdMatch) {
                return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
            }
        }
        return url;
    };

    const embedUrl = getEmbedUrl(resumeUrl);

    return (
        <>
            <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsOpen(true)}
            >
                <FileText className="w-4 h-4 mr-2" />
                View Resume
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between mt-5">
                            <span>{candidateName}'s Resume</span>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={resumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open in New Tab
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={resumeUrl}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </a>
                                </Button>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
                        <iframe
                            src={embedUrl}
                            className="w-full h-[70vh] border-0"
                            title={`${candidateName}'s Resume`}
                            allow="autoplay"
                        />
                    </div>

                    <div className="text-sm text-muted-foreground text-center pt-2">
                        If the preview doesn't load, try opening it in a new tab
                        or downloading it.
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
