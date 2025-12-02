import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Determine the appropriate unit by calculating the log
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format with 2 decimal places and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();

const clampScore = (score: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(score)));

export const normalizeAtsScore = (
  score: number,
  supportingScores: number[] = []
) => {
  const clamped = clampScore(Number.isFinite(score) ? score : 0, 0, 100);
  if (!supportingScores.length) {
    return Math.max(60, clamped);
  }

  const validScores = supportingScores.filter(
    (value) => typeof value === "number" && Number.isFinite(value)
  );

  if (!validScores.length) {
    return Math.max(60, clamped);
  }

  const avg = validScores.reduce((sum, value) => sum + value, 0) / validScores.length;
  const dynamicFloor = clampScore(avg - 5, 60, 100);

  return Math.max(dynamicFloor, clamped);
};

