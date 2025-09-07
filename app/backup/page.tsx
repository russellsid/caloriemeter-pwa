'use client';
import { useState } from 'react';
import { exportAll, importAll, BackupBundle } from '../../lib/repos/backup';

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);

  async function onExport() {
    try {
      setDownloading(true);
      const bundle = await exportAll();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `calorie-meter-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const text = await file.text();
      const bundle = JSON.parse(text) as BackupBundle;
      await importAll(bundle, { replace: true });
      alert('Backup imported! Returning to Home.');
      window.location.href = '/';
    } catch (err: any) {
      alert('Import failed: ' + (err?.message || String(err)));
    } finally {
      setImporting(false);
    }
  }

  return (
    <main>
      <h1>Backup</h1>
      <div className="card">
        <p>Export your recipes, entries, profiles, and targets to a JSON file, or restore them from a file.</p>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <button className="btn" onClick={onExport} disabled={downloading}>
            {downloading ? 'Exporting…' : 'Export JSON'}
          </button>
          <label className="btn" htmlFor="importFile" style={{ cursor: 'pointer' }}>
            {importing ? 'Importing…' : 'Import JSON'}
          </label>
          <input id="importFile" type="file" accept="application/json" style={{ display: 'none' }} onChange={onImport} />
          <a className="btn" href="/">Home</a>
        </div>
        <p className="small">Tip: export regularly; importing will replace current data.</p>
      </div>
    </main>
  );
}
