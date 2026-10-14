import { useMemo, useState } from 'react';
import { Search, SearchX, X } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';

/* Add Member — right-side picker for the Project page's Members group.
   The reference product uses a raw center modal over a messy directory; this is
   the same flow in the prototype's language: side drawer, searchable borderless
   grid with checkboxes, shared Pagination, primary Add. */

export interface DirectoryUser {
  name: string;
  email: string;
  logon: string;
  contact: string;
  dept: string;
}

const DIRECTORY: DirectoryUser[] = [
  { name: 'Arjun Mehta', email: 'arjun.mehta@motadata.com', logon: 'arjun.mehta', contact: '9825477848', dept: 'IT Operations' },
  { name: 'Priya Sharma', email: 'priya.sharma@motadata.com', logon: 'priya.sharma', contact: '9099665459', dept: 'Security' },
  { name: 'Rahul Deshmukh', email: 'rahul.deshmukh@motadata.com', logon: 'rahul.deshmukh', contact: '9825301114', dept: 'Infrastructure' },
  { name: 'Sneha Iyer', email: 'sneha.iyer@motadata.com', logon: 'sneha.iyer', contact: '---', dept: 'Engineering' },
  { name: 'Vikram Singh', email: 'vikram.singh@motadata.com', logon: 'vikram.singh', contact: '8800328899', dept: 'Operations' },
  { name: 'Kavita Rao', email: 'kavita.rao@motadata.com', logon: 'kavita.rao', contact: '9624514391', dept: 'Service Desk' },
  { name: 'Rohan Mehta', email: 'rohan.mehta@motadata.com', logon: 'rohan.mehta', contact: '---', dept: 'Engineering' },
  { name: 'Neha Raje', email: 'neha.raje@motadata.com', logon: 'neha.raje', contact: '9099887701', dept: 'Governance' },
  { name: 'Jainam Shah', email: 'jainam.shah@motadata.com', logon: 'jainam.shah', contact: '9825022200', dept: 'Procurement' },
  { name: 'Sarah Johnson', email: 'sarah.johnson@motadata.com', logon: 'sarah.johnson', contact: '---', dept: 'IT Support' },
  { name: 'David Martinez', email: 'david.martinez@motadata.com', logon: 'david.martinez', contact: '9724001133', dept: 'Networking' },
  { name: 'Lisa Anderson', email: 'lisa.anderson@motadata.com', logon: 'lisa.anderson', contact: '---', dept: 'Service Desk' },
  { name: 'Michael Chen', email: 'michael.chen@motadata.com', logon: 'michael.chen', contact: '9909112244', dept: 'Engineering' },
  { name: 'Pooja Verma', email: 'pooja.verma@motadata.com', logon: 'pooja.verma', contact: '9825446677', dept: 'Marketing' },
  { name: 'Ravi Nair', email: 'ravi.nair@motadata.com', logon: 'ravi.nair', contact: '---', dept: 'Finance' },
  { name: 'Ashini Sharma', email: 'ashini.sharma@motadata.com', logon: 'ashini.sharma', contact: '9099223311', dept: 'Sales' },
  { name: 'Navin Gadhvi', email: 'navin.gadhvi@motadata.com', logon: 'navin.gadhvi', contact: '9724556688', dept: 'Infrastructure' },
  { name: 'Udit Hotchandani', email: 'udit.hotchandani@motadata.com', logon: 'udit.h', contact: '8800328899', dept: 'Engineering' },
  { name: 'Arnav Desai', email: 'arnav.desai@motadata.com', logon: 'arnav.desai', contact: '---', dept: 'IT Operations' },
  { name: 'Kajal Dave', email: 'kajal.dave@motadata.com', logon: 'kajal.dave', contact: '9825667700', dept: 'HR' },
  { name: 'Aachal Panchal', email: 'aachal.panchal@motadata.com', logon: 'aachal.panchal', contact: '---', dept: 'Customer Support' },
  { name: 'Mark Harrison', email: 'mark.harrison@motadata.com', logon: 'mark.harrison', contact: '9998887766', dept: 'Networking' },
  { name: 'Sophie Laurent', email: 'sophie.laurent@motadata.com', logon: 'sophie.laurent', contact: '---', dept: 'Compliance' },
  { name: 'Ajith Kumar', email: 'ajith.kumar@motadata.com', logon: 'ajith.kumar', contact: '9845012299', dept: 'Database' },
  { name: 'Dharti Patel', email: 'dharti.patel@motadata.com', logon: 'dharti.patel', contact: '9099445566', dept: 'QA' },
  { name: 'Manuel Rodrigues', email: 'manuel.rodrigues@motadata.com', logon: 'manuel.r', contact: '---', dept: 'Facilities' },
  { name: 'Vaibhav Prajapati', email: 'vaibhav.prajapati@motadata.com', logon: 'vaibhav.p', contact: '9099665459', dept: 'Engineering' },
  { name: 'Khushi Vaniya', email: 'khushi.vaniya@motadata.com', logon: 'khushi.vaniya', contact: '---', dept: 'Procurement' },
  { name: 'Hardik Kacha', email: 'hardik.kacha@motadata.com', logon: 'hardik.kacha', contact: '9724990011', dept: 'IT Support' },
  { name: 'Edwin Muyeki', email: 'edwin.muyeki@motadata.com', logon: 'edwin.muyeki', contact: '---', dept: 'Cloud Platform' },
  { name: 'Prerana Joshi', email: 'prerana.joshi@motadata.com', logon: 'prerana.joshi', contact: '9825113355', dept: 'QA' },
  { name: 'Jay Vegda', email: 'jay.vegda@motadata.com', logon: 'jay.vegda', contact: '9099778822', dept: 'IT Support' },
  { name: 'Tabrez Ansari', email: 'tabrez.ansari@motadata.com', logon: 'tabrez.ansari', contact: '---', dept: 'Networking' },
  { name: 'Rosy Fernandes', email: 'rosy.fernandes@motadata.com', logon: 'rosy.fernandes', contact: '9845667788', dept: 'Service Desk' },
  { name: 'Hemal Trivedi', email: 'hemal.trivedi@motadata.com', logon: 'hemal.trivedi', contact: '---', dept: 'Security' },
  { name: 'Dhaval Rana', email: 'dhaval.rana@motadata.com', logon: 'dhaval.rana', contact: '9724334455', dept: 'Infrastructure' },
  { name: 'Naitik Soni', email: 'naitik.soni@motadata.com', logon: 'naitik.soni', contact: '---', dept: 'Engineering' },
  { name: 'Jake Conte', email: 'jake.conte@motadata.com', logon: 'jake.conte', contact: '9998112233', dept: 'Cloud Platform' },
  { name: 'Abhi Patel', email: 'abhi.patel@motadata.com', logon: 'abhi.patel', contact: '---', dept: 'Database' },
  { name: 'Sunil Rathi', email: 'sunil.rathi@motadata.com', logon: 'sunil.rathi', contact: '9825889900', dept: 'Facilities' },
  { name: 'Karan Modi', email: 'karan.modi@motadata.com', logon: 'karan.modi', contact: '---', dept: 'Finance' },
  { name: 'Aditi Kulkarni', email: 'aditi.kulkarni@motadata.com', logon: 'aditi.kulkarni', contact: '9909556677', dept: 'Marketing' },
];

const AVATAR_COLORS = ['#3D8BD0', '#7C3AED', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#0D9488'];
export const memberAvatarColor = (name: string) =>
  AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
export const memberInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

interface AddMembersPanelProps {
  /** People already in the Members list — shown as Added, not selectable again. */
  existingNames: string[];
  onClose: () => void;
  onAdd: (users: DirectoryUser[]) => void;
}

export function AddMembersPanel({ existingNames, onClose, onAdd }: AddMembersPanelProps) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const existing = useMemo(() => new Set(existingNames), [existingNames]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DIRECTORY;
    return DIRECTORY.filter(
      (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.logon.toLowerCase().includes(s),
    );
  }, [q]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const selectableOnPage = pageRows.filter((u) => !existing.has(u.name));
  const allPageSelected = selectableOnPage.length > 0 && selectableOnPage.every((u) => selected.has(u.name));

  const toggle = (name: string) => {
    if (existing.has(name)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const submit = () => {
    const users = DIRECTORY.filter((u) => selected.has(u.name));
    if (!users.length) return;
    onAdd(users);
    toast.success(`${users.length} member${users.length > 1 ? 's' : ''} added to the project`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[10001] flex h-full w-[760px] max-w-[95vw] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#111827]">Add Member</h2>
            <p className="mt-0.5 text-[12px] text-[#7B8FA5]">Select people from the directory to add to this project.</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 border-b border-[#F1F5F9] px-6 py-3">
          <div className="relative max-w-[380px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email or logon name..."
              className="w-full rounded border border-[#DFE5ED] bg-white py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
            />
          </div>
        </div>

        {/* Directory grid */}
        <div className="min-h-0 flex-1 overflow-auto">
          {pageRows.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 py-10">
              <div className="text-center">
                <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-[#F5F7FA]">
                  <SearchX className="size-8 text-[#7B8FA5]" />
                </div>
                <h3 className="mb-2 text-[14px] font-semibold text-[#364658]">No matching users</h3>
                <p className="text-[13px] text-[#7B8FA5]">Try different keywords — name, email or logon name.</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_#E5E7EB]">
                  <th className="w-[44px] px-4 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (allPageSelected) selectableOnPage.forEach((u) => next.delete(u.name));
                          else selectableOnPage.forEach((u) => next.add(u.name));
                          return next;
                        })
                      }
                      className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Name</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Email</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Logon Name</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Contact No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {pageRows.map((u) => {
                  const isMember = existing.has(u.name);
                  const isSel = selected.has(u.name);
                  return (
                    <tr
                      key={u.name}
                      onClick={() => toggle(u.name)}
                      className={`transition-colors ${
                        isMember ? 'opacity-60' : isSel ? 'cursor-pointer bg-[#F5FAFF]' : 'cursor-pointer hover:bg-[#f9fafb]'
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSel || isMember}
                          disabled={isMember}
                          onChange={() => toggle(u.name)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0 disabled:cursor-default"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#364658]">
                          <span
                            className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
                            style={{ backgroundColor: memberAvatarColor(u.name) }}
                          >
                            {memberInitials(u.name)}
                          </span>
                          {u.name}
                          {isMember && (
                            <span className="rounded-sm bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">Added</span>
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-[#364658]">{u.email}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-[#64748B]">{u.logon}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-[#64748B]">
                        {u.contact === '---' ? <span className="text-[#9ca3af]">---</span> : u.contact}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex-shrink-0 border-t border-[#F1F5F9]">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            itemsPerPage={perPage}
            totalItems={filtered.length}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => {
              setPerPage(v);
              setPage(1);
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-[#E5E7EB] px-6 py-4">
          <span className={`text-[12px] ${selected.size ? 'font-medium text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>
            {selected.size ? `${selected.size} selected` : 'No one selected yet'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={selected.size === 0}
              className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add{selected.size ? ` (${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
