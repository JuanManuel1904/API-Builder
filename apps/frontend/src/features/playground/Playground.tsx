import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/store/project.store';
import { METHOD_COLORS, cn } from '@/lib/utils';
import type { HttpMethod } from '@vab/types';

interface Props {
  projectId: string;
}

interface RequestState {
  method: HttpMethod;
  url: string;
  headers: string;
  body: string;
}

interface ResponseState {
  status: number | null;
  data: unknown;
  time: number | null;
  error: string | null;
}

export function Playground({ projectId }: Props) {
  const { metadata } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [req, setReq] = useState<RequestState>({
    method: 'GET',
    url: 'http://localhost:3001/api/',
    headers: '{\n  "Authorization": "Bearer <token>"\n}',
    body: '{\n  \n}',
  });
  const [res, setRes] = useState<ResponseState>({ status: null, data: null, time: null, error: null });
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'response'>('body');

  const send = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      let parsedHeaders: Record<string, string> = {};
      try { parsedHeaders = JSON.parse(req.headers); } catch {}

      const result = await axios({
        method: req.method.toLowerCase() as any,
        url: req.url,
        headers: parsedHeaders,
        data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.parse(req.body || '{}') : undefined,
        validateStatus: () => true,
      });

      setRes({ status: result.status, data: result.data, time: Date.now() - start, error: null });
      setActiveTab('response');
    } catch (err: any) {
      setRes({ status: null, data: null, time: Date.now() - start, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fillFromEndpoint = (path: string, method: HttpMethod) => {
    setReq((r) => ({ ...r, url: `http://localhost:3001/api${path}`, method }));
  };

  const statusColor = res.status
    ? res.status < 300 ? 'text-emerald-400' : res.status < 400 ? 'text-amber-400' : 'text-red-400'
    : 'text-text-muted';

  return (
    <div className="flex h-full text-xs">
      {/* Endpoint list */}
      <div className="w-48 border-r border-border overflow-y-auto flex-shrink-0">
        <div className="px-3 py-2 border-b border-border">
          <span className="label mb-0">Endpoints</span>
        </div>
        {metadata.endpoints.map((ep) => (
          <button
            key={ep.id}
            onClick={() => fillFromEndpoint(ep.path, ep.method)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-bg-3 transition-colors text-left"
          >
            <span className={cn('badge text-[8px] px-1', METHOD_COLORS[ep.method])}>{ep.method}</span>
            <span className="text-text-muted font-mono truncate text-[10px]">{ep.path}</span>
          </button>
        ))}
        {metadata.endpoints.length === 0 && (
          <p className="px-3 py-2 text-[10px] text-text-muted">No endpoints</p>
        )}
      </div>

      {/* Request panel */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* URL bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <select
            className="select w-24 py-1 text-[11px] flex-shrink-0"
            value={req.method}
            onChange={(e) => setReq((r) => ({ ...r, method: e.target.value as HttpMethod }))}
          >
            {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            className="input flex-1 py-1 text-[11px] font-mono"
            value={req.url}
            onChange={(e) => setReq((r) => ({ ...r, url: e.target.value }))}
            placeholder="https://..."
          />
          <button
            onClick={send}
            disabled={loading}
            className="btn btn-primary px-3 py-1 flex-shrink-0 disabled:opacity-50"
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-2">
          {(['headers', 'body', 'response'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'px-3 py-1.5 text-[11px] border-b-2 transition-colors capitalize',
                activeTab === t ? 'text-text border-accent' : 'text-text-muted border-transparent hover:text-text',
              )}
            >
              {t}
              {t === 'response' && res.status !== null && (
                <span className={cn('ml-1.5 font-mono', statusColor)}>{res.status}</span>
              )}
            </button>
          ))}
          {res.time !== null && (
            <span className="ml-auto self-center text-[10px] text-text-muted">{res.time}ms</span>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-2">
          {activeTab === 'headers' && (
            <textarea
              className="input w-full h-full font-mono text-[10px] resize-none"
              value={req.headers}
              onChange={(e) => setReq((r) => ({ ...r, headers: e.target.value }))}
              spellCheck={false}
            />
          )}
          {activeTab === 'body' && (
            <textarea
              className="input w-full h-full font-mono text-[10px] resize-none"
              value={req.body}
              onChange={(e) => setReq((r) => ({ ...r, body: e.target.value }))}
              placeholder='{ "key": "value" }'
              disabled={req.method === 'GET' || req.method === 'DELETE'}
              spellCheck={false}
            />
          )}
          {activeTab === 'response' && (
            <div className="h-full">
              {res.error ? (
                <p className="text-red-400 font-mono text-[10px]">{res.error}</p>
              ) : res.data !== null ? (
                <pre className="font-mono text-[10px] text-text leading-5 whitespace-pre-wrap break-all">
                  {JSON.stringify(res.data, null, 2)}
                </pre>
              ) : (
                <p className="text-text-muted text-[10px]">Send a request to see the response</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
