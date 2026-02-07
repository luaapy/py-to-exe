'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadFileToGithub } from '@/app/actions/github'
import { Loader2, Upload } from "lucide-react"

interface UploadFormProps {
  onUploadStart: () => void;
  onUploadSuccess: (fileName: string, commitSha: string) => void;
  onUploadError: (error: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.py', '.lua', '.txt', '.md', '.json'];

export function UploadForm({ onUploadStart, onUploadSuccess, onUploadError }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError("File size exceeds 10MB limit.");
            setFile(null);
            return;
        }
        const ext = "." + selectedFile.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setError(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
            setFile(null);
            return;
        }
        setError(null);
        setFile(selectedFile);
    }
  }

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    onUploadStart();

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        // Extract base64 part
        const base64Content = content.split(',')[1];
        
        try {
            const result = await uploadFileToGithub(base64Content, file.name);
            onUploadSuccess(file.name, result.commitSha);
        } catch (err) {
            console.error(err);
            onUploadError(err instanceof Error ? err.message : "Upload failed");
            setIsUploading(false);
        }
      };
      reader.onerror = () => {
          onUploadError("Failed to read file");
          setIsUploading(false);
      }
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      onUploadError("Failed to read file");
      setIsUploading(false);
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file">File to convert</Label>
        <Input id="file" type="file" onChange={handleFileChange} disabled={isUploading} accept={ALLOWED_EXTENSIONS.join(',')} />
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}

      {file && !error && (
        <div className="text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || isUploading || !!error} className="w-full">
        {isUploading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
            </>
        ) : (
            <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Convert
            </>
        )}
      </Button>
    </div>
  )
}
