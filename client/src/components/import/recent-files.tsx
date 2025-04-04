import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileUpload } from "@/types";

export function RecentFiles() {
  const { data: fileUploads, isLoading } = useQuery<FileUpload[]>({
    queryKey: ["/api/file-uploads"],
  });
  
  if (isLoading) {
    return (
      <div className="mt-8">
        <h4 className="font-medium text-foreground mb-3">Recently Imported Files</h4>
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Loading recent files...</p>
        </div>
      </div>
    );
  }
  
  if (!fileUploads || fileUploads.length === 0) {
    return (
      <div className="mt-8">
        <h4 className="font-medium text-foreground mb-3">Recently Imported Files</h4>
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No files have been imported yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <h4 className="font-medium text-foreground mb-3">Recently Imported Files</h4>
      <div className="bg-muted/30 rounded-lg overflow-hidden">
        <div className="data-table text-sm">
          <div className="grid grid-cols-12 py-2 px-4 border-b border-border bg-muted">
            <div className="col-span-5 font-medium text-muted-foreground">Filename</div>
            <div className="col-span-2 font-medium text-muted-foreground">Size</div>
            <div className="col-span-3 font-medium text-muted-foreground">Date</div>
            <div className="col-span-2 font-medium text-muted-foreground">Status</div>
          </div>
          
          {fileUploads.map((file) => (
            <div key={file.id} className="grid grid-cols-12 py-3 px-4 border-b border-border/50">
              <div className="col-span-5 font-medium text-foreground flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-secondary" />
                <span className="truncate">{file.filename}</span>
              </div>
              <div className="col-span-2 text-muted-foreground">
                {formatBytes(file.fileSize)}
              </div>
              <div className="col-span-3 text-muted-foreground">
                {formatDate(file.createdAt)}
              </div>
              <div className="col-span-2">
                {file.status === "processed" && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Processed
                  </span>
                )}
                {file.status === "processing" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    Processing
                  </span>
                )}
                {file.status === "error" && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                    Error
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
