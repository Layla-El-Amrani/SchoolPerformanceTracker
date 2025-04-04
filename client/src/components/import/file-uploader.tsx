import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UploadCloud } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FileUploaderProps {
  academicYearId: number;
  termId?: number;
}

export function FileUploader({ academicYearId, termId }: FileUploaderProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("academicYearId", academicYearId.toString());
      if (termId) {
        formData.append("termId", termId.toString());
      }
      
      const xhr = new XMLHttpRequest();
      
      // Set up progress monitoring
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      // Wrap XHR in a promise
      return new Promise<any>((resolve, reject) => {
        xhr.open("POST", "/api/upload");
        xhr.withCredentials = true;
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText || "Upload failed"));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error("Network error"));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-uploads"] });
      toast({
        title: t('import.uploadSuccess'),
        description: t('import.dataProcessed'),
      });
      setCurrentFile(null);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: t('import.uploadFailed'),
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !['xlsx', 'xls', 'xml'].includes(fileExtension)) {
      toast({
        title: t('import.invalidFormat'),
        description: t('import.supportedDescription'),
        variant: "destructive",
      });
      return;
    }
    
    setCurrentFile(file);
    uploadMutation.mutate(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <UploadCloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h4 className="text-lg font-medium text-foreground mb-2">{t('import.dragDrop')}</h4>
        <p className="text-muted-foreground mb-4">{t('import.or')}</p>
        <Button className="bg-primary">
          {t('import.browse')}
        </Button>
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept=".xlsx,.xls,.xml" 
          onChange={handleChange}
        />
        <p className="text-sm text-muted-foreground mt-4">
          {t('import.supported')}
        </p>
      </div>
      
      {(currentFile || uploadProgress > 0) && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              {currentFile?.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {uploadProgress}%
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          {currentFile && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('import.fileSize')} {formatBytes(currentFile.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
