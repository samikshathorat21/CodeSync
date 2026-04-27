import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Language, LANGUAGE_OPTIONS } from '@/types/collaboration';

interface LanguageSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromLanguage: Language;
  toLanguage: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

const getLanguageName = (lang: Language): string => {
  return LANGUAGE_OPTIONS.find(l => l.value === lang)?.label || lang;
};

export const LanguageSwitchDialog: React.FC<LanguageSwitchDialogProps> = ({
  open,
  onOpenChange,
  fromLanguage,
  toLanguage,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Switch Language?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Switching from <span className="font-semibold text-primary">{getLanguageName(fromLanguage)}</span> to{' '}
            <span className="font-semibold text-primary">{getLanguageName(toLanguage)}</span> will replace 
            the current code with the default template for {getLanguageName(toLanguage)}.
            <br /><br />
            <span className="text-destructive font-medium">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Switch Language
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
