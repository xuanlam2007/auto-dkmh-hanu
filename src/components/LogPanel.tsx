import { useEffect, useRef } from 'react';
import type { RegisterLogPayload } from '../types';

interface LogPanelProps {
  logs: RegisterLogPayload[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const logAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logAreaRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="log-panel" id="logArea" ref={logAreaRef}>
      {logs.map((log, index) => (
        <div key={index} className={log.type || 'info'}>{log.message}</div>
      ))}
    </div>
  );
}