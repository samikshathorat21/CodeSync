import React, { useState } from 'react';
import { FileCode, Plus, FolderOpen, ChevronRight, ChevronDown, FileJson, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoomFile, Language } from '@/types/collaboration';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileExplorerProps {
  files: RoomFile[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onCreateFile: (name: string, language: string) => void;
  isHost: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  isHost,
}) => {
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState<Language>('java');

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    onCreateFile(newFileName, newFileLang);
    setNewFileName('');
    setIsNewFileOpen(false);
  };

  const getFileIcon = (lang: string) => {
    switch (lang) {
      case 'java': return <FileType className="w-4 h-4 text-orange-400" />;
      case 'python': return <FileCode className="w-4 h-4 text-blue-400" />;
      default: return <FileJson className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 border-r border-border backdrop-blur-sm">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-sm">Explorer</span>
        </div>
        {isHost && (
          <Dialog open={isNewFileOpen} onOpenChange={setIsNewFileOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-primary/20">
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">File Name</label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Utils.java" 
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select value={newFileLang} onValueChange={(v) => setNewFileLang(v as Language)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="mt-2">Create File</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Files
        </div>
        {files.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-muted-foreground italic">No files yet.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Click + to create one</p>
          </div>
        )}
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
              activeFileId === file.id 
                ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {getFileIcon(file.language)}
            <span className="text-sm truncate font-medium">{file.name}</span>
            {activeFileId === file.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
