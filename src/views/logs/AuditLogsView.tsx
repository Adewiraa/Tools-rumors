'use client';

import React from 'react';
import { useApp } from '@/logic/AppContext';
import { ChevronRight } from 'lucide-react';

export default function AuditLogsView() {
  const { auditLogs } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Audit Log</span></div>
        <h1 className="page-title">Audit Log</h1>
        <p className="page-description">Riwayat perubahan data penting dan aktivitas admin.</p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Modul</th>
              <th>Aksi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                <td><span className="semibold">{log.user}</span></td>
                <td><span className="badge badge-info">{log.module}</span></td>
                <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.action}</span></td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
