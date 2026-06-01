import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const METHOD_COLORS: Record<string, string> = {
  GET: 'method-get',
  POST: 'method-post',
  PUT: 'method-put',
  PATCH: 'method-patch',
  DELETE: 'method-delete',
};

export const NODE_COLORS: Record<string, string> = {
  request: '#818cf8',
  auth: '#f59e0b',
  validation: '#3b82f6',
  'db-query': '#a78bfa',
  transform: '#ec4899',
  response: '#34d399',
  'external-api': '#fb923c',
  condition: '#f472b6',
  cache: '#22d3ee',
  logger: '#94a3b8',
};
