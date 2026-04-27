"use client";

import { deleteProductAction } from "@/app/admin/actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Delete this product? This cannot be undone.")) e.preventDefault();
  };

  return (
    <form action={deleteProductAction} onSubmit={handleSubmit}>
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-md transition-colors"
      >
        Delete Product
      </button>
    </form>
  );
}
