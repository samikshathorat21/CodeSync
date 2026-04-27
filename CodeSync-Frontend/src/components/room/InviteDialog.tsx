import React, { useState } from 'react';
import { Copy, Check, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInvite } from '@/hooks/useInvite';
import { toast } from 'sonner';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({
  open,
  onOpenChange,
  roomId,
}) => {
  const { createInvite, loading } = useInvite();
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);

  const handleGenerateInvite = async () => {
    const url = await createInvite(roomId, expiresInHours);
    if (url) {
      setInviteUrl(url);
      // Auto-copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setInviteUrl('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Invite to Room
          </DialogTitle>
          <DialogDescription>
            Generate an invite link to share with others. They'll be able to join as a participant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="expires">Link expires in</Label>
            <select
              id="expires"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>7 days</option>
            </select>
          </div>

          {!inviteUrl ? (
            <Button 
              onClick={handleGenerateInvite} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Invite Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={inviteUrl} 
                  readOnly 
                  className="flex-1 text-sm font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Link expires in {expiresInHours} hour{expiresInHours > 1 ? 's' : ''}
              </p>
              
              <Button 
                variant="outline" 
                onClick={handleGenerateInvite}
                className="w-full"
                disabled={loading}
              >
                Generate New Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
