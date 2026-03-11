"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminPropertyCreateInput, AdminPropertyListItem } from "@/lib/types";

type PropertyFormProps = {
  initial?: Partial<AdminPropertyListItem>;
  mode: "create" | "edit";
  onSubmit: (data: AdminPropertyCreateInput | Record<string, unknown>) => Promise<void>;
  cancelHref?: string;
};

const defaultValues: AdminPropertyCreateInput = {
  display_name: "",
  address_line1: "",
  address_line2: null,
  city: "",
  province: "",
  postal_code: "",
  management_company: null,
  status: "active",
};

export function PropertyForm({
  initial,
  mode,
  onSubmit,
  cancelHref = "/admin/properties",
}: PropertyFormProps) {
  const [display_name, setDisplayName] = useState(initial?.display_name ?? defaultValues.display_name);
  const [address_line1, setAddressLine1] = useState(initial?.address_line1 ?? defaultValues.address_line1);
  const [address_line2, setAddressLine2] = useState(initial?.address_line2 ?? defaultValues.address_line2 ?? "");
  const [city, setCity] = useState(initial?.city ?? defaultValues.city);
  const [province, setProvince] = useState(initial?.province ?? defaultValues.province);
  const [postal_code, setPostalCode] = useState(initial?.postal_code ?? defaultValues.postal_code);
  const [management_company, setManagementCompany] = useState(
    initial?.management_company ?? defaultValues.management_company ?? ""
  );
  const [status, setStatus] = useState<"active" | "inactive">(
    (initial?.status as "active" | "inactive") ?? defaultValues.status!
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        await onSubmit({
          display_name: display_name.trim(),
          address_line1: address_line1.trim(),
          address_line2: address_line2.trim() || null,
          city: city.trim(),
          province: province.trim(),
          postal_code: postal_code.trim(),
          management_company: management_company.trim() || null,
          status,
        });
      } else {
        await onSubmit({
          display_name: display_name.trim(),
          address_line1: address_line1.trim(),
          address_line2: address_line2.trim() || null,
          city: city.trim(),
          province: province.trim(),
          postal_code: postal_code.trim(),
          management_company: management_company.trim() || null,
          status,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-foreground">
          Display name *
        </label>
        <input
          id="display_name"
          type="text"
          required
          value={display_name}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="address_line1" className="block text-sm font-medium text-foreground">
          Address line 1 *
        </label>
        <input
          id="address_line1"
          type="text"
          required
          value={address_line1}
          onChange={(e) => setAddressLine1(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="address_line2" className="block text-sm font-medium text-foreground">
          Address line 2
        </label>
        <input
          id="address_line2"
          type="text"
          value={address_line2}
          onChange={(e) => setAddressLine2(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground">
            City *
          </label>
          <input
            id="city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-foreground">
            Province *
          </label>
          <input
            id="province"
            type="text"
            required
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="postal_code" className="block text-sm font-medium text-foreground">
          Postal code *
        </label>
        <input
          id="postal_code"
          type="text"
          required
          value={postal_code}
          onChange={(e) => setPostalCode(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="management_company" className="block text-sm font-medium text-foreground">
          Management company
        </label>
        <input
          id="management_company"
          type="text"
          value={management_company}
          onChange={(e) => setManagementCompany(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-foreground">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create property" : "Save changes"}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
