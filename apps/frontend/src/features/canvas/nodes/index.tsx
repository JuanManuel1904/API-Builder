import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { NODE_COLORS, METHOD_COLORS, cn } from '@/lib/utils';
import type {
  RequestNodeConfig,
  AuthNodeConfig,
  ValidationNodeConfig,
  DbQueryNodeConfig,
  ResponseNodeConfig,
  TransformNodeConfig,
  ExternalApiNodeConfig,
  CacheNodeConfig,
  ConditionNodeConfig,
  LoggerNodeConfig,
} from '@vab/types';

// ── REQUEST NODE ──────────────────────────────────────────────
export function RequestNode({ data }: NodeProps) {
  const config = data.config as RequestNodeConfig;
  return (
    <BaseNode
      title="Request"
      badge={config?.method ?? 'GET'}
      badgeClass={cn('badge', METHOD_COLORS[config?.method ?? 'GET'])}
      icon={<span>↓</span>}
      color={NODE_COLORS.request}
      handles={['bottom']}
      fields={[
        { value: config?.path ?? '/' },
        { label: 'body', value: config?.contentType === 'application/json' ? 'json' : config?.contentType ?? 'json' },
      ]}
    />
  );
}

// ── AUTH NODE ─────────────────────────────────────────────────
export function AuthNode({ data }: NodeProps) {
  const config = data.config as AuthNodeConfig;
  return (
    <BaseNode
      title="JWT Guard"
      badge="auth"
      icon={<span>🔒</span>}
      color={NODE_COLORS.auth}
      fields={[
        { label: 'strategy', value: config?.strategy ?? 'bearer' },
        { label: 'roles', value: config?.roles?.join(', ') ?? 'any' },
      ]}
    />
  );
}

// ── VALIDATION NODE ───────────────────────────────────────────
export function ValidationNode({ data }: NodeProps) {
  const config = data.config as ValidationNodeConfig;
  return (
    <BaseNode
      title="Validate DTO"
      badge="dto"
      icon={<span>✓</span>}
      color={NODE_COLORS.validation}
      fields={[
        { label: 'mode', value: config?.mode ?? 'strict' },
        { label: 'whitelist', value: config?.whitelist ? 'true' : 'false' },
      ]}
    />
  );
}

// ── DB QUERY NODE ─────────────────────────────────────────────
export function DbQueryNode({ data }: NodeProps) {
  const config = data.config as DbQueryNodeConfig;
  return (
    <BaseNode
      title="DB Query"
      badge="prisma"
      icon={<span>◉</span>}
      color={NODE_COLORS['db-query']}
      fields={[
        { label: 'op', value: config?.operation ?? 'findMany' },
        { label: 'select', value: config?.selectFields?.join(', ') ?? 'all' },
      ]}
    />
  );
}

// ── RESPONSE NODE ─────────────────────────────────────────────
export function ResponseNode({ data }: NodeProps) {
  const config = data.config as ResponseNodeConfig;
  return (
    <BaseNode
      title="Response"
      badge={String(config?.statusCode ?? 200)}
      icon={<span>→</span>}
      color={NODE_COLORS.response}
      handles={['top']}
      fields={[
        { label: 'status', value: config?.statusCode ?? 200 },
        { label: 'wrap', value: config?.wrapInData ? 'true' : 'false' },
      ]}
    />
  );
}

// ── TRANSFORM NODE ────────────────────────────────────────────
export function TransformNode({ data }: NodeProps) {
  const config = data.config as TransformNodeConfig;
  return (
    <BaseNode
      title="Transform"
      badge="fn"
      icon={<span>⇄</span>}
      color={NODE_COLORS.transform}
      fields={[
        { value: config?.script ? config.script.slice(0, 30) + '…' : 'identity' },
      ]}
    />
  );
}

// ── EXTERNAL API NODE ─────────────────────────────────────────
export function ExternalApiNode({ data }: NodeProps) {
  const config = data.config as ExternalApiNodeConfig;
  return (
    <BaseNode
      title="External API"
      badge={config?.method ?? 'GET'}
      badgeClass={cn('badge', METHOD_COLORS[config?.method ?? 'GET'])}
      icon={<span>↗</span>}
      color={NODE_COLORS['external-api']}
      fields={[
        { value: config?.url ? new URL(config.url).hostname : 'url' },
        { label: 'timeout', value: `${config?.timeout ?? 5000}ms` },
      ]}
    />
  );
}

// ── CACHE NODE ────────────────────────────────────────────────
export function CacheNode({ data }: NodeProps) {
  const config = data.config as CacheNodeConfig;
  return (
    <BaseNode
      title="Cache"
      badge={config?.strategy ?? 'memory'}
      icon={<span>⚡</span>}
      color={NODE_COLORS.cache}
      fields={[
        { label: 'ttl', value: `${config?.ttl ?? 60}s` },
        { label: 'key', value: config?.key ?? 'auto' },
      ]}
    />
  );
}

// ── CONDITION NODE ────────────────────────────────────────────
export function ConditionNode({ data }: NodeProps) {
  const config = data.config as ConditionNodeConfig;
  return (
    <BaseNode
      title="Condition"
      badge="if"
      icon={<span>⋄</span>}
      color={NODE_COLORS.condition}
      handles={['top', 'bottom', 'right']}
      fields={[
        { value: config?.expression ? config.expression.slice(0, 28) : 'expression' },
        { label: 'true', value: config?.trueLabel ?? 'true' },
        { label: 'false', value: config?.falseLabel ?? 'false' },
      ]}
    />
  );
}

// ── LOGGER NODE ───────────────────────────────────────────────
export function LoggerNode({ data }: NodeProps) {
  const config = data.config as LoggerNodeConfig;
  return (
    <BaseNode
      title="Logger"
      badge={config?.level ?? 'info'}
      icon={<span>☰</span>}
      color={NODE_COLORS.logger}
      fields={[
        { value: config?.message ?? 'log message' },
      ]}
    />
  );
}

// ── Node type registry for React Flow ─────────────────────────
export const nodeTypes = {
  request: RequestNode,
  auth: AuthNode,
  validation: ValidationNode,
  'db-query': DbQueryNode,
  response: ResponseNode,
  transform: TransformNode,
  'external-api': ExternalApiNode,
  cache: CacheNode,
  condition: ConditionNode,
  logger: LoggerNode,
};
