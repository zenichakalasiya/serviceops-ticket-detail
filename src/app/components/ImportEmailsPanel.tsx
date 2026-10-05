import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, Check, Download, Eye, FileSpreadsheet, Info, Trash2, Upload, X } from 'lucide-react';

/* Import Emails — the side panel behind the User Surveys "Import" button.
 *
 * Two steps: Upload → Map Fields. The upload step reads top to bottom in the order an admin
 * acts: file type → what to upload (title + one-liner, bound together) → one info line with the
 * sample file → the Select button → the capacity WARNING (only while emails were already added by
 * hand) → the chosen file → the overflow ERROR (only when the file holds more rows than fit).
 *
 * The cap is the survey audience's 500. Manually added emails take slots first, so a file can add
 * at most 500 − manual; rows past that are dropped from the END of the file. */

export const AUDIENCE_LIMIT = 500;

type FileType = 'csv' | 'excel';

interface Parsed {
  name: string;
  size: number;
  headers: string[];
  rows: string[][];
}

const btnPrimary = 'inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]';
const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]';
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';

/** Minimal CSV reader: handles quoted cells and CRLF, which is all a list of emails needs. */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim())) out.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) out.push(row);
  return out;
}

const kb = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** The sample is a FULL audience — 500 rows, the limit — so uploading it straight back shows the
 *  overflow error whenever emails were already added by hand. Served from public/samples/. */
function downloadSample(_type: FileType) {
  const a = document.createElement('a');
  a.href = `${import.meta.env.BASE_URL}samples/survey-emails-500.csv`;
  a.download = 'sample_emails.csv';
  a.click();
}

/* ── Notices — one component, three tones, so info / warning / error read as one family. ── */
const TONES = {
  info: { box: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]', icon: 'text-[#3D8BD0]', Icon: Info },
  warning: { box: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]', icon: 'text-[#F59E0B]', Icon: AlertTriangle },
  error: { box: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]', icon: 'text-[#DC2626]', Icon: AlertCircle },
} as const;

function Notice({ tone, plain, children }: { tone: keyof typeof TONES; plain?: boolean; children: React.ReactNode }) {
  const t = TONES[tone];
  /* plain = a hint line with no box: the icon sits on the CTA's left edge, centred on the text. */
  if (plain) {
    return (
      <div role={tone === 'error' ? 'alert' : 'status'} className="-mt-1 flex items-center gap-1.5 text-[12px] leading-[18px] text-[#92400E]">
        <t.Icon size={14} className={`flex-shrink-0 ${t.icon}`} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-[12px] leading-[18px] ${t.box}`}>
      <t.Icon size={15} className={`mt-px flex-shrink-0 ${t.icon}`} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const Dot = ({ n, label }: { n: 1 | 2; label: string }) => {
    const done = step > n;
    const active = step === n;
    return (
      <div className="flex items-center gap-2">
        <span className={`flex size-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
          done ? 'bg-[#ECFDF3] text-[#16A34A]' : active ? 'bg-[#3D8BD0] text-white' : 'border border-[#CBD5E1] text-[#7B8FA5]'
        }`}>{done ? <Check size={13} strokeWidth={3} /> : n}</span>
        <span className={`text-[13px] ${active ? 'font-semibold text-[#364658]' : done ? 'font-medium text-[#364658]' : 'text-[#7B8FA5]'}`}>{label}</span>
      </div>
    );
  };
  return (
    <div className="flex items-center gap-3">
      <Dot n={1} label="Upload file" />
      <span className={`h-px w-16 ${step > 1 ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`} />
      <Dot n={2} label="Map fields" />
    </div>
  );
}

function PreviewModal({ file, onClose }: { file: Parsed; onClose: () => void }) {
  const shown = file.rows.slice(0, 50);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="flex max-h-[80vh] w-[640px] flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-[#364658]">{file.name}</div>
            <div className="text-[12px] text-[#7B8FA5]">{file.rows.length} rows · showing the first {shown.length}</div>
          </div>
          <button type="button" onClick={onClose} className={iconBtn}><X size={16} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full leading-5">
            <thead className="sticky top-0 border-b border-[#e5e7eb] bg-white">
              <tr>
                <th className="w-12 px-4 py-2 text-left text-[12px] font-semibold text-[#7B8FA5]">#</th>
                {file.headers.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {shown.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-[12px] tabular-nums text-[#9CA3AF]">{i + 1}</td>
                  {file.headers.map((_, j) => <td key={j} className="whitespace-nowrap px-4 py-2 text-[13px] text-[#364658]">{r[j] ?? ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ImportEmailsPanel({ manualCount, onClose }: {
  /** Emails already written into the audience by hand — they take slots before the file does. */
  manualCount: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<FileType>('csv');
  const [file, setFile] = useState<Parsed | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [emailCol, setEmailCol] = useState(0);
  const [nameCol, setNameCol] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, AUDIENCE_LIMIT - manualCount);
  const skipped = file ? Math.max(0, file.rows.length - remaining) : 0;
  const imported = file ? file.rows.length - skipped : 0;
  const label = type === 'csv' ? 'CSV' : 'Excel';

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !preview) onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, preview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFileError(null);
    const ext = f.name.split('.').pop()?.toLowerCase();
    const ok = type === 'csv' ? ext === 'csv' : ext === 'xlsx' || ext === 'xls';
    if (!ok) { setFileError(`“${f.name}” isn’t a${type === 'csv' ? ' CSV' : 'n Excel'} file. Choose a .${type === 'csv' ? 'csv' : 'xlsx'} file.`); return; }
    if (type === 'excel') {
      /* No spreadsheet parser in this prototype — an Excel file is accepted and counted as a
         mock 420 rows so the overflow message can still be seen. */
      setFile({ name: f.name, size: f.size, headers: ['Email', 'Name'], rows: Array.from({ length: 420 }, (_, i) => [`user${i + 1}@acme.com`, `User ${i + 1}`]) });
      return;
    }
    f.text().then((text) => {
      const all = parseCsv(text.replace(/^﻿/, ''));
      if (all.length < 2) { setFileError(`“${f.name}” has no rows under the header. Add at least one email.`); return; }
      const [headers, ...rows] = all;
      setFile({ name: f.name, size: f.size, headers, rows });
      const ei = headers.findIndex((h) => /e-?mail/i.test(h));
      const ni = headers.findIndex((h) => /name/i.test(h));
      setEmailCol(ei >= 0 ? ei : 0);
      setNameCol(ni);
    });
  };

  const removeFile = () => { setFile(null); setFileError(null); if (inputRef.current) inputRef.current.value = ''; };

  const switchType = (t: FileType) => { if (t === type) return; setType(t); removeFile(); };

  const sample = useMemo(() => file?.rows.slice(0, 3) ?? [], [file]);

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-[720px] max-w-full flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header — title, then where you are in the flow */}
        <div className="border-b border-[#E5E7EB] px-5 pb-4 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#364658]">Import Emails</h2>
            <button type="button" onClick={onClose} className={iconBtn}><X size={16} /></button>
          </div>
          <Stepper step={step} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 text-[12px] font-medium text-[#64748B]">Import file type</div>
                <div className="pill-track w-fit">
                  <button type="button" aria-pressed={type === 'csv'} onClick={() => switchType('csv')}>CSV</button>
                  <button type="button" aria-pressed={type === 'excel'} onClick={() => switchType('excel')}>Excel</button>
                </div>
              </div>

              {/* Title and its one-liner are one block — 4px apart, never separated by other lines. */}
              <div>
                <h3 className="text-[14px] font-semibold text-[#364658]">Upload {label}</h3>
                <p className="mt-1 text-[12px] leading-[18px] text-[#7B8FA5]">
                  Use a UTF-8 {label} file with field names in the first row. Values over 255 characters are truncated.
                </p>

                {/* A quiet text link, not a callout — it is a helper, not something to act on first. */}
                <button
                  type="button"
                  onClick={() => downloadSample(type)}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline"
                >
                  <Download size={13} /> Download sample {label}
                </button>
              </div>

              <div className="space-y-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept={type === 'csv' ? '.csv,text/csv' : '.xlsx,.xls'}
                  className="hidden"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
                <button type="button" onClick={() => inputRef.current?.click()} className={btnPrimary}>
                  <Upload size={15} /> {file ? `Replace ${label}` : `Select ${label}`}
                </button>

                {/* Capacity — only says something when hand-added emails have already used slots. */}
                {manualCount > 0 && (
                  <Notice tone="warning" plain>
                    <span className="font-medium">{manualCount} emails were added manually</span>, so this file can add up to{' '}
                    <span className="font-medium">{remaining}</span> more (limit {AUDIENCE_LIMIT}).
                  </Notice>
                )}

                {fileError && <Notice tone="error">{fileError}</Notice>}

                {file && (
                  <div className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5">
                    <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]"><FileSpreadsheet size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#364658]" title={file.name}>{file.name}</div>
                      <div className="text-[12px] text-[#7B8FA5]">{kb(file.size)} · {file.rows.length} rows</div>
                    </div>
                    <button type="button" onClick={() => setPreview(true)} title="Preview" className={iconBtn}><Eye size={15} /></button>
                    <button type="button" onClick={removeFile} title="Remove file" className={`${iconBtn} hover:!bg-[#FEF2F2] hover:!text-[#DC2626]`}><Trash2 size={15} /></button>
                  </div>
                )}

                {file && skipped > 0 && (
                  <Notice tone="error">
                    <span className="font-medium">The last {skipped} of {file.rows.length} rows won’t be imported.</span>{' '}
                    {manualCount > 0
                      ? <>Only {remaining} fit, because {manualCount} emails were already added manually. </>
                      : <>The audience holds at most {AUDIENCE_LIMIT} emails. </>}
                    Rows {remaining + 1}–{file.rows.length} will be skipped.
                  </Notice>
                )}
              </div>
            </div>
          ) : file && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[14px] font-semibold text-[#364658]">Map fields</h3>
                <p className="mt-1 text-[12px] leading-[18px] text-[#7B8FA5]">Pick which column of {file.name} holds each survey field.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#64748B]">Email <span className="text-[#DC2626]">*</span></span>
                  <select value={emailCol} onChange={(e) => setEmailCol(+e.target.value)} className="app-select h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658]">
                    {file.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#64748B]">Name</span>
                  <select value={nameCol} onChange={(e) => setNameCol(+e.target.value)} className="app-select h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658]">
                    <option value={-1}>Don’t import</option>
                    {file.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
              </div>

              <div>
                <div className="mb-1.5 text-[12px] font-medium text-[#64748B]">Preview</div>
                <div className="overflow-hidden rounded-md border border-[#E5E7EB]">
                  <table className="w-full leading-5">
                    <thead className="border-b border-[#e5e7eb] bg-[#F9FAFB]">
                      <tr>
                        <th className="px-4 py-2 text-left text-[12px] font-semibold text-[#364658]">Email</th>
                        <th className="px-4 py-2 text-left text-[12px] font-semibold text-[#364658]">Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {sample.map((r, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-[13px] text-[#364658]">{r[emailCol]}</td>
                          <td className="px-4 py-2 text-[13px] text-[#364658]">{nameCol >= 0 ? r[nameCol] : <span className="text-[#9CA3AF]">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {skipped > 0 && (
                <Notice tone="error"><span className="font-medium">{imported} emails will be imported;</span> the last {skipped} rows are skipped to stay within {AUDIENCE_LIMIT}.</Notice>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          {step === 2 && <button type="button" onClick={() => setStep(1)} className={`${btnSecondary} mr-auto`}>Back</button>}
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          {step === 1 ? (
            <button type="button" disabled={!file || imported === 0} onClick={() => setStep(2)} className={btnPrimary}>Next</button>
          ) : (
            <button
              type="button"
              onClick={() => { toast.success(`${imported} emails imported`); onClose(); }}
              className={btnPrimary}
            >Import {imported} emails</button>
          )}
        </div>
      </div>

      {preview && file && <PreviewModal file={file} onClose={() => setPreview(false)} />}
    </div>
  );
}
