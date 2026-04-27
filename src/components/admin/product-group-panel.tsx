"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createProductGroupAction,
  joinProductGroupAction,
  removeFromGroupAction,
} from "@/app/admin/actions";
import type { GroupProduct, ProductGroup } from "@/lib/types/product";
import { FRAME_TYPE_LABELS } from "@/lib/types/product";

interface Props {
  productId: string;
  currentGroupId: string | null;
  currentGroupName: string | null;
  groupMembers: GroupProduct[];
  allGroups: ProductGroup[];
}

export default function ProductGroupPanel({
  productId,
  currentGroupId,
  currentGroupName,
  groupMembers,
  allGroups,
}: Props) {
  const [tab, setTab] = useState<"create" | "join">("create");
  const otherGroups = allGroups.filter((g) => g.id !== currentGroupId);

  if (currentGroupId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{currentGroupName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{groupMembers.length} product{groupMembers.length !== 1 ? "s" : ""} in this group</p>
          </div>
          <form action={removeFromGroupAction}>
            <input type="hidden" name="productId" value={productId} />
            <button
              type="submit"
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
              onClick={(e) => { if (!confirm("Remove this product from the group?")) e.preventDefault(); }}
            >
              Leave Group
            </button>
          </form>
        </div>

        <div className="space-y-1.5">
          {groupMembers.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <div>
                <p className="text-sm text-zinc-900">{p.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {p.frame_type ? FRAME_TYPE_LABELS[p.frame_type] : "No frame type set"}
                </p>
              </div>
              <Link
                href={`/admin/products/${p.id}`}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          On the storefront, customers can switch between frame types within this group from a single product page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Link this product with other frame types (canvas / acrylic / wooden) so they appear together on the storefront.
      </p>

      <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === "create" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Create New Group
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === "join" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Join Existing Group
        </button>
      </div>

      {tab === "create" && (
        <form action={createProductGroupAction} className="flex gap-2">
          <input type="hidden" name="productId" value={productId} />
          <input
            name="groupName"
            placeholder="e.g. Lord Ganesh"
            required
            className="flex-1 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
          >
            Create &amp; Link
          </button>
        </form>
      )}

      {tab === "join" && (
        otherGroups.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No existing groups found. Create a new one above.</p>
        ) : (
          <form action={joinProductGroupAction} className="flex gap-2">
            <input type="hidden" name="productId" value={productId} />
            <select
              name="groupId"
              required
              className="flex-1 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select group…</option>
              {otherGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Join
            </button>
          </form>
        )
      )}
    </div>
  );
}
