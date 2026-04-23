import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { updateSettingsAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Settings — Alankara Admin" };

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

interface StoreSettings {
  name?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

interface AnnouncementSettings {
  text?: string;
  link?: string;
  is_active?: boolean;
  bg_color?: string;
  text_color?: string;
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["store", "announcement"]);

  const storeRow = rows?.find((r) => r.key === "store");
  const announcementRow = rows?.find((r) => r.key === "announcement");
  const store = (storeRow?.value ?? {}) as StoreSettings;
  const announcement = (announcementRow?.value ?? {}) as AnnouncementSettings;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Store info, contact details, social links, and announcement banner.
        </p>
      </div>

      <form action={updateSettingsAction} className="space-y-6">
        {/* Store info */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Store Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Store Name</label>
              <input name="storeName" defaultValue={store.name ?? "Alankara"} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input name="tagline" defaultValue={store.tagline ?? ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Email</label>
              <input name="email" type="email" defaultValue={store.email ?? ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input name="phone" defaultValue={store.phone ?? ""} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Address</label>
              <input name="address" defaultValue={store.address ?? ""} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Social Links</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Instagram URL</label>
              <input name="instagram" defaultValue={store.instagram ?? ""} placeholder="https://instagram.com/…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Facebook URL</label>
              <input name="facebook" defaultValue={store.facebook ?? ""} placeholder="https://facebook.com/…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Twitter / X URL</label>
              <input name="twitter" defaultValue={store.twitter ?? ""} placeholder="https://x.com/…" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Announcement banner */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Announcement Banner</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelCls}>Banner Text</label>
              <input
                name="announcementText"
                defaultValue={announcement.text ?? ""}
                placeholder="Free shipping on orders above ₹999"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Link URL (optional)</label>
              <input
                name="announcementLink"
                defaultValue={announcement.link ?? ""}
                placeholder="/products"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="announcementBg"
                  defaultValue={announcement.bg_color ?? "#1a1a1a"}
                  className="h-10 w-14 rounded-md border border-zinc-200 cursor-pointer p-1"
                />
                <input
                  name="announcementBg"
                  defaultValue={announcement.bg_color ?? "#1a1a1a"}
                  placeholder="#1a1a1a"
                  className="flex-1 h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Text Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="announcementTextColor"
                  defaultValue={announcement.text_color ?? "#ffffff"}
                  className="h-10 w-14 rounded-md border border-zinc-200 cursor-pointer p-1"
                />
                <input
                  name="announcementTextColor"
                  defaultValue={announcement.text_color ?? "#ffffff"}
                  placeholder="#ffffff"
                  className="flex-1 h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  name="announcementActive"
                  type="checkbox"
                  defaultChecked={announcement.is_active ?? false}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-zinc-700">Show banner on storefront</span>
              </label>
            </div>
          </div>

          {announcement.text && (
            <div
              className="mt-4 px-4 py-2.5 text-sm text-center rounded-md"
              style={{
                backgroundColor: announcement.bg_color ?? "#1a1a1a",
                color: announcement.text_color ?? "#ffffff",
              }}
            >
              {announcement.text}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
