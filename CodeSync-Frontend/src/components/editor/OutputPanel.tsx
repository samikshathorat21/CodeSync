import { Button } from '@/components/ui/button';
import { interleaveLinesWithInput } from '@/lib/consoleFormatter';
import { ExecutionResult } from '@/types/collaboration';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Maximize2, Minimize2, Terminal, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface OutputPanelProps {
  result: ExecutionResult | null;
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  stdin?: string;
  onStdinChange?: (stdin: string) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  result,
  isVisible,
  isExpanded,
  onToggleExpand,
  onClose,
  stdin = '',
  onStdinChange,
}) => {
  const [showInput, setShowInput] = useState(false);
  
  // Interleave stdin with stdout for realistic console output
  const interleavedOutput = useMemo(() => {
    if (!result?.output) return '';
    return interleaveLinesWithInput(result.output, stdin);
  }, [result?.output, stdin]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isExpanded ? '50%' : '200px', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="border-t border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <button
                onClick={() => setShowInput(false)}
                className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                  !showInput
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Output
              </button>
              <button
                onClick={() => setShowInput(true)}
                className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                  showInput
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Input
              </button>
              {result && !showInput && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({result.executionTime}ms)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="iconSm" onClick={onToggleExpand}>
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="iconSm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 h-[calc(100%-40px)] overflow-auto scrollbar-thin">
            {showInput ? (
              <div className="space-y-3 h-full flex flex-col">
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-3">
                  <div className="text-xs font-medium text-blue-300 mb-1">💡 How to use input:</div>
                  <div className="text-xs text-blue-200">
                    1. Enter your program's input below (one value per line)<br/>
                    2. Click <strong>Run</strong> to execute with this input<br/>
                    3. Output will appear in the Output tab
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground font-medium">
                  Program Input (stdin) 
                  {stdin.trim() && <span className="ml-2 text-green-400">✓ Input provided</span>}
                  {!stdin.trim() && <span className="ml-2 text-amber-400">Optional - Leave empty if your program doesn't need input</span>}
                </div>
                
                <textarea
                  value={stdin}
                  onChange={(e) => onStdinChange?.(e.target.value)}
                  placeholder="Enter input here. Use newlines for multiple lines&#10;Example (for sum calculator):&#10;5&#10;10"
                  className="flex-1 font-mono text-sm bg-secondary/30 text-foreground border border-border/30 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Each line of input becomes a separate stdin line</div>
                  <div>• Your program reads this via Scanner.nextLine(), input(), readLine(), etc.</div>
                  <div>• If empty, program will fail if it tries to read input</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {result ? (
                  <>
                    {result.output && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-2 text-green-400 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Console Output</span>
                        </div>
                        <pre className="font-mono text-sm text-foreground/90 bg-secondary/30 rounded-md p-3 overflow-x-auto">
                          {interleavedOutput}
                        </pre>
                      </motion.div>
                    )}
                    {result.error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-2 text-destructive text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>stderr</span>
                        </div>
                        <pre className="font-mono text-sm text-destructive bg-destructive/10 rounded-md p-3 overflow-x-auto border border-destructive/20">
                          {result.error}
                        </pre>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <span>Run your code to see output here</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
