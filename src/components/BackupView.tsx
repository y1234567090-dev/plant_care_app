import React, { useState } from 'react';
import { CloudUpload, Download, HardDrive, RotateCcw, Trash2 } from 'lucide-react';
import { BackupBlobRecord, BackupTarget, PlantRecord } from '../types/plant';

interface BackupViewProps {
  plants: PlantRecord[];
  backups: BackupBlobRecord[];
  onCreateBackup: (target: BackupTarget) => BackupBlobRecord;
  onRestoreBackup: (blob: BackupBlobRecord) => void;
  onDeleteBackup: (id: string) => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  plants,
  backups,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
}) => {
  const [target, setTarget] = useState<BackupTarget>('azurite');
  const [connectionStringSet, setConnectionStringSet] = useState(true);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    'Ready to run backup_database() from azure_backup.py or azurebackup.py.',
  ]);
  const [restoredMessage, setRestoredMessage] = useState<string | null>(null);

  const handleRunBackup = () => {
    setRestoredMessage(null);
    if (target === 'azurite') {
      const containerExists = backups.some((b) => b.target === 'azurite');
      const created = onCreateBackup('azurite');
      setConsoleLines([
        '$ python azure_backup.py',
        'Connected to Azurite successfully!',
        containerExists ? 'Backup container already exists!' : 'Backup container created!',
        '',
        'Database backup successful!',
        `Backup file: ${created.blobName}`,
        'Storage: Local Azurite Blob Storage (http://127.0.0.1:10000/devstoreaccount1)',
      ]);
      return;
    }

    if (!connectionStringSet) {
      setConsoleLines([
        '$ python azurebackup.py',
        'AZURE_STORAGE_CONNECTION_STRING is not set.',
      ]);
      return;
    }

    const created = onCreateBackup('azure_cloud');
    setConsoleLines([
      '$ python azurebackup.py',
      `Azure backup uploaded successfully: ${created.blobName}`,
      `Container: ${created.containerName}`,
    ]);
  };

  const handleDownloadSql = () => {
    const escapeSql = (val: string) => val.replace(/'/g, "''");
    const lines = [
      '-- Plant Care Tracker SQLite Snapshot',
      'CREATE TABLE IF NOT EXISTS plants (',
      '    id INTEGER PRIMARY KEY AUTOINCREMENT,',
      '    name TEXT NOT NULL,',
      '    plant_type TEXT,',
      '    watering_days INTEGER,',
      '    sunlight TEXT,',
      "    health TEXT DEFAULT 'Healthy',",
      '    last_watered TEXT',
      ');',
      '',
      ...plants.map((p) => {
        const lastWateredSql = p.last_watered ? `'${escapeSql(p.last_watered)}'` : 'NULL';
        return `INSERT INTO plants (id, name, plant_type, watering_days, sunlight, health, last_watered) VALUES (${p.id}, '${escapeSql(p.name)}', '${escapeSql(p.plant_type)}', ${p.watering_days}, '${escapeSql(p.sunlight)}', '${escapeSql(p.health)}', ${lastWateredSql});`;
      }),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plants_snapshot.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Target configuration & runner */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Blob Storage Target</h2>
            <p className="mt-1 text-xs text-slate-500">
              Preview the local Azurite emulator workflow (<span className="font-mono">azure_backup.py</span>) or
              timestamped Azure Blob Storage uploads (<span className="font-mono">azurebackup.py</span>).
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
            role="tablist"
            aria-label="Backup destination"
          >
            <button
              type="button"
              role="tab"
              aria-selected={target === 'azurite'}
              onClick={() => setTarget('azurite')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                target === 'azurite'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              Local Azurite
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={target === 'azure_cloud'}
              onClick={() => setTarget('azure_cloud')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                target === 'azure_cloud'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CloudUpload className="h-3.5 w-3.5" />
              Azure Cloud
            </button>
          </div>

          <dl className="divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500">Container</dt>
              <dd className="font-mono text-slate-800">plant-care-backups</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500">Endpoint / Strategy</dt>
              <dd className="font-mono text-slate-800">
                {target === 'azurite' ? '127.0.0.1:10000/devstoreaccount1' : 'BlobServiceClient (UTC)'}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500">Blob Naming</dt>
              <dd className="font-mono text-slate-800">
                {target === 'azurite' ? 'plants.db (overwrite=True)' : 'plants-YYYYMMDDTHHMMSSZ.db'}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500">Current Rows</dt>
              <dd className="font-mono tabular-nums text-slate-800">{plants.length} plants</dd>
            </div>
          </dl>

          {target === 'azure_cloud' && (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={connectionStringSet}
                onChange={(e) => setConnectionStringSet(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              <span>Simulate <code className="font-mono">AZURE_STORAGE_CONNECTION_STRING</code> present</span>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleRunBackup}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              Run Backup Snapshot
            </button>
            <button
              type="button"
              onClick={handleDownloadSql}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Export SQL
            </button>
          </div>
        </div>

        {/* Right: Execution output & stored blobs */}
        <div className="space-y-4 lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 scale-light">
            <div className="border-b border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300">
              Script Output
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
              {consoleLines.join('\n')}
            </pre>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Container Blobs ({backups.length})
              </h3>
              {restoredMessage && (
                <span className="text-xs font-medium text-emerald-700">{restoredMessage}</span>
              )}
            </div>

            {backups.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-900">No backup blobs uploaded yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Run a backup snapshot on the left to populate the <span className="font-mono">plant-care-backups</span> container.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {backups.map((blob) => (
                  <div
                    key={blob.id}
                    className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-slate-900">
                        {blob.blobName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span>{blob.target === 'azurite' ? 'Local Azurite' : 'Azure Cloud'}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{blob.plantCount} plants</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{blob.sizeBytes} B</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{blob.uploadedAt}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreBackup(blob);
                          setRestoredMessage(`Restored ${blob.plantCount} plants from ${blob.blobName}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBackup(blob.id)}
                        aria-label={`Delete blob ${blob.blobName}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
