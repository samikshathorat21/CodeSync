import React, { useEffect, useRef } from 'react';

const CODE_LINES = [
  // Java snippets
  'public class Main {',
  '    public static void main(String[] args) {',
  '        System.out.println("Hello, World!");',
  '    }',
  '}',
  'List<String> list = new ArrayList<>();',
  'Optional<User> user = repo.findById(id);',
  '@RestController',
  '@RequestMapping("/api/rooms")',
  'return ResponseEntity.ok(data);',
  'private final String roomId;',
  'Map<String, Instant> presence = new ConcurrentHashMap<>();',
  '@Transactional',
  'throw new NotFoundException("Room not found");',
  'stompClient.publish(destination, body);',

  // Python snippets
  'def greet(name: str) -> str:',
  '    return f"Hello, {name}!"',
  'if __name__ == "__main__":',
  'class Solution:',
  '    def twoSum(self, nums, target):',
  'participants = [p for p in room.all()]',
  'import asyncio',
  'async def connect(url: str):',
  'with open("data.json") as f:',
  '    data = json.load(f)',
  'for user in participants:',
  '    print(user.name)',
  '@app.route("/api/rooms")',
  'result = sorted(nums, key=lambda x: -x)',
  'session["user_id"] = user.id',
];

interface CodeParticle {
  x: number;
  y: number;
  text: string;
  speed: number;
  opacity: number;
  color: string;
  fontSize: number;
}

const COLORS = [
  '#22c55e',  // green (primary)
  '#4ade80',  // light green
  '#16a34a',  // dark green
  '#86efac',  // muted green
  '#3b82f6',  // blue
  '#818cf8',  // indigo
  '#c084fc',  // purple
];

export const CodeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CodeParticle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialise particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: 28 }, () => {
        const fontSize = 10 + Math.random() * 5;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          text: CODE_LINES[Math.floor(Math.random() * CODE_LINES.length)],
          speed: 0.15 + Math.random() * 0.3,
          opacity: 0.04 + Math.random() * 0.1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          fontSize,
        };
      });
    };

    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.fontSize}px 'JetBrains Mono', 'Fira Code', monospace`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();

        // Drift upward
        p.y -= p.speed;

        // Reset to bottom when off screen
        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
          p.text = CODE_LINES[Math.floor(Math.random() * CODE_LINES.length)];
          p.opacity = 0.04 + Math.random() * 0.1;
          p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
