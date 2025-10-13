"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  menuDisplayOrder: string[];
  menuItems: MenuItem[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState<SystemSetting>({
    systemName: "",
    welcomeNoteFront: "",
    welcomeNoteBack: "",
    menuDisplayOrder: ["data_analysis", "data_capture", "data_transfer", "data_storage"],
    menuItems: [],
  });

  // ✅ Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`);
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setSetting(json[0]);
        }
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ✅ Handle field changes
  const handleChange = (field: keyof SystemSetting, value: any) => {
    setSetting((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const method = setting._id ? "PUT" : "POST";
      const url = setting._id
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/settings/${setting._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/settings`;

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
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading settings...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="bg-white p-6 rounded shadow space-y-6">
        {/* System Name */}
        <div>
          <label className="block text-sm font-semibold mb-1">System Name</label>
          <input
            type="text"
            value={setting.systemName}
            onChange={(e) => handleChange("systemName", e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Welcome Notes */}
        <div>
          <label className="block text-sm font-semibold mb-1">Welcome Note (Front-end)</label>
          <textarea
            value={setting.welcomeNoteFront}
            onChange={(e) => handleChange("welcomeNoteFront", e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Welcome Note (Back-end)</label>
          <textarea
            value={setting.welcomeNoteBack}
            onChange={(e) => handleChange("welcomeNoteBack", e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Menu Order */}
        <div>
          <label className="block text-sm font-semibold mb-1">Menu Display Order</label>
          <input
            type="text"
            value={setting.menuDisplayOrder.join(", ")}
            onChange={(e) => handleChange("menuDisplayOrder", e.target.value.split(","))}
            className="border px-3 py-2 rounded w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated (e.g. data_analysis, data_capture)</p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
