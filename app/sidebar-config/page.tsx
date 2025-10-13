'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  ResponderProvided,
} from '@hello-pangea/dnd';
import * as Fi from 'react-icons/fi';
import {
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:5000/api';

/* ----------------------------- Types ----------------------------- */

interface SubItem {
  _id: string;
  name: string;
  href: string;
  icon: string;
  order: number;
  roles: string[];
}

interface NavItem {
  _id: string;
  name: string;
  href?: string; // optional now
  icon: string;
  order: number;
  subItems: SubItem[];
  roles: string[];
}

/* --------------------------- Utilities --------------------------- */

const fetchJSON = async <T,>(input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
};

const IconPreview = ({ name, className = 'w-5 h-5' }: { name: string; className?: string }) => {
  const Comp = (Fi as any)[name] ?? (Fi as any).FiCircle;
  return <Comp className={className} />;
};

const TextField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`border rounded px-3 py-2 outline-none focus:ring focus:ring-blue-200 ${props.className ?? ''}`}
  />
);

const SmallBtn = ({
  children,
  onClick,
  variant = 'ghost',
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'danger' | 'primary';
  title?: string;
}) => {
  const base = 'inline-flex items-center justify-center rounded px-2 py-1 text-sm';
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : variant === 'danger'
      ? 'text-red-600 hover:text-red-700'
      : 'text-gray-600 hover:text-gray-800';
  return (
    <button className={`${base} ${styles}`} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
};

/* --------------------------- Main Page --------------------------- */

export default function SidebarConfigPage() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // parent add form
  const [parentForm, setParentForm] = useState({ name: '', href: '', icon: 'FiHome', roles: '' });

  // sub forms map
  const [subForms, setSubForms] = useState<Record<string, { name: string; href: string; icon: string; roles: string }>>({});

  // editing state for parent & sub (inline)
  const [editingParent, setEditingParent] = useState<Record<string, Partial<NavItem>>>({});
  const [editingSub, setEditingSub] = useState<Record<string, Partial<SubItem>>>({});

  // fetch
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJSON<NavItem[]>(`${BASE_URL}/sidebar`);
        // ensure subItems array + roles
        setItems(data.map((i) => ({ ...i, subItems: i.subItems || [], roles: i.roles || [] })));
      } catch (e: any) {
        setErr(e.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* -------------------------- CRUD: Parent -------------------------- */

  const addParent = async () => {
    if (!parentForm.name.trim()) return; // name required, href optional
    try {
      const payload = { ...parentForm, roles: parentForm.roles.split(',').map((r) => r.trim()).filter(Boolean) };
      const created = await fetchJSON<NavItem>(`${BASE_URL}/sidebar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems((prev) => [...prev, { ...created, subItems: created.subItems || [] }]);
      setParentForm({ name: '', href: '', icon: 'FiHome', roles: '' });
    } catch (e: any) {
      alert(e.message || 'Failed to add menu');
    }
  };

  const deleteParent = async (id: string) => {
    if (!confirm('Delete this menu (and all its sub-menus)?')) return;
    try {
      await fetchJSON(`${BASE_URL}/sidebar/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  const startEditParent = (p: NavItem) => {
    setEditingParent((prev) => ({ ...prev, [p._id]: { name: p.name, href: p.href ?? '', icon: p.icon, roles: (p.roles || []).join(', ') } }));
  };

  const cancelEditParent = (id: string) => {
    setEditingParent((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const saveEditParent = async (id: string) => {
    const changes = editingParent[id];
    if (!changes) return;
    if (!changes.name?.trim()) return; // require name only
    try {
      const payload = { ...changes, roles: typeof changes.roles === 'string' ? (changes.roles as string).split(',').map((r) => r.trim()).filter(Boolean) : changes.roles };
      const updated = await fetchJSON<NavItem>(`${BASE_URL}/sidebar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems((prev) => prev.map((i) => (i._id === id ? { ...updated, subItems: updated.subItems || [] } : i)));
      cancelEditParent(id);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    }
  };

  /* --------------------------- CRUD: Sub --------------------------- */

  const addSub = async (parentId: string) => {
    const form = subForms[parentId];
    if (!form?.name?.trim() || !form?.href?.trim()) return; // sub needs href
    try {
      const payload = { ...form, roles: form.roles.split(',').map((r) => r.trim()).filter(Boolean) };
      const updatedParent = await fetchJSON<NavItem>(`${BASE_URL}/sidebar/${parentId}/sub-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems((prev) => prev.map((i) => (i._id === parentId ? { ...updatedParent, subItems: updatedParent.subItems || [] } : i)));
      setSubForms((prev) => ({ ...prev, [parentId]: { name: '', href: '', icon: 'FiCircle', roles: '' } }));
    } catch (e: any) {
      alert(e.message || 'Failed to add sub-menu');
    }
  };

  const deleteSub = async (parentId: string, subId: string) => {
    if (!confirm('Delete this sub-menu?')) return;
    try {
      const updatedParent = await fetchJSON<NavItem>(`${BASE_URL}/sidebar/${parentId}/sub-items/${subId}`, {
        method: 'DELETE',
      });
      setItems((prev) => prev.map((i) => (i._id === parentId ? { ...updatedParent, subItems: updatedParent.subItems || [] } : i)));
    } catch (e: any) {
      alert(e.message || 'Failed to delete sub-menu');
    }
  };

  const startEditSub = (parentId: string, s: SubItem) => {
    setEditingSub((prev) => ({ ...prev, [s._id]: { name: s.name, href: s.href, icon: s.icon, roles: (s.roles || []).join(', ') } }));
  };

  const cancelEditSub = (subId: string) => {
    setEditingSub((prev) => {
      const { [subId]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const saveEditSub = async (parentId: string, subId: string) => {
    const changes = editingSub[subId];
    if (!changes) return;
    if (!changes.name?.trim() || !changes.href?.trim()) return; // enforce href for sub
    try {
      const payload = { ...changes, roles: typeof changes.roles === 'string' ? (changes.roles as string).split(',').map((r) => r.trim()).filter(Boolean) : changes.roles };
      const updatedParent = await fetchJSON<NavItem>(`${BASE_URL}/sidebar/${parentId}/sub-items/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems((prev) => prev.map((i) => (i._id === parentId ? { ...updatedParent, subItems: updatedParent.subItems || [] } : i)));
      cancelEditSub(subId);
    } catch (e: any) {
      alert(e.message || 'Failed to save sub-menu');
    }
  };

  /* --------------------------- Reordering -------------------------- */

  const debouncers = useMemo(() => new Map<string, any>(), []);
  const debounce = (key: string, fn: () => void, wait = 400) => {
    const t = debouncers.get(key);
    if (t) clearTimeout(t);
    const nt = setTimeout(fn, wait);
    debouncers.set(key, nt);
  };

  const persistParentOrder = (list: NavItem[]) => {
    debounce(
      'parent-order',
      async () => {
        try {
          await fetchJSON(`${BASE_URL}/sidebar/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: list.map(({ _id, order }) => ({ _id, order })) }),
          });
        } catch (e) {
          console.error(e);
        }
      },
      500
    );
  };

  const persistSubOrder = (parent: NavItem) => {
    debounce(
      `sub-${parent._id}`,
      async () => {
        try {
          await fetchJSON(`${BASE_URL}/sidebar/${parent._id}/sub-items/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subItems: parent.subItems.map(({ _id, order }) => ({ _id, order })),
            }),
          });
        } catch (e) {
          console.error(e);
        }
      },
      500
    );
  };

  const onDragEnd = (result: DropResult, _provided: ResponderProvided) => {
    const { destination, source, type } = result;
    if (!destination) return;

    if (type === 'PARENT') {
      const reordered = Array.from(items);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const normalized = reordered.map((i, idx) => ({ ...i, order: idx }));
      setItems(normalized);
      persistParentOrder(normalized);
      return;
    }

    if (type.startsWith('SUB-')) {
      const parentId = type.slice(4);
      const parent = items.find((i) => i._id === parentId);
      if (!parent) return;

      const sub = Array.from(parent.subItems || []);
      const [moved] = sub.splice(source.index, 1);
      sub.splice(destination.index, 0, moved);
      const normalized = sub.map((s, idx) => ({ ...s, order: idx }));

      const next = items.map((i) => (i._id === parentId ? { ...i, subItems: normalized } : i));
      setItems(next);

      const newParent = next.find((i) => i._id === parentId)!;
      persistSubOrder(newParent);
      return;
    }
  };

  /* ------------------------------ UI ------------------------------ */

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-600">
        <FiLoader className="animate-spin" /> Loading sidebar…
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-8 text-red-700 flex items-center gap-2">
        <FiAlertCircle /> {err}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sidebar Configuration</h1>

      {/* Add Parent */}
      <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Add parent menu</h2>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
          <TextField
            placeholder="Name (required)"
            value={parentForm.name}
            onChange={(e) => setParentForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            placeholder="Href (optional)"
            value={parentForm.href}
            onChange={(e) => setParentForm((f) => ({ ...f, href: e.target.value }))}
          />
          <div className="flex items-center gap-2">
            <IconPreview name={parentForm.icon} />
            <TextField
              placeholder="Icon (FiHome, FiUsers...)"
              value={parentForm.icon}
              onChange={(e) => setParentForm((f) => ({ ...f, icon: e.target.value }))}
            />
          </div>
          <TextField
            placeholder="Roles (comma separated)"
            value={parentForm.roles}
            onChange={(e) => setParentForm((f) => ({ ...f, roles: e.target.value }))}
          />
          <button
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            onClick={addParent}
          >
            <div className="flex items-center gap-2">
              <FiPlus /> Add Parent
            </div>
          </button>
        </div>
      </div>

      {/* Drag Areas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="parents" type="PARENT">
          {(dropProvided) => (
            <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="space-y-4">
              {items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((item, idx) => (
                  <Draggable draggableId={item._id} index={idx} key={item._id}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="rounded-lg border bg-gray-50 shadow-sm"
                      >
                        {/* Parent header */}
                        <div className="flex items-start justify-between p-3">
                          {editingParent[item._id] ? (
                            <div className="flex-1 grid gap-2 grid-cols-1 md:grid-cols-4">
                              <TextField
                                placeholder="Name"
                                value={editingParent[item._id]?.name ?? ''}
                                onChange={(e) =>
                                  setEditingParent((prev) => ({
                                    ...prev,
                                    [item._id]: { ...prev[item._id], name: e.target.value },
                                  }))
                                }
                              />
                              <TextField
                                placeholder="Href (optional)"
                                value={editingParent[item._id]?.href ?? ''}
                                onChange={(e) =>
                                  setEditingParent((prev) => ({
                                    ...prev,
                                    [item._id]: { ...prev[item._id], href: e.target.value },
                                  }))
                                }
                              />
                              <div className="flex items-center gap-2">
                                <IconPreview name={editingParent[item._id]?.icon as string} />
                                <TextField
                                  placeholder="Icon"
                                  value={editingParent[item._id]?.icon ?? ''}
                                  onChange={(e) =>
                                    setEditingParent((prev) => ({
                                      ...prev,
                                      [item._id]: { ...prev[item._id], icon: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <TextField
                                placeholder="Roles"
                                value={editingParent[item._id]?.roles as string}
                                onChange={(e) =>
                                  setEditingParent((prev) => ({
                                    ...prev,
                                    [item._id]: { ...prev[item._id], roles: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <IconPreview name={item.icon} className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.href && <div className="text-xs text-gray-500">{item.href}</div>}
                                {item.roles?.length > 0 && (
                                  <div className="text-xs text-gray-400">Roles: {item.roles.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 ml-3">
                            {editingParent[item._id] ? (
                              <>
                                <SmallBtn variant="primary" onClick={() => saveEditParent(item._id)} title="Save">
                                  <FiSave />
                                </SmallBtn>
                                <SmallBtn onClick={() => cancelEditParent(item._id)} title="Cancel">
                                  <FiX />
                                </SmallBtn>
                              </>
                            ) : (
                              <>
                                <SmallBtn onClick={() => startEditParent(item)} title="Edit">
                                  <FiEdit2 />
                                </SmallBtn>
                                <SmallBtn variant="danger" onClick={() => deleteParent(item._id)} title="Delete">
                                  <FiTrash2 />
                                </SmallBtn>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Sub list */}
                        <div className="px-3 pb-3">
                          <Droppable droppableId={`sub-${item._id}`} type={`SUB-${item._id}`}>
                            {(subProvided) => (
                              <div
                                ref={subProvided.innerRef}
                                {...subProvided.droppableProps}
                                className="space-y-2"
                              >
                                {item.subItems
                                  ?.slice()
                                  .sort((a, b) => a.order - b.order)
                                  .map((sub, sIdx) => (
                                    <Draggable draggableId={sub._id} index={sIdx} key={sub._id}>
                                      {(subDrag) => (
                                        <div
                                          ref={subDrag.innerRef}
                                          {...subDrag.draggableProps}
                                          {...subDrag.dragHandleProps}
                                          className="bg-white border rounded px-3 py-2 flex items-start justify-between"
                                        >
                                          {editingSub[sub._id] ? (
                                            <div className="grid gap-2 grid-cols-1 md:grid-cols-4 flex-1">
                                              <TextField
                                                placeholder="Name"
                                                value={editingSub[sub._id]?.name ?? ''}
                                                onChange={(e) =>
                                                  setEditingSub((prev) => ({
                                                    ...prev,
                                                    [sub._id]: { ...prev[sub._id], name: e.target.value },
                                                  }))
                                                }
                                              />
                                              <TextField
                                                placeholder="Href"
                                                value={editingSub[sub._id]?.href ?? ''}
                                                onChange={(e) =>
                                                  setEditingSub((prev) => ({
                                                    ...prev,
                                                    [sub._id]: { ...prev[sub._id], href: e.target.value },
                                                  }))
                                                }
                                              />
                                              <div className="flex items-center gap-2">
                                                <IconPreview name={editingSub[sub._id]?.icon as string} />
                                                <TextField
                                                  placeholder="Icon"
                                                  value={editingSub[sub._id]?.icon ?? ''}
                                                  onChange={(e) =>
                                                    setEditingSub((prev) => ({
                                                      ...prev,
                                                      [sub._id]: { ...prev[sub._id], icon: e.target.value },
                                                    }))
                                                  }
                                                />
                                              </div>
                                              <TextField
                                                placeholder="Roles"
                                                value={editingSub[sub._id]?.roles as string}
                                                onChange={(e) =>
                                                  setEditingSub((prev) => ({
                                                    ...prev,
                                                    [sub._id]: { ...prev[sub._id], roles: e.target.value },
                                                  }))
                                                }
                                              />
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-3">
                                              <IconPreview name={sub.icon} className="w-4 h-4 text-gray-500" />
                                              <div>
                                                <div>{sub.name}</div>
                                                <div className="text-xs text-gray-500">{sub.href}</div>
                                                {sub.roles?.length > 0 && (
                                                  <div className="text-xs text-gray-400">Roles: {sub.roles.join(', ')}</div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex items-center gap-2 ml-3">
                                            {editingSub[sub._id] ? (
                                              <>
                                                <SmallBtn
                                                  variant="primary"
                                                  onClick={() => saveEditSub(item._id, sub._id)}
                                                  title="Save"
                                                >
                                                  <FiSave />
                                                </SmallBtn>
                                                <SmallBtn onClick={() => cancelEditSub(sub._id)} title="Cancel">
                                                  <FiX />
                                                </SmallBtn>
                                              </>
                                            ) : (
                                              <>
                                                <SmallBtn onClick={() => startEditSub(item._id, sub)} title="Edit">
                                                  <FiEdit2 />
                                                </SmallBtn>
                                                <SmallBtn
                                                  variant="danger"
                                                  onClick={() => deleteSub(item._id, sub._id)}
                                                  title="Delete"
                                                >
                                                  <FiTrash2 />
                                                </SmallBtn>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                {subProvided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {/* Add sub row */}
                          <div className="mt-3 bg-white border rounded p-3">
                            <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
                              <TextField
                                placeholder="Sub name"
                                value={subForms[item._id]?.name ?? ''}
                                onChange={(e) =>
                                  setSubForms((prev) => ({
                                    ...prev,
                                    [item._id]: { ...(prev[item._id] || { icon: 'FiCircle', roles: '' }), name: e.target.value },
                                  }))
                                }
                              />
                              <TextField
                                placeholder="Sub href (required)"
                                value={subForms[item._id]?.href ?? ''}
                                onChange={(e) =>
                                  setSubForms((prev) => ({
                                    ...prev,
                                    [item._id]: { ...(prev[item._id] || { icon: 'FiCircle', roles: '' }), href: e.target.value },
                                  }))}
                              />
                              <div className="flex items-center gap-2">
                                <IconPreview name={subForms[item._id]?.icon || 'FiCircle'} />
                                <TextField
                                  placeholder="Icon (FiCircle...)"
                                  value={subForms[item._id]?.icon ?? 'FiCircle'}
                                  onChange={(e) =>
                                    setSubForms((prev) => ({
                                      ...prev,
                                      [item._id]: { ...(prev[item._id] || {}), icon: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <TextField
                                placeholder="Roles (comma separated)"
                                value={subForms[item._id]?.roles ?? ''}
                                onChange={(e) =>
                                  setSubForms((prev) => ({
                                    ...prev,
                                    [item._id]: { ...(prev[item._id] || {}), roles: e.target.value },
                                  }))
                                }
                              />
                              <button
                                className="bg-emerald-600 text-white rounded px-4 py-2 hover:bg-emerald-700"
                                onClick={() => addSub(item._id)}
                              >
                                <div className="flex items-center gap-2">
                                  <FiPlus /> Add Sub-menu
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
