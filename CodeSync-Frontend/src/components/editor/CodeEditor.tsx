import React, { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Language, CursorPosition } from '@/types/collaboration';

interface ViewportUser {
  userId: string;
  userName: string;
  color: string;
  startLine: number;
  endLine: number;
}

interface CodeEditorProps {
  code: string;
  language: Language;
  onChange: (value: string) => void;
  onViewportChange?: (startLine: number, endLine: number) => void;
  onCursorChange?: (position: Omit<CursorPosition, 'userId' | 'userName' | 'color'>) => void;
  viewports?: Map<string, ViewportUser>;
  cursors?: Map<string, CursorPosition>;
  currentUserId?: string;
  readOnly?: boolean;
}

const LANGUAGE_MAP: Record<Language, string> = {
  python: 'python',
  java: 'java',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onViewportChange,
  onCursorChange,
  viewports,
  cursors,
  currentUserId,
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const cursorDecorationsRef = useRef<string[]>([]);
  const viewportThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateViewportDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !viewports) return;
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    
    const newDecorations: any[] = [];
    
    viewports.forEach((viewport) => {
      // Line highlight decoration
      newDecorations.push({
        range: new monaco.Range(viewport.startLine, 1, viewport.startLine, 1),
        options: {
          isWholeLine: true,
          className: 'viewport-line-highlight',
          glyphMarginClassName: 'viewport-glyph',
          glyphMarginHoverMessage: { value: `👁 ${viewport.userName} is viewing here` },
          overviewRuler: {
            color: viewport.color,
            position: monaco.editor.OverviewRulerLane.Right,
          },
          minimap: {
            color: viewport.color,
            position: monaco.editor.MinimapPosition.Gutter,
          },
        },
      });
    });
    
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [viewports]);

  const updateCursorDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !cursors) return;
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    
    const newDecorations: any[] = [];
    
    cursors.forEach((cursor) => {
      // Skip current user's cursor
      if (cursor.userId === currentUserId) return;
      
      // Create cursor line decoration with user name label
      newDecorations.push({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column + 1),
        options: {
          className: `remote-cursor-${cursor.userId.slice(0, 8)}`,
          beforeContentClassName: `remote-cursor-caret`,
          hoverMessage: { value: `**${cursor.userName}** is editing here` },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
      
      // Add user name label above cursor
      newDecorations.push({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column),
        options: {
          before: {
            content: ` ${cursor.userName} `,
            inlineClassName: 'remote-cursor-label',
            inlineClassNameAffectsLetterSpacing: true,
          },
        },
      });
      
      // If there's a selection, highlight it
      if (cursor.selection) {
        newDecorations.push({
          range: new monaco.Range(
            cursor.selection.startLine,
            cursor.selection.startColumn,
            cursor.selection.endLine,
            cursor.selection.endColumn
          ),
          options: {
            className: 'remote-selection',
            hoverMessage: { value: `${cursor.userName}'s selection` },
          },
        });
      }
    });
    
    cursorDecorationsRef.current = editor.deltaDecorations(cursorDecorationsRef.current, newDecorations);
  }, [cursors, currentUserId]);

  useEffect(() => {
    updateViewportDecorations();
  }, [viewports, updateViewportDecorations]);

  useEffect(() => {
    updateCursorDecorations();
  }, [cursors, updateCursorDecorations]);

  // Update readOnly state when it changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme('codesync-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#22c55e',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#22c55e',
        'editor.inactiveSelectionBackground': '#264f7855',
        'editorIndentGuide.background1': '#21262d',
        'editorIndentGuide.activeBackground1': '#30363d',
        'editorGutter.background': '#0d1117',
      },
    });

    monaco.editor.setTheme('codesync-dark');

    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', monospace",
      fontLigatures: true,
      minimap: { enabled: true, scale: 1, maxColumn: 80 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      padding: { top: 16, bottom: 16 },
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      wordWrap: 'on',
      readOnly,
    });

    // Track viewport changes
    const broadcastViewport = () => {
      if (!onViewportChange) return;
      
      const visibleRanges = editor.getVisibleRanges();
      if (visibleRanges.length > 0) {
        const startLine = visibleRanges[0].startLineNumber;
        const endLine = visibleRanges[visibleRanges.length - 1].endLineNumber;
        
        // Throttle viewport broadcasts
        if (viewportThrottleRef.current) {
          clearTimeout(viewportThrottleRef.current);
        }
        viewportThrottleRef.current = setTimeout(() => {
          onViewportChange(startLine, endLine);
        }, 100);
      }
    };

    // Track cursor position changes
    const broadcastCursor = () => {
      if (!onCursorChange) return;
      
      const position = editor.getPosition();
      const selection = editor.getSelection();
      
      if (position) {
        // Throttle cursor broadcasts
        if (cursorThrottleRef.current) {
          clearTimeout(cursorThrottleRef.current);
        }
        cursorThrottleRef.current = setTimeout(() => {
          const cursorData: Omit<CursorPosition, 'userId' | 'userName' | 'color'> = {
            line: position.lineNumber,
            column: position.column,
          };
          
          // Include selection if not empty
          if (selection && !selection.isEmpty()) {
            (cursorData as any).selection = {
              startLine: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLine: selection.endLineNumber,
              endColumn: selection.endColumn,
            };
          }
          
          onCursorChange(cursorData);
        }, 50);
      }
    };

    // Listen to scroll events
    editor.onDidScrollChange(broadcastViewport);
    
    // Listen to cursor position changes
    editor.onDidChangeCursorPosition(broadcastCursor);
    
    // Listen to selection changes
    editor.onDidChangeCursorSelection(broadcastCursor);
    
    // Initial viewport broadcast
    setTimeout(broadcastViewport, 500);
    
    // Update decorations on mount
    updateViewportDecorations();
    updateCursorDecorations();
  };

  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Generate dynamic styles for remote cursors
  const generateCursorStyles = () => {
    if (!cursors) return '';
    
    let styles = '';
    cursors.forEach((cursor) => {
      if (cursor.userId === currentUserId) return;
      
      styles += `
        .remote-cursor-${cursor.userId.slice(0, 8)} {
          border-left: 2px solid ${cursor.color} !important;
          position: relative;
        }
      `;
    });
    return styles;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full rounded-lg overflow-hidden border border-border/50 relative"
    >
      <style>{`
        .viewport-line-highlight {
          background-color: rgba(34, 197, 94, 0.08) !important;
          border-left: 2px solid rgba(34, 197, 94, 0.5);
        }
        .viewport-glyph {
          background-color: rgba(34, 197, 94, 0.6);
          border-radius: 50%;
          margin-left: 3px;
          width: 8px !important;
          height: 8px !important;
        }
        .remote-cursor-caret {
          border-left: 2px solid currentColor;
          animation: blink 1s step-end infinite;
        }
        .remote-cursor-label {
          position: relative;
          top: -1.2em;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          background-color: var(--cursor-color, #22c55e);
          color: white;
          font-weight: 500;
          white-space: nowrap;
          z-index: 100;
        }
        .remote-selection {
          background-color: rgba(34, 197, 94, 0.2) !important;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        ${generateCursorStyles()}
      `}</style>
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language]}
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        loading={
          <div className="flex items-center justify-center h-full bg-editor-bg">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-sm">Loading editor...</span>
            </div>
          </div>
        }
        options={{
          readOnly,
          automaticLayout: true,
        }}
      />
    </motion.div>
  );
};
