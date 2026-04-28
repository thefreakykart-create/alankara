"use client";

import { useState, useTransition } from "react";
import { toggleProductFieldAction } from "@/app/admin/actions";

interface Props {
  productId: string;
  initialActive: boolean;
  initialFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductStatusToggle({
  productId,
  initialActive,
  initialFeatured,
  createdAt,
  updatedAt,
}: Props) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [, startTransition] = useTransition();

  const toggleActive = () => {
    const next = !isActive;
    setIsActive(next);
    startTransition(async () => {
      await toggleProductFieldAction(productId, "is_active", next);
    });
  };

  const toggleFeatured = () => {
    const next = !isFeatured;
    setIsFeatured(next);
    startTransition(async () => {
      await toggleProductFieldAction(productId, "is_featured", next);
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">Status</h2>

      <div className="space-y-4">
        {/* Active / Draft */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900">
              {isActive ? "Active" : "Draft"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isActive ? "Visible on storefront" : "Hidden from customers"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleActive}
            aria-label="Toggle active"
            className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
              isActive ? "bg-indigo-600" : "bg-zinc-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Featured */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-100">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900">Featured</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isFeatured ? "Shown on homepage" : "Not on homepage"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFeatured}
            aria-label="Toggle featured"
            className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${
              isFeatured ? "bg-amber-400" : "bg-zinc-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isFeatured ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dates */}
      <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs">
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Created</span>
          <span className="font-medium text-zinc-800">
            {new Date(createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Last updated</span>
          <span className="font-medium text-zinc-800">
            {new Date(updatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
