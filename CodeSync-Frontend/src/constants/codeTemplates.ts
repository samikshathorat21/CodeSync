import { Language } from '@/types/collaboration';

export const CODE_TEMPLATES: Record<Language, string> = {
  python: `# Python Starter Code
def greet(name: str) -> str:
    return f"Hello, {name}!"

# Main execution
if __name__ == "__main__":
    message = greet("World")
    print(message)
`,

  java: `// Java Starter Code
public class Main {
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        String message = greet("World");
        System.out.println(message);
    }
}
`,
};

export const getDefaultTemplate = (language: Language): string => {
  return CODE_TEMPLATES[language] || CODE_TEMPLATES.java;
};
