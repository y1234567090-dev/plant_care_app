import React, { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { PYTHON_SOURCE_FILES } from '../data/pythonSources';

export const SourceFilesView: React.FC = () => {
  const [selectedFilename, setSelectedFilename] = useState(PYTHON_SOURCE_FILES[0].filename);
  const [copied, setCopied] = useState(false);

  const activeFile =
    PYTHON_SOURCE_FILES.find((f) => f.filename === selectedFilename) ?? PYTHON_SOURCE_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-4">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Project Files ({PYTHON_SOURCE_FILES.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {PYTHON_SOURCE_FILES.map((file) => {
            const isSelected = file.filename === activeFile.filename;
            return (
              <button
                key={file.filename}
                type="button"
                onClick={() => setSelectedFilename(file.filename)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <FileCode2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isSelected ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <p
                    className={`truncate font-mono text-xs font-medium ${
                      isSelected ? 'text-emerald-900' : 'text-slate-900'
                    }`}
                  >
                    {file.filename}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{file.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 lg:col-span-8">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <span className="font-mono text-xs font-medium text-white">{activeFile.filename}</span>
            <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
            <span className="text-xs text-slate-400">{activeFile.role}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="max-h-[540px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
          {activeFile.content}
        </pre>
      </div>
    </div>
  );
};
