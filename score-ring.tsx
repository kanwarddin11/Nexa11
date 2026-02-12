import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 60) return "text-yellow-500 dark:text-yellow-400";
  if (score >= 40) return "text-orange-500 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}

function getScoreStroke(score: number): string {
  if (score >= 80) return "stroke-emerald-500 dark:stroke-emerald-400";
  if (score >= 60) return "stroke-yellow-500 dark:stroke-yellow-400";
  if (score >= 40) return "stroke-orange-500 dark:stroke-orange-400";
  return "stroke-red-500 dark:stroke-red-400";
}

function getScoreTrack(): string {
  return "stroke-muted";
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, className }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={getScoreTrack()}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(getScoreStroke(score), "transition-all duration-1000 ease-out")}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-2xl font-black", getScoreColor(score))} data-testid="text-score-value">
          {score}
        </span>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Score
        </span>
      </div>
    </div>
  );
}

export function getVerdictInfo(score: number) {
  if (score >= 90) return { label: "AAA+++ Verified", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
  if (score >= 75) return { label: "AA+ Verified", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
  if (score >= 60) return { label: "A Verified", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  if (score >= 40) return { label: "B Caution", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
  if (score >= 20) return { label: "D Danger", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" };
  return { label: "F Fake", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
}
