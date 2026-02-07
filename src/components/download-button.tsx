'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { getArtifactDownloadUrl } from '@/app/actions/github'
import { Download, Loader2 } from "lucide-react"

interface DownloadButtonProps {
  artifactId: number;
  fileName: string;
}

export function DownloadButton({ artifactId, fileName }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const base64Data = await getArtifactDownloadUrl(artifactId);
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_${fileName}.zip`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download artifact.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading} variant="outline" className="w-full">
      {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isDownloading ? "Downloading..." : "Download Result"}
    </Button>
  )
}
