import { useState, useCallback, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { uploadToIPFS, validateImageFile } from '@/lib/pinata';
import { Upload, X, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUploadComplete: (ipfsHash: string, ipfsUrl: string) => void;
  currentImageUrl?: string;
  label?: string;
  description?: string;
}

export function ImageUploader({
  onUploadComplete,
  currentImageUrl,
  label = 'Token Logo',
  description = 'Upload your token logo to IPFS (max 10MB)',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(currentImageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const result = await uploadToIPFS(file);
      
      if (result.success && result.ipfsHash && result.ipfsUrl) {
        onUploadComplete(result.ipfsHash, result.ipfsUrl);
        setPreview(result.pinataUrl || result.ipfsUrl);
        toast({
          title: 'Upload successful',
          description: `Image uploaded to IPFS: ${result.ipfsHash.substring(0, 12)}...`,
        });
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Failed to upload image to IPFS',
          variant: 'destructive',
        });
        setPreview('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setPreview('');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearImage = useCallback(() => {
    setPreview('');
    onUploadComplete('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onUploadComplete]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        {preview ? (
          <div className="relative p-4">
            <div className="relative w-full aspect-square max-w-xs mx-auto">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearImage}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {preview.includes('ipfs') && (
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 text-sm text-primary hover:underline"
              >
                View on IPFS
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Uploading to IPFS...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  JPEG, PNG, GIF or WebP (max 10MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              </>
            )}
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
}
