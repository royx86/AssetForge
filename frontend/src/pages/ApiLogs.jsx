import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { logAPI } from '../services/api';
import { MethodBadge, StatusBadge } from '../components/common/Badge';
import { ScrollText, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function ApiLogs() {
  const { activeProject } = useProject();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchLogs = useCallback(async () => {
    if (!activeProject?.id) return;
    try {
      setLoading(true);
      const res = await logAPI.list(activeProject.id, {
        page,
        limit: 20,
        method: method || undefined,
        statusCode: statusCode || undefined
      });
      setLogs(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load API logs:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id, page, method, statusCode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            API Request Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time audit log of external HTTP requests made using project API keys
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shrink-0 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
          </span>

          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0972d3]"
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <select
            value={statusCode}
            onChange={(e) => {
              setStatusCode(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0972d3]"
          >
            <option value="">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="429">429 Rate Limited</option>
            <option value="500">500 Server Error</option>
          </select>

          {(method || statusCode) && (
            <button
              onClick={() => {
                setMethod('');
                setStatusCode('');
                setPage(1);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-slate-500">
          Total Logs: <strong>{pagination.total || 0}</strong>
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-semibold">Loading request logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ScrollText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No logs found</p>
            <p className="text-xs text-slate-500 mt-1">
              {method || statusCode
                ? 'No requests match the selected filters.'
                : 'Send an external request using your API key to view live logs.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider font-bold">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Endpoint</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4">API Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                {logs.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {date.toLocaleTimeString()} {date.toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <MethodBadge method={log.method} />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {log.endpoint}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={log.statusCode} />
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {log.responseTime}ms
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-sans text-xs">
                        {log.apiKey ? (
                          <span title={log.apiKey.maskedKey}>
                            {log.apiKey.name}{' '}
                            <span className="font-mono text-[11px] text-slate-400">
                              ({log.apiKey.maskedKey.slice(-4)})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
