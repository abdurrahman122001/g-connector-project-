// app/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  ResponderProvided,
} from "@hello-pangea/dnd";
import * as Fi from "react-icons/fi";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import Select from "react-select";

/* ---------------- Constants ---------------- */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

/* ---------------- Types ---------------- */
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
  href?: string;
  icon: string;
  order: number;
  subItems: SubItem[];
  roles: string[];
}

interface MenuItem {
  referenceName: string;
  displayName: string;
  accessGroups: string[];
}

interface SystemSetting {
  _id?: string;
  systemName: string;
  welcomeNoteFront: string;
  welcomeNoteBack: string;
  menuItems: MenuItem[];
}

/* ---------------- Utilities ---------------- */
const fetchJSON = async <T,>(input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
};

const IconPreview = ({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) => {
  const Comp = (Fi as any)[name] ?? (Fi as any).FiCircle;
  return <Comp className={className} />;
};

const TextField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`border rounded px-3 py-2 outline-none focus:ring focus:ring-blue-200 ${
      props.className ?? ""
    }`}
  />
);

const SmallBtn = ({
  children,
  onClick,
  variant = "ghost",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "danger" | "primary";
  title?: string;
}) => {
  const base =
    "inline-flex items-center justify-center rounded px-2 py-1 text-sm";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : variant === "danger"
      ? "text-red-600 hover:text-red-700"
      : "text-gray-600 hover:text-gray-800";
  return (
    <button
      className={`${base} ${styles}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
};

/* ---------------- Main Page ---------------- */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"sidebar" | "system">("sidebar");

  /* -------- Sidebar Config State -------- */
  const [items, setItems] = useState<NavItem[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [parentForm, setParentForm] = useState({
    name: "",
    href: "",
    icon: "FiHome",
    roles: [] as string[],
  });
  const [subForms, setSubForms] = useState<
    Record<string, { name: string; href: string; icon: string; roles: string[] }>
  >({});
  const [editingParent, setEditingParent] = useState<
    Record<string, Partial<NavItem>>
  >({});
  const [editingSub, setEditingSub] = useState<
    Record<string, Partial<SubItem>>
  >({});

  /* -------- System Settings State -------- */
  const [loadingSys, setLoadingSys] = useState(true);
  const [savingSys, setSavingSys] = useState(false);
  const [setting, setSetting] = useState<SystemSetting>({
    systemName: "",
    welcomeNoteFront: "",
    welcomeNoteBack: "",
    menuItems: [],
  });

  /* -------- Fetch Sidebar -------- */
  useEffect(() => {
    (async () => {
      try {
        setLoadingSidebar(true);
        const data = await fetchJSON<NavItem[]>(`${BASE_URL}/sidebar`);
        setItems(
          data.map((i) => ({ ...i, subItems: i.subItems || [], roles: i.roles || [] }))
        );
      } catch (e: any) {
        setErr(e.message ?? "Failed to load");
      } finally {
        setLoadingSidebar(false);
      }
    })();
  }, []);

  /* -------- Fetch System Settings -------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/settings`);
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setSetting(json[0]);
        }
      } catch (err) {
        toast.error("Failed to load system settings");
      } finally {
        setLoadingSys(false);
      }
    })();
  }, []);

  const handleSysChange = (field: keyof SystemSetting, value: any) => {
    setSetting((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSys = async () => {
    try {
      setSavingSys(true);
      const method = setting._id ? "PUT" : "POST";
      const url = setting._id
        ? `${BASE_URL}/settings/${setting._id}`
        : `${BASE_URL}/settings`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Error saving settings");
    } finally {
      setSavingSys(false);
    }
  };

  /* ---------------- Drag Handlers ---------------- */
  const debouncers = useMemo(() => new Map<string, any>(), []);
  const debounce = (key: string, fn: () => void, wait = 400) => {
    const t = debouncers.get(key);
    if (t) clearTimeout(t);
    const nt = setTimeout(fn, wait);
    debouncers.set(key, nt);
  };

  const persistParentOrder = (list: NavItem[]) => {
    debounce(
      "parent-order",
      async () => {
        try {
          await fetchJSON(`${BASE_URL}/sidebar/reorder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: list.map(({ _id, order }) => ({ _id, order })),
            }),
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
            method: "PUT",
            headers: { "Content-Type": "application/json" },
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

    if (type === "PARENT") {
      const reordered = Array.from(items);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const normalized = reordered.map((i, idx) => ({ ...i, order: idx }));
      setItems(normalized);
      persistParentOrder(normalized);
      return;
    }

    if (type.startsWith("SUB-")) {
      const parentId = type.slice(4);
      const parent = items.find((i) => i._id === parentId);
      if (!parent) return;

      const sub = Array.from(parent.subItems || []);
      const [moved] = sub.splice(source.index, 1);
      sub.splice(destination.index, 0, moved);
      const normalized = sub.map((s, idx) => ({ ...s, order: idx }));

      const next = items.map((i) =>
        i._id === parentId ? { ...i, subItems: normalized } : i
      );
      setItems(next);

      const newParent = next.find((i) => i._id === parentId)!;
      persistSubOrder(newParent);
      return;
    }
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("sidebar")}
          className={`px-4 py-2 font-medium ${
            activeTab === "sidebar"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Sidebar Configuration
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 font-medium ${
            activeTab === "system"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          System Settings
        </button>
      </div>

      {/* Sidebar Config Tab */}
      {activeTab === "sidebar" && (
        <div>
          {loadingSidebar ? (
            <div className="p-8 flex items-center gap-2 text-gray-600">
              <FiLoader className="animate-spin" /> Loading sidebar…
            </div>
          ) : err ? (
            <div className="p-8 text-red-700 flex items-center gap-2">
              <FiAlertCircle /> {err}
            </div>
          ) : (
            <div>
              {/* Add Parent */}
              <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="font-semibold mb-3">Add parent menu</h2>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-5 items-center">
                  <TextField
                    placeholder="Name (required)"
                    value={parentForm.name}
                    onChange={(e) =>
                      setParentForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <TextField
                    placeholder="Href (optional)"
                    value={parentForm.href}
                    onChange={(e) =>
                      setParentForm((f) => ({ ...f, href: e.target.value }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <IconPreview name={parentForm.icon} />
                    <TextField
                      placeholder="Icon (FiHome, FiUsers...)"
                      value={parentForm.icon}
                      onChange={(e) =>
                        setParentForm((f) => ({ ...f, icon: e.target.value }))
                      }
                    />
                  </div>
                  <div className="w-full">
                    <Select
                      isMulti
                      options={ROLE_OPTIONS}
                      value={ROLE_OPTIONS.filter((r) =>
                        parentForm.roles.includes(r.value)
                      )}
                      onChange={(vals) =>
                        setParentForm((f) => ({
                          ...f,
                          roles: vals.map((v) => v.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <button
                    className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                    onClick={() => {
                      if (!parentForm.name.trim()) return;
                      fetchJSON<NavItem>(`${BASE_URL}/sidebar`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(parentForm),
                      })
                        .then((created) => {
                          setItems((prev) => [
                            ...prev,
                            { ...created, subItems: created.subItems || [] },
                          ]);
                          setParentForm({
                            name: "",
                            href: "",
                            icon: "FiHome",
                            roles: [],
                          });
                        })
                        .catch((e) => alert(e.message));
                    }}
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
                    <div
                      ref={dropProvided.innerRef}
                      {...dropProvided.droppableProps}
                      className="space-y-4"
                    >
                      {items
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((item, idx) => (
                          <Draggable
                            draggableId={item._id}
                            index={idx}
                            key={item._id}
                          >
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
                                        value={editingParent[item._id]?.name ?? ""}
                                        onChange={(e) =>
                                          setEditingParent((prev) => ({
                                            ...prev,
                                            [item._id]: {
                                              ...prev[item._id],
                                              name: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                      <TextField
                                        placeholder="Href (optional)"
                                        value={editingParent[item._id]?.href ?? ""}
                                        onChange={(e) =>
                                          setEditingParent((prev) => ({
                                            ...prev,
                                            [item._id]: {
                                              ...prev[item._id],
                                              href: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                      <div className="flex items-center gap-2">
                                        <IconPreview
                                          name={editingParent[item._id]?.icon as string}
                                        />
                                        <TextField
                                          placeholder="Icon"
                                          value={editingParent[item._id]?.icon ?? ""}
                                          onChange={(e) =>
                                            setEditingParent((prev) => ({
                                              ...prev,
                                              [item._id]: {
                                                ...prev[item._id],
                                                icon: e.target.value,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                      <Select
                                        isMulti
                                        options={ROLE_OPTIONS}
                                        value={ROLE_OPTIONS.filter((r) =>
                                          (editingParent[item._id]?.roles as string[])?.includes(
                                            r.value
                                          )
                                        )}
                                        onChange={(vals) =>
                                          setEditingParent((prev) => ({
                                            ...prev,
                                            [item._id]: {
                                              ...prev[item._id],
                                              roles: vals.map((v) => v.value),
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <IconPreview
                                        name={item.icon}
                                        className="w-5 h-5 text-gray-500"
                                      />
                                      <div>
                                        <div className="font-medium">{item.name}</div>
                                        {item.href && (
                                          <div className="text-xs text-gray-500">
                                            {item.href}
                                          </div>
                                        )}
                                        {item.roles?.length > 0 && (
                                          <div className="text-xs text-gray-400">
                                            Roles: {item.roles.join(", ")}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 ml-3">
                                    {editingParent[item._id] ? (
                                      <>
                                        <SmallBtn
                                          variant="primary"
                                          onClick={() => {
                                            const changes = editingParent[item._id];
                                            fetchJSON<NavItem>(
                                              `${BASE_URL}/sidebar/${item._id}`,
                                              {
                                                method: "PUT",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify(changes),
                                              }
                                            )
                                              .then((updated) => {
                                                setItems((prev) =>
                                                  prev.map((i) =>
                                                    i._id === item._id
                                                      ? {
                                                          ...updated,
                                                          subItems:
                                                            updated.subItems || [],
                                                        }
                                                      : i
                                                  )
                                                );
                                                setEditingParent((prev) => {
                                                  const { [item._id]: _, ...rest } =
                                                    prev;
                                                  return rest;
                                                });
                                              })
                                              .catch((e) => alert(e.message));
                                          }}
                                          title="Save"
                                        >
                                          <FiSave />
                                        </SmallBtn>
                                        <SmallBtn
                                          onClick={() =>
                                            setEditingParent((prev) => {
                                              const { [item._id]: _, ...rest } =
                                                prev;
                                              return rest;
                                            })
                                          }
                                          title="Cancel"
                                        >
                                          <FiX />
                                        </SmallBtn>
                                      </>
                                    ) : (
                                      <>
                                        <SmallBtn
                                          onClick={() =>
                                            setEditingParent((prev) => ({
                                              ...prev,
                                              [item._id]: {
                                                ...item,
                                                roles: [...(item.roles || [])],
                                              },
                                            }))
                                          }
                                          title="Edit"
                                        >
                                          <FiEdit2 />
                                        </SmallBtn>
                                        <SmallBtn
                                          variant="danger"
                                          onClick={() => {
                                            if (!confirm("Delete this parent?"))
                                              return;
                                            fetchJSON(
                                              `${BASE_URL}/sidebar/${item._id}`,
                                              { method: "DELETE" }
                                            )
                                              .then(() =>
                                                setItems((prev) =>
                                                  prev.filter((i) => i._id !== item._id)
                                                )
                                              )
                                              .catch((e) => alert(e.message));
                                          }}
                                          title="Delete"
                                        >
                                          <FiTrash2 />
                                        </SmallBtn>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Sub-items */}
                                <Droppable
                                  droppableId={`sub-${item._id}`}
                                  type={`SUB-${item._id}`}
                                >
                                  {(subProvided) => (
                                    <div
                                      ref={subProvided.innerRef}
                                      {...subProvided.droppableProps}
                                    >
                                      {item.subItems
                                        .slice()
                                        .sort((a, b) => a.order - b.order)
                                        .map((s, sidx) => (
                                          <Draggable
                                            draggableId={s._id}
                                            index={sidx}
                                            key={s._id}
                                          >
                                            {(sdrag) => (
                                              <div
                                                ref={sdrag.innerRef}
                                                {...sdrag.draggableProps}
                                                {...sdrag.dragHandleProps}
                                                className="ml-8 border-t bg-white p-2 flex items-start justify-between"
                                              >
                                                {editingSub[s._id] ? (
                                                  <div className="flex-1 grid gap-2 grid-cols-1 md:grid-cols-4">
                                                    <TextField
                                                      placeholder="Name"
                                                      value={
                                                        editingSub[s._id]?.name ?? ""
                                                      }
                                                      onChange={(e) =>
                                                        setEditingSub((prev) => ({
                                                          ...prev,
                                                          [s._id]: {
                                                            ...prev[s._id],
                                                            name: e.target.value,
                                                          },
                                                        }))
                                                      }
                                                    />
                                                    <TextField
                                                      placeholder="Href"
                                                      value={
                                                        editingSub[s._id]?.href ?? ""
                                                      }
                                                      onChange={(e) =>
                                                        setEditingSub((prev) => ({
                                                          ...prev,
                                                          [s._id]: {
                                                            ...prev[s._id],
                                                            href: e.target.value,
                                                          },
                                                        }))
                                                      }
                                                    />
                                                    <div className="flex items-center gap-2">
                                                      <IconPreview
                                                        name={
                                                          editingSub[s._id]
                                                            ?.icon as string
                                                        }
                                                      />
                                                      <TextField
                                                        placeholder="Icon"
                                                        value={
                                                          editingSub[s._id]?.icon ??
                                                          ""
                                                        }
                                                        onChange={(e) =>
                                                          setEditingSub((prev) => ({
                                                            ...prev,
                                                            [s._id]: {
                                                              ...prev[s._id],
                                                              icon: e.target.value,
                                                            },
                                                          }))
                                                        }
                                                      />
                                                    </div>
                                                    <Select
                                                      isMulti
                                                      options={ROLE_OPTIONS}
                                                      value={ROLE_OPTIONS.filter((r) =>
                                                        (
                                                          editingSub[s._id]
                                                            ?.roles as string[]
                                                        )?.includes(r.value)
                                                      )}
                                                      onChange={(vals) =>
                                                        setEditingSub((prev) => ({
                                                          ...prev,
                                                          [s._id]: {
                                                            ...prev[s._id],
                                                            roles: vals.map(
                                                              (v) => v.value
                                                            ),
                                                          },
                                                        }))
                                                      }
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center gap-3">
                                                    <IconPreview
                                                      name={s.icon}
                                                      className="w-4 h-4 text-gray-400"
                                                    />
                                                    <div>
                                                      <div className="text-sm">
                                                        {s.name}
                                                      </div>
                                                      <div className="text-xs text-gray-500">
                                                        {s.href}
                                                      </div>
                                                      {s.roles?.length > 0 && (
                                                        <div className="text-xs text-gray-400">
                                                          Roles: {s.roles.join(", ")}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                <div className="flex items-center gap-2 ml-3">
                                                  {editingSub[s._id] ? (
                                                    <>
                                                      <SmallBtn
                                                        variant="primary"
                                                        onClick={() => {
                                                          const changes =
                                                            editingSub[s._id];
                                                          fetchJSON<NavItem>(
                                                            `${BASE_URL}/sidebar/${item._id}/sub-items/${s._id}`,
                                                            {
                                                              method: "PUT",
                                                              headers: {
                                                                "Content-Type":
                                                                  "application/json",
                                                              },
                                                              body: JSON.stringify(
                                                                changes
                                                              ),
                                                            }
                                                          )
                                                            .then((updatedParent) => {
                                                              setItems((prev) =>
                                                                prev.map((i) =>
                                                                  i._id === item._id
                                                                    ? {
                                                                        ...updatedParent,
                                                                        subItems:
                                                                          updatedParent.subItems ||
                                                                          [],
                                                                      }
                                                                    : i
                                                                )
                                                              );
                                                              setEditingSub((prev) => {
                                                                const {
                                                                  [s._id]: _,
                                                                  ...rest
                                                                } = prev;
                                                                return rest;
                                                              });
                                                            })
                                                            .catch((e) =>
                                                              alert(e.message)
                                                            );
                                                        }}
                                                        title="Save"
                                                      >
                                                        <FiSave />
                                                      </SmallBtn>
                                                      <SmallBtn
                                                        onClick={() =>
                                                          setEditingSub((prev) => {
                                                            const { [s._id]: _, ...rest } =
                                                              prev;
                                                            return rest;
                                                          })
                                                        }
                                                        title="Cancel"
                                                      >
                                                        <FiX />
                                                      </SmallBtn>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <SmallBtn
                                                        onClick={() =>
                                                          setEditingSub((prev) => ({
                                                            ...prev,
                                                            [s._id]: {
                                                              ...s,
                                                              roles: [...s.roles],
                                                            },
                                                          }))
                                                        }
                                                        title="Edit"
                                                      >
                                                        <FiEdit2 />
                                                      </SmallBtn>
                                                      <SmallBtn
                                                        variant="danger"
                                                        onClick={() => {
                                                          if (
                                                            !confirm(
                                                              "Delete this sub-menu?"
                                                            )
                                                          )
                                                            return;
                                                          fetchJSON<NavItem>(
                                                            `${BASE_URL}/sidebar/${item._id}/sub-items/${s._id}`,
                                                            { method: "DELETE" }
                                                          )
                                                            .then(
                                                              (updatedParent) => {
                                                                setItems((prev) =>
                                                                  prev.map((i) =>
                                                                    i._id === item._id
                                                                      ? {
                                                                          ...updatedParent,
                                                                          subItems:
                                                                            updatedParent.subItems ||
                                                                            [],
                                                                        }
                                                                      : i
                                                                  )
                                                                );
                                                              }
                                                            )
                                                            .catch((e) =>
                                                              alert(e.message)
                                                            );
                                                        }}
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

                                      {/* Add Sub */}
                                      <div className="ml-8 border-t bg-gray-50 p-2">
                                        <div className="grid gap-2 grid-cols-1 md:grid-cols-4 items-center">
                                          <TextField
                                            placeholder="Sub name"
                                            value={subForms[item._id]?.name ?? ""}
                                            onChange={(e) =>
                                              setSubForms((prev) => ({
                                                ...prev,
                                                [item._id]: {
                                                  ...(prev[item._id] || {
                                                    href: "",
                                                    icon: "FiCircle",
                                                    roles: [],
                                                  }),
                                                  name: e.target.value,
                                                },
                                              }))
                                            }
                                          />
                                          <TextField
                                            placeholder="Href"
                                            value={subForms[item._id]?.href ?? ""}
                                            onChange={(e) =>
                                              setSubForms((prev) => ({
                                                ...prev,
                                                [item._id]: {
                                                  ...(prev[item._id] || {
                                                    name: "",
                                                    icon: "FiCircle",
                                                    roles: [],
                                                  }),
                                                  href: e.target.value,
                                                },
                                              }))
                                            }
                                          />
                                          <div className="flex items-center gap-2">
                                            <IconPreview
                                              name={subForms[item._id]?.icon ?? "FiCircle"}
                                            />
                                            <TextField
                                              placeholder="Icon"
                                              value={subForms[item._id]?.icon ?? ""}
                                              onChange={(e) =>
                                                setSubForms((prev) => ({
                                                  ...prev,
                                                  [item._id]: {
                                                    ...(prev[item._id] || {
                                                      name: "",
                                                      href: "",
                                                      roles: [],
                                                    }),
                                                    icon: e.target.value,
                                                  },
                                                }))
                                              }
                                            />
                                          </div>
                                          <Select
                                            isMulti
                                            options={ROLE_OPTIONS}
                                            value={ROLE_OPTIONS.filter((r) =>
                                              subForms[item._id]?.roles?.includes(r.value)
                                            )}
                                            onChange={(vals) =>
                                              setSubForms((prev) => ({
                                                ...prev,
                                                [item._id]: {
                                                  ...(prev[item._id] || {
                                                    name: "",
                                                    href: "",
                                                    icon: "FiCircle",
                                                  }),
                                                  roles: vals.map((v) => v.value),
                                                },
                                              }))
                                            }
                                          />
                                        </div>
                                        <div className="mt-2">
                                          <button
                                            className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
                                            onClick={() => {
                                              const form = subForms[item._id];
                                              if (!form?.name?.trim()) return;
                                              fetchJSON<NavItem>(
                                                `${BASE_URL}/sidebar/${item._id}/sub-items`,
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type": "application/json",
                                                  },
                                                  body: JSON.stringify(form),
                                                }
                                              )
                                                .then((updatedParent) => {
                                                  setItems((prev) =>
                                                    prev.map((i) =>
                                                      i._id === item._id
                                                        ? {
                                                            ...updatedParent,
                                                            subItems:
                                                              updatedParent.subItems ||
                                                              [],
                                                          }
                                                        : i
                                                    )
                                                  );
                                                  setSubForms((prev) => ({
                                                    ...prev,
                                                    [item._id]: {
                                                      name: "",
                                                      href: "",
                                                      icon: "FiCircle",
                                                      roles: [],
                                                    },
                                                  }));
                                                })
                                                .catch((e) => alert(e.message));
                                            }}
                                          >
                                            Add Sub-menu
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Droppable>
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
          )}
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "system" && (
        <div>
          {loadingSys ? (
            <div className="p-6 text-gray-500">Loading settings...</div>
          ) : (
            <div className="bg-white p-6 rounded shadow space-y-6">
              {/* System Name */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  System Name
                </label>
                <input
                  type="text"
                  value={setting.systemName}
                  onChange={(e) => handleSysChange("systemName", e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              {/* Welcome Notes */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Welcome Note (Front-end)
                </label>
                <textarea
                  value={setting.welcomeNoteFront}
                  onChange={(e) =>
                    handleSysChange("welcomeNoteFront", e.target.value)
                  }
                  className="border px-3 py-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Welcome Note (Back-end)
                </label>
                <textarea
                  value={setting.welcomeNoteBack}
                  onChange={(e) =>
                    handleSysChange("welcomeNoteBack", e.target.value)
                  }
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSys}
                disabled={savingSys}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {savingSys ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
