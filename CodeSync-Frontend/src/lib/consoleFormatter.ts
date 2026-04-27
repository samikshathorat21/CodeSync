/**
 * Utility functions for formatting console output with stdin input interleaved
 */

/**
 * Removes echoed stdin lines from stdout.
 * Sometimes the execution environment echoes the input back, which appears in stdout.
 * This function removes those echoed lines to show only actual program output.
 * 
 * @param stdout - The program's standard output (may contain echoed stdin)
 * @param stdin - The input that may have been echoed
 * @returns stdout with echoed stdin lines removed
 */
export function removeStdinEcho(stdout: string, stdin: string): string {
  if (!stdout || !stdin || !stdin.trim()) {
    return stdout;
  }
  
  const inputLines = stdin.trim().split('\n');
  const outputLines = stdout.split('\n');
  
  // Create a set of trimmed input values for fast lookup
  const inputSet = new Set(inputLines.map(line => line.trim()).filter(line => line.length > 0));
  
  // Filter out lines that match input values (these are echoed stdin)
  const filtered = outputLines.filter(line => {
    const trimmed = line.trim();
    // Keep the line if it's not an exact match for any input value
    // But allow lines that contain more than just the input (like prompts)
    return !inputSet.has(trimmed);
  });
  
  return filtered.join('\n');
}

/**
 * Interleaves stdin input with stdout output to simulate a real terminal.
 * When a stdout line looks like a prompt (ends with ':' or '?'), 
 * the next stdin line is appended to it.
 * 
 * This function first removes any echoed stdin from stdout, then interleaves.
 * 
 * Example:
 * stdout: "Enter first number:\nEnter second number:\nSum = 15"
 * stdin: "5\n10"
 * 
 * Result:
 * "Enter first number: 5\nEnter second number: 10\nSum = 15"
 * 
 * @param stdout - The program's standard output
 * @param stdin - The input provided by the user
 * @returns The interleaved console output with stdin echo removed
 */
export function interleaveLinesWithInput(stdout: string, stdin: string): string {
  // First, remove any echoed stdin from the output
  const cleanedOutput = removeStdinEcho(stdout, stdin);
  
  // If no output remains after filtering, return as-is
  if (!cleanedOutput || !cleanedOutput.trim()) {
    return cleanedOutput;
  }
  
  // If no input, return cleaned output as-is
  if (!stdin || !stdin.trim()) {
    return cleanedOutput;
  }
  
  const outputLines = cleanedOutput.split('\n');
  const inputLines = stdin.trim().split('\n');
  
  let result: string[] = [];
  let inputIndex = 0;
  
  for (const line of outputLines) {
    // Keep lines as-is (including empty lines)
    const trimmed = line.trimRight();
    
    // Check if this line looks like a prompt that expects input
    // Prompts typically end with ':' or '?'
    const isPromptLine = /[:?]\s*$/.test(trimmed);
    
    if (isPromptLine && inputIndex < inputLines.length) {
      // This is a prompt line - append the next stdin input to it
      const userInput = inputLines[inputIndex].trim();
      result.push(`${trimmed} ${userInput}`);
      inputIndex++;
    } else {
      // Regular output line - keep as-is
      result.push(line);
    }
  }
  
  // Don't add remaining input lines to output
  // They belong in the Input tab, not the console output
  
  return result.join('\n');
}

/**
 * Formats console output for display with proper ANSI color escape sequences stripped
 * and proper line wrapping.
 * 
 * @param text - The text to format
 * @returns The formatted text
 */
export function formatConsoleText(text: string): string {
  if (!text) return '';
  
  // Remove ANSI escape sequences (colors, bold, etc.)
  // Pattern matches: \x1b[...m or \033[...m
  return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\033\[[0-9;]*m/g, '');
}
