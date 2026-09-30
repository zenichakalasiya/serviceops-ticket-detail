import { useEffect, useRef, useState } from 'react';
import { Search, X, Eye, Upload, ExternalLink, Pause, Play, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { AdminOsUpgradeDetail } from './AdminOsUpgradeDetail';
import { UploadIsoModal, UploadStatusPill, UPLOAD_TONE, jobPct } from './OsUpgradeUpload';
import type { UploadJob } from './OsUpgradeUpload';
import { OS_IMAGES, formatBytes, formatEta, formatStamp, seedAttempts } from './osUpgradeData';
import type { OsImage, OsUploadStatus, UploadAttempt } from './osUpgradeData';

/* OS Upgrade — Admin › Patch Management.
 *
 * The listing is the whole upload flow: each row is an OS image, its Action column is the only way
 * to attach an ISO, and a transfer started there keeps running in a dock while the admin carries on
 * elsewhere in the module. A row's Upload Status is DERIVED — an in-flight job wins over the stored
 * status — so the column, the popup and the dock can never disagree about what is happening. */

const TICK_MS = 400;
/** A 5 GB ISO should take long enough to be worth minimising, short enough to demo. */
const secondsFor = (bytes: number) => Math.min(40, Math.max(16, (bytes / 1024 ** 3) * 6));
/** Scripted mid-transfer failure, so the Failed state is reachable from the UI: name a file
 *  anything containing "fail" or "corrupt". Everything else uploads cleanly. */
const FAIL_MSG = 'Checksum verification failed — the ISO appears to be corrupted.';
const scriptedFailure = (name: string) => (/fail|corrupt/i.test(name) ? 0.62 : undefined);

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

/* No exit prop: with both breadcrumbs gone, leaving the module is the sidebar's job (its nav
 * rows and "Back to app"), and the detail page's back arrow only returns to the listing. */
export function AdminOsUpgradeModule() {
  const [images, setImages] = useState<OsImage[]>(OS_IMAGES);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [attempts, setAttempts] = useState<Record<string, UploadAttempt[]>>(
    () => Object.fromEntries(OS_IMAGES.map((i) => [i.id, seedAttempts(i)])),
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modalFor, setModalFor] = useState<string | null>(null);
  const [activityFor, setActivityFor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const jobFor = (id: string) => jobs.find((j) => j.imageId === id);
  const activeJobFor = (id: string) => jobs.find((j) => j.imageId === id && (j.status === 'uploading' || j.status === 'paused'));

  /** The status a row shows: an in-flight transfer overrides whatever is stored. */
  const rowStatus = (img: OsImage): OsUploadStatus => {
    const j = activeJobFor(img.id);
    if (!j) return img.status;
    return j.status === 'paused' ? 'Paused' : 'In Progress';
  };

  const addAttempt = (imageId: string, a: UploadAttempt) =>
    setAttempts((prev) => ({ ...prev, [imageId]: [a, ...(prev[imageId] ?? [])] }));

  // ── transfer lifecycle ───────────────────────────────────────────────────

  const finish = (job: UploadJob) => {
    const at = formatStamp(new Date());
    setImages((prev) => prev.map((i) => (i.id === job.imageId
      ? { ...i, status: 'Uploaded', uploadTime: at, size: formatBytes(job.fileSize), fileName: job.fileName }
      : i)));
    addAttempt(job.imageId, {
      id: job.jobId, fileName: job.fileName, size: formatBytes(job.fileSize), at, by: 'Aarti Shah', status: 'Uploaded',
    });
    toast.success(`${job.fileName} uploaded to ${job.imageId}`);
  };

  const fail = (job: UploadJob) => {
    setImages((prev) => prev.map((i) => (i.id === job.imageId ? { ...i, status: 'Failed' } : i)));
    addAttempt(job.imageId, {
      id: job.jobId, fileName: job.fileName, size: formatBytes(job.fileSize), at: formatStamp(new Date()),
      by: 'Aarti Shah', status: 'Failed', detail: FAIL_MSG,
    });
    toast.error(`${job.fileName} failed to upload`);
  };

  /* One interval drives every transfer. It reads the live jobs through a ref so the timer is set up
     once — recreating it on each state change would reset the tick and stall slow uploads. */
  const jobsRef = useRef<UploadJob[]>(jobs);
  jobsRef.current = jobs;
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    const current = jobsRef.current;
    if (!current.some((j) => j.status === 'uploading')) return;
    const finished: UploadJob[] = [];
    const failed: UploadJob[] = [];
    const next = current.map((j) => {
      if (j.status !== 'uploading') return j;
      // Mild jitter so the bar reads like a network transfer rather than a metronome.
      const loaded = Math.min(j.fileSize, j.loaded + j.rate * (TICK_MS / 1000) * (0.85 + Math.random() * 0.3));
      if (j.failAt && loaded / j.fileSize >= j.failAt) {
        const f: UploadJob = { ...j, loaded, status: 'failed', error: FAIL_MSG };
        failed.push(f);
        return f;
      }
      if (loaded >= j.fileSize) {
        const d: UploadJob = { ...j, loaded: j.fileSize, status: 'done' };
        finished.push(d);
        return d;
      }
      return { ...j, loaded };
    });
    setJobs(next);
    finished.forEach(finish);
    failed.forEach(fail);
  };
  useEffect(() => {
    const t = setInterval(() => tickRef.current(), TICK_MS);
    return () => clearInterval(t);
  }, []);

  const startUpload = (imageId: string, file: File) => {
    const img = images.find((i) => i.id === imageId);
    if (!img) return;
    const job: UploadJob = {
      jobId: `${imageId}-${Date.now()}`,
      imageId,
      imageName: img.title,
      file,
      fileName: file.name,
      fileSize: file.size,
      loaded: 0,
      status: 'uploading',
      rate: file.size / secondsFor(file.size),
      failAt: scriptedFailure(file.name),
    };
    // One transfer per image — starting a new one replaces any finished row for it.
    setJobs((prev) => [...prev.filter((j) => j.imageId !== imageId), job]);
  };

  const setJobStatus = (jobId: string, status: UploadJob['status']) =>
    setJobs((prev) => prev.map((j) => (j.jobId === jobId ? { ...j, status } : j)));

  const stopUpload = (job: UploadJob) => {
    setJobs((prev) => prev.filter((j) => j.jobId !== job.jobId));
    addAttempt(job.imageId, {
      id: job.jobId, fileName: job.fileName, size: formatBytes(job.fileSize), at: formatStamp(new Date()),
      by: 'Aarti Shah', status: 'Cancelled', detail: `Stopped by the uploader at ${Math.round(jobPct(job))}%.`,
    });
    toast.error(`Upload of ${job.fileName} stopped`);
  };

  const retryUpload = (job: UploadJob) =>
    setJobs((prev) => prev.map((j) => (j.jobId === job.jobId
      ? { ...j, loaded: 0, status: 'uploading', error: undefined, failAt: scriptedFailure(j.fileName) }
      : j)));

  /** Removes the ISO from an image. The record itself stays — only its file is gone, so the row
   *  and the detail card both fall back to "Not Uploaded" and can take a new one. `size` is the
   *  image's expected size in the catalogue, not the file's, so it is left alone. */
  const deleteIso = (img: OsImage) => {
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, status: 'Not Uploaded', uploadTime: '', fileName: '' } : i)));
    setJobs((prev) => prev.filter((j) => j.imageId !== img.id));
    toast.error(`ISO removed from ${img.id}`);
  };

  const dismissJob = (job: UploadJob) => setJobs((prev) => prev.filter((j) => j.jobId !== job.jobId));
  const clearFinished = () => setJobs((prev) => prev.filter((j) => j.status === 'uploading' || j.status === 'paused'));

  // ── detail page ──────────────────────────────────────────────────────────

  const detail = detailId ? images.find((i) => i.id === detailId) : null;

  const modalImage = modalFor ? images.find((i) => i.id === modalFor) : null;
  const activityImage = activityFor ? images.find((i) => i.id === activityFor) : null;

  /* One overlay at a time. The popup and the activity panel are two views of the same upload, and
     the dock is the popup's minimised form — showing them together gives an admin two competing
     sets of controls for one transfer. */
  const openModal = (id: string) => {
    setActivityFor(null);
    // A finished transfer is history, not a state to reopen — drop it so the popup comes back as a
    // file picker and the image can be re-uploaded. A FAILED one is kept, so Retry is still offered.
    setJobs((prev) => prev.filter((j) => !(j.imageId === id && j.status === 'done')));
    setModalFor(id);
  };
  const openActivity = (id: string) => { setModalFor(null); setActivityFor(id); };

  const overlays = (
    <>
      {modalImage && (
        <UploadIsoModal
          image={modalImage}
          job={jobFor(modalImage.id)}
          onClose={() => setModalFor(null)}
          onMinimize={() => setModalFor(null)}
          onStart={(file) => startUpload(modalImage.id, file)}
          onPause={() => { const j = activeJobFor(modalImage.id); if (j) setJobStatus(j.jobId, 'paused'); }}
          onResume={() => { const j = activeJobFor(modalImage.id); if (j) setJobStatus(j.jobId, 'uploading'); }}
          onStop={() => { const j = activeJobFor(modalImage.id); if (j) stopUpload(j); }}
          onRetry={() => { const j = jobFor(modalImage.id); if (j) retryUpload(j); }}
          onDiscard={() => { const j = jobFor(modalImage.id); if (j) dismissJob(j); }}
        />
      )}

      {activityImage && (
        <UploadActivityPanel
          image={activityImage}
          job={jobFor(activityImage.id)}
          attempts={attempts[activityImage.id] ?? []}
          onClose={() => setActivityFor(null)}
          onDelete={() => deleteIso(activityImage)}
        />
      )}

      {/* No floating dock. Minimising used to swap the popup for a panel in the corner, which
          reads as "the popup moved", not "the popup closed" — the row now carries the transfer. */}
    </>
  );

  if (detail) {
    return (
      <>
        <AdminOsUpgradeDetail
          image={detail}
          status={rowStatus(detail)}
          onBack={() => setDetailId(null)}
          job={jobFor(detail.id)}
          latestAttempt={(attempts[detail.id] ?? [])[0]}
          onStart={(f) => startUpload(detail.id, f)}
          onHistory={() => openActivity(detail.id)}
          onPause={() => { const j = activeJobFor(detail.id); if (j) setJobStatus(j.jobId, 'paused'); }}
          onResume={() => { const j = activeJobFor(detail.id); if (j) setJobStatus(j.jobId, 'uploading'); }}
          onStop={() => { const j = activeJobFor(detail.id); if (j) stopUpload(j); }}
          onDelete={() => deleteIso(detail)}
        />
        {overlays}
      </>
    );
  }

  // ── listing ──────────────────────────────────────────────────────────────

  const q = search.trim().toLowerCase();
  const rows = images.filter((i) => !q || [i.id, i.name, i.title, i.edition, i.language, i.platform, i.fileName]
    .some((f) => f.toLowerCase().includes(q)));
  const totalPages = Math.ceil(rows.length / perPage) || 1;
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <div className="px-4 py-6">
        {/* Page head — title, one line of purpose, docs. No breadcrumb: the nav already says
            where you are, and an admin listing is a destination, not a step in a trail. */}
        <div className="mb-5">
          <h1 className="text-[16px] font-semibold text-[#364658]">OS Upgrade</h1>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
            Upload the ISO file for upgrading the OS of the computers.{' '}
            {/* Explicit size — a bare button does NOT inherit the paragraph's font-size here. */}
            <button
              onClick={() => toast.success('Opening the OS Upgrade documentation')}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline"
            >View Docs <ExternalLink size={12} /></button>
          </p>
        </div>

        {/* Toolbar — search only. This listing has no scope tabs and no create action: an OS image
            is created by uploading an ISO onto a row, so a primary CTA would be a second, lying
            way in. */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search"
              className={inputCls}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={15} /></button>
            )}
          </div>
        </div>

        <div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="border-b border-[#e5e7eb]">
                <tr>
                  {['ID', 'Name', 'Language', 'Size', 'Upload Status', 'Upload Time', 'Platform', 'File action'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {pageRows.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No OS images match “{search}”.</td></tr>
                ) : pageRows.map((img) => {
                  const status = rowStatus(img);
                  const job = activeJobFor(img.id);
                  const history = attempts[img.id] ?? [];
                  // Nothing has ever been uploaded and nothing is running: there is no status to
                  // view, so the row carries the upload action alone.
                  const canView = history.length > 0 || !!job;
                  /* Why a Failed (or Cancelled) row ended that way, read off the attempt that
                     produced the current status — so the listing tells the same story the history
                     panel does instead of restating it in the row and pushing it to two lines. */
                  const reason = history.find((a) => a.status === status)?.detail;
                  return (
                    <tr key={img.id} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          onClick={() => setDetailId(img.id)}
                          className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
                        >{img.id}</button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDetailId(img.id)} className="block max-w-[220px] truncate text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]" title={img.title}>
                          {img.name}
                        </button>
                        <div className="max-w-[220px] truncate text-[12px] text-[#7B8FA5]">{img.osVersion} · {img.architecture}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{img.language}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-[#364658]">{img.size}</td>
                      {/* Once the popup is dismissed this cell IS the upload — status, how far
                          along, and how much is left, without anything floating over the page. */}
                      <td className="px-4 py-3">
                        {job ? (
                          <div className="w-[190px]">
                            <div className="flex items-center justify-between gap-2">
                              <UploadStatusPill status={status} />
                              <span className="text-[12px] font-semibold tabular-nums text-[#364658]">{Math.round(jobPct(job))}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEF2F6]">
                              <div
                                className="h-full rounded-full transition-[width] duration-300 ease-linear"
                                style={{ width: `${jobPct(job)}%`, backgroundColor: UPLOAD_TONE[status].dot }}
                              />
                            </div>
                            <div className="mt-1 truncate text-[11px] tabular-nums text-[#7B8FA5]">
                              {formatBytes(job.loaded)} of {formatBytes(job.fileSize)}
                              {job.status === 'uploading' && ` · ${formatEta((job.fileSize - job.loaded) / Math.max(job.rate, 1))}`}
                            </div>
                          </div>
                        ) : reason ? (
                          /* Radix needs a real element to attach to — UploadStatusPill doesn't
                             forward a ref, so the span is the trigger. */
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block cursor-help"><UploadStatusPill status={status} /></span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] text-wrap">{reason}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <UploadStatusPill status={status} />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">
                        {img.uploadTime || <span className="text-[12px] text-[#9ca3af]">---</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475467]">{img.platform}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canView && (
                            <button
                              onClick={() => openActivity(img.id)}
                              title="View upload status"
                              className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                            ><Eye size={16} /></button>
                          )}
                          {/* While a transfer runs the row owns it: pause and stop live here, in
                              the actions column, rather than in a panel floating over the page.
                              A greyed-out upload icon would have been a dead end. */}
                          {job ? (
                            <>
                              <button
                                onClick={() => setJobStatus(job.jobId, job.status === 'paused' ? 'uploading' : 'paused')}
                                title={job.status === 'paused' ? 'Resume upload' : 'Pause upload'}
                                className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                              >{job.status === 'paused' ? <Play size={15} /> : <Pause size={15} />}</button>
                              <button
                                onClick={() => stopUpload(job)}
                                title="Stop upload"
                                className="flex size-8 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]"
                              ><Square size={14} /></button>
                            </>
                          ) : (
                            <button
                              onClick={() => openModal(img.id)}
                              title="Upload ISO"
                              className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                            ><Upload size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            itemsPerPage={perPage}
            totalItems={rows.length}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => { setPerPage(v); setPage(1); }}
          />
        </div>
      </div>

      {overlays}
    </>
  );
}

// ── Upload activity (the eye icon) ─────────────────────────────────────────

function UploadActivityPanel({ image, job, attempts, onClose, onDelete }: {
  image: OsImage;
  job?: UploadJob;
  attempts: UploadAttempt[];
  onClose: () => void;
  /** Removes the ISO currently in place — offered on that row only. */
  onDelete: () => void;
}) {
  /* A transfer only becomes an attempt once it ends, so an in-flight one is prepended as a live
     row — otherwise removing the current-state card would hide an upload while it runs. */
  const live = job && (job.status === 'uploading' || job.status === 'paused')
    ? [{
      id: job.jobId,
      fileName: job.fileName,
      size: formatBytes(job.fileSize),
      by: 'Aarti Shah',
      at: `${Math.round(jobPct(job))}% uploaded`,
      status: (job.status === 'paused' ? 'Paused' : 'In Progress') as UploadAttempt['status'],
    }]
    : [];
  const rows: UploadAttempt[] = [...live, ...attempts];

  /** The ISO in place right now: the newest attempt that actually LANDED. A failed attempt on top
   *  of a good one doesn't replace it, so "newest row" would be the wrong answer — and once the
   *  file has been DELETED nothing is current at all, however the attempts ended. */
  const currentId = image.fileName ? attempts.find((a) => a.status === 'Uploaded')?.id : undefined;

  // Every attempt status is also an upload status, so one tone map serves both.
  const attemptTone = (s: UploadAttempt['status']) => UPLOAD_TONE[s];

  return (
    /* 860px, not 720: five columns of file/size/user/time/status don't fit 720 without the
       Status pill running off the edge, and Status is the column the panel exists for. */
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[860px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">Upload Status</h3>
            <p className="mt-0.5 truncate text-[13px] text-[#7B8FA5]">{image.id} · {image.title}</p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* History only — the state of the image is the CURRENT row's status, so a separate
              "current state" card above the table would just say it twice. */}
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-[13px] font-semibold text-[#364658]">Attempt history</h4>
            <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[12px] font-semibold text-[#64748B]">{rows.length}</span>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] px-4 py-10 text-center text-[13px] text-[#9CA3AF]">
              Nothing has been uploaded for {image.id} yet.
            </div>
          ) : (
            /* Standard borderless listing grid — no card, no tinted header. Full-bleed via -mx-5
               so the header rule spans the panel like it does on a list page. */
            /* table-fixed with declared column widths: the four right-hand columns get exactly
               what they need and File Name absorbs the rest, truncating. That makes horizontal
               scrolling impossible at any panel width — Status can never be pushed out of view. */
            <div>
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col className="w-[90px]" />
                  <col className="w-[130px]" />
                  <col className="w-[175px]" />
                  <col className="w-[105px]" />
                  <col className="w-[70px]" />
                </colgroup>
                <thead className="border-y border-[#e5e7eb]">
                  <tr>
                    {['File Name', 'Size', 'Uploaded By', 'Time', 'Status', 'Action'].map((h, i) => (
                      <th key={h} className={`whitespace-nowrap py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658] ${i === 0 ? 'pr-4' : 'px-4'} ${i === 5 ? 'pr-0' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] bg-white">
                  {rows.map((a) => {
                    const t = attemptTone(a.status);
                    const pill = (
                      <span
                        className={`inline-block rounded-sm px-2 py-0.5 text-[12px] font-medium ${a.detail ? 'cursor-help' : ''}`}
                        style={{ color: t.fg, backgroundColor: t.bg }}
                      >{a.status}</span>
                    );
                    return (
                      <tr key={a.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="py-3 pr-4">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-[13px] text-[#364658]" title={a.fileName}>{a.fileName}</span>
                            {/* The ISO actually in place — the newest attempt that LANDED, which
                                is not always the newest attempt. */}
                            {a.id === currentId && (
                              <span className="flex-shrink-0 rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">Current</span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-[#364658]">{a.size}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">{a.by}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#7B8FA5]">{a.at}</td>
                        {/* The reason lives on the status, not under the file name — the row stays
                            one line and the explanation is where the reader asks "why?". */}
                        <td className="whitespace-nowrap py-3 pl-4">
                          {a.detail ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{pill}</TooltipTrigger>
                              <TooltipContent className="max-w-[280px] text-wrap">{a.detail}</TooltipContent>
                            </Tooltip>
                          ) : pill}
                        </td>
                        {/* Only the CURRENT row can be deleted — the others are history, and there
                            is no file behind them left to remove. */}
                        <td className="whitespace-nowrap py-3 pl-4">
                          {a.id === currentId && (
                            <button
                              onClick={onDelete}
                              title="Delete this ISO"
                              className="flex size-8 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]"
                            ><Trash2 size={15} /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-[#DFE5ED] px-5 py-3">
          <button onClick={onClose} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Close</button>
        </div>
      </div>
    </div>
  );
}
