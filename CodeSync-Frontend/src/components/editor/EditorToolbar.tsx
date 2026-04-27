import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Save, History, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Language, LANGUAGE_OPTIONS, User } from '@/types/collaboration';
import { LanguageSwitchDialog } from './LanguageSwitchDialog';
import { getDefaultTemplate } from '@/constants/codeTemplates';

interface EditorToolbarProps {
  language: Language;
  onLanguageChange: (lang: Language, newCode: string) => void;
  onRun: () => void;
  onSave: () => void;
  onShowHistory: () => void;
  isRunning?: boolean;
  participants: User[];
  currentCode: string;
  canExecute?: boolean;
  canEdit?: boolean;
  isHost?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  language,
  onLanguageChange,
  onRun,
  onSave,
  onShowHistory,
  isRunning = false,
  participants,
  currentCode,
  canExecute = true,
  canEdit = true,
  isHost = false,
}) => {
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleLanguageSelect = (newLanguage: Language) => {
    if (newLanguage === language) return;

    // Check if code has been modified from the default template
    const currentTemplate = getDefaultTemplate(language);
    const hasChanges = currentCode.trim() !== currentTemplate.trim();

    if (hasChanges) {
      // Show confirmation dialog
      setPendingLanguage(newLanguage);
      setShowConfirmDialog(true);
    } else {
      // No changes, switch directly
      const newTemplate = getDefaultTemplate(newLanguage);
      onLanguageChange(newLanguage, newTemplate);
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingLanguage) {
      const newTemplate = getDefaultTemplate(pendingLanguage);
      onLanguageChange(pendingLanguage, newTemplate);
    }
    setShowConfirmDialog(false);
    setPendingLanguage(null);
  };

  const handleCancelSwitch = () => {
    setShowConfirmDialog(false);
    setPendingLanguage(null);
  };

  return (
    <>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-sm border-b border-border/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Code2 className="w-5 h-5" />
            <span className="font-semibold">CodeSync</span>
          </div>

          <div className="h-6 w-px bg-border/50" />

          <Select value={language} onValueChange={(val) => handleLanguageSelect(val as Language)}>
            <SelectTrigger className="w-[140px] h-8 bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Participant avatars */}
          <div className="flex items-center -space-x-2 mr-3">
            {participants.slice(0, 4).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-background"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                )}
              </motion.div>
            ))}
            {participants.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                +{participants.length - 4}
              </div>
            )}
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={onRun}
            disabled={isRunning || !canExecute}
            className="gap-2"
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? 'Running...' : 'Run'}
          </Button>

          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={onShowHistory}>
            <History className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <LanguageSwitchDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        fromLanguage={language}
        toLanguage={pendingLanguage || language}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </>
  );
};
