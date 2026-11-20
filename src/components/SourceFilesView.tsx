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
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] lg:col-span-4">
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Project files ({PYTHON_SOURCE_FILES.length})
          </h2>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {PYTHON_SOURCE_FILES.map((file) => {
            const isSelected = file.filename === activeFile.filename;
            return (
              <button
                key={file.filename}
                type="button"
                onClick={() => setSelectedFilename(file.filename)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected ? 'bg-[var(--bg-muted)]' : 'hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <FileCode2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isSelected ? 'text-[var(--status-healthy)]' : 'text-[var(--text-faint)]'
                  }`}
                />
                <div className="min-w-0">
                  <p
                    className={`truncate font-mono text-xs font-medium ${
                      isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {file.filename}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{file.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2C3B32] bg-[#131D17] lg:col-span-8">
        <div className="flex items-center justify-between border-b border-[#26362C] px-4 py-3">
          <div>
            <span className="font-mono text-xs font-medium text-white">{activeFile.filename}</span>
            <span className="mx-2 text-[#5B6E62]" aria-hidden="true">·</span>
            <span className="text-xs text-[#A3B3A8]">{activeFile.role}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#34473B] bg-[#1E2D24] px-2.5 py-1 text-xs font-medium text-[#E2EBE4] transition-colors hover:bg-[#273B2F] whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#7DD397]" />
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
        <pre className="max-h-[520px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#DDE6DF]">
          {activeFile.content}
        </pre>
      </div>
    </div>
  );
};
