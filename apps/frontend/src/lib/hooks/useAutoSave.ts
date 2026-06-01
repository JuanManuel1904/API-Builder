import { useEffect, useRef } from 'react';
import { useUpdateProjectMetadata } from '@/lib/api/hooks';
import type { ProjectMetadata } from '@vab/types';

/**
 * Debounced auto-save: saves metadata 1.5s after the last change.
 * Only fires when isDirty=true (set by the store) to avoid saving on initial load.
 */
export function useAutoSave(
  projectId: string,
  metadata: ProjectMetadata,
  onSaved: () => void,
  isDirty = false,
  delay = 1500,
) {
  const updateMeta = useUpdateProjectMetadata(projectId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metaRef = useRef(metadata);

  // Always keep ref current so the timeout closure reads latest value
  metaRef.current = metadata;

  useEffect(() => {
    if (!projectId || !isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        await updateMeta.mutateAsync(metaRef.current as unknown as Record<string, unknown>);
        onSaved();
      } catch {
        // Silent fail — user can manually save via topbar button
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [metadata, projectId, isDirty, delay]);

  return updateMeta;
}
