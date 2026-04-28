import React, { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Language, CursorPosition, CodeComment } from '@/types/collaboration';

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
  viewports?: Map<string, ViewportUser>;
  cursors?: Map<string, CursorPosition>;
  typingUsers?: Map<string, { userName: string; color: string; timestamp: number }>;
  comments?: CodeComment[];
  onAddComment?: (line: number) => void;
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
  typingUsers,
  comments,
  onAddComment,
  currentUserId,
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const cursorDecorationsRef = useRef<string[]>([]);
  const commentDecorationsRef = useRef<string[]>([]);
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
      
      const shortId = cursor.userId.slice(0, 8);
      
      // Create cursor caret decoration
      newDecorations.push({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column + 1),
        options: {
          className: `remote-cursor-${shortId}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          hoverMessage: { value: `**${cursor.userName}** is editing here` },
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
            className: `remote-selection-${shortId}`,
          },
        });
      }
    });
    
    cursorDecorationsRef.current = editor.deltaDecorations(cursorDecorationsRef.current, newDecorations);
  }, [cursors, currentUserId, typingUsers]);

  const updateCommentDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !comments) return;
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    
    const newDecorations = comments.map(comment => ({
      range: new monaco.Range(comment.line, 1, comment.line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'comment-glyph',
        glyphMarginHoverMessage: { value: `💬 ${comment.userName}: ${comment.content}` },
      }
    }));
    
    commentDecorationsRef.current = editor.deltaDecorations(commentDecorationsRef.current, newDecorations);
  }, [comments]);

  useEffect(() => {
    updateViewportDecorations();
  }, [viewports, updateViewportDecorations]);

  useEffect(() => {
    updateCursorDecorations();
  }, [cursors, updateCursorDecorations]);

  useEffect(() => {
    updateCommentDecorations();
  }, [comments, updateCommentDecorations]);

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
    
    // Add gutter click listener for comments
    editor.onMouseDown((e: any) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || 
          e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const line = e.target.position.lineNumber;
        onAddComment?.(line);
      }
    });

    // Update decorations on mount
    updateViewportDecorations();
    updateCursorDecorations();
    updateCommentDecorations();
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
      
      const shortId = cursor.userId.slice(0, 8);
      const color = cursor.color;
      const isTyping = typingUsers?.has(cursor.userId);
      
      styles += `
        .remote-cursor-${shortId} {
          border-left: 2px solid ${color} !important;
          z-index: 10;
        }
        .remote-cursor-${shortId}::after {
          content: "${cursor.userName}";
          position: absolute;
          top: -18px;
          left: -1px;
          background-color: ${color};
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px 4px 4px 0;
          white-space: nowrap;
          pointer-events: none;
          z-index: 11;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          opacity: ${isTyping ? '0.9' : '0'};
          transform: translateY(${isTyping ? '0' : '4px'});
          transition: opacity 0.2s, transform 0.2s;
        }
        .remote-cursor-${shortId}:hover::after {
          opacity: 0.9;
          transform: translateY(0);
        }
        .remote-selection-${shortId} {
          background-color: ${color}33 !important;
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
          background-color: rgba(34, 197, 94, 0.05) !important;
          border-left: 2px solid rgba(34, 197, 94, 0.3);
        }
        .viewport-glyph {
          background-color: rgba(34, 197, 94, 0.6);
          border-radius: 50%;
          margin-left: 3px;
          width: 8px !important;
          height: 8px !important;
        }
        .comment-glyph {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          cursor: pointer;
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
