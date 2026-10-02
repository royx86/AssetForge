import React from 'react';

export function MethodBadge({ method }) {
  const m = (method || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (m === 'GET') {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (m === 'POST') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (m === 'PUT' || m === 'PATCH') {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (m === 'DELETE') {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${color}`}
    >
      {m}
    </span>
  );
}

export function StatusBadge({ status }) {
  const code = parseInt(status, 10);
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (code >= 200 && code < 300) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (code >= 300 && code < 400) {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (code === 429) {
    color = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (code >= 400 && code < 500) {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (code >= 500) {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${color}`}
    >
      {code}
    </span>
  );
}

export function FormatBadge({ format }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
      {format}
    </span>
  );
}
