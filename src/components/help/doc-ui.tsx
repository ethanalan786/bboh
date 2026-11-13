"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

// ─────────────────────────────────────────────
// Shared building blocks for the in-app help guides.
// "Screenshots" are rendered as live wireframe mockups of the real UI
// so the highlighted button always matches the actual app. Pass `src`
// to a Figure to use a real screenshot from /public instead.
// ─────────────────────────────────────────────

const PANEL =
  "rounded-xl border border-neutral-200 bg-white dark:border-[#1f1f1f] dark:bg-[#0d0d0d]";

// ── Section ──────────────────────────────────

export function DocSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-neutral-200 pt-8 pb-10 dark:border-[#1f1f1f] first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

// ── Steps ────────────────────────────────────

export function Steps({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <ol className="space-y-4">
      {items.map((child, i) =>
        React.cloneElement(child as React.ReactElement<{ n?: number }>, { n: i + 1 })
      )}
    </ol>
  );
}

export function Step({
  n,
  title,
  children,
}: {
  n?: number;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#668e2b]/15 text-xs font-bold text-[#5c7a24] dark:text-[#8fb53c]">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
        )}
        {children && (
          <div className={cn("text-sm text-neutral-600 dark:text-neutral-400", title && "mt-1")}>
            {children}
          </div>
        )}
      </div>
    </li>
  );
}

// ── Callouts ─────────────────────────────────

const CALLOUT_STYLES = {
  tip: "border-[#668e2b]/40 bg-[#668e2b]/10 text-neutral-700 dark:text-neutral-300",
  note: "border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-[#2a2a2a] dark:bg-[#111] dark:text-neutral-400",
  warning:
    "border-amber-400/40 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300",
} as const;

export function Callout({
  tone = "tip",
  title,
  children,
}: {
  tone?: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", CALLOUT_STYLES[tone])}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

// ── Menu path chips ──────────────────────────

export function MenuPath({ parts }: { parts: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ArrowRight size={11} className="text-neutral-400" />}
          <span
            className={cn(
              "rounded-md border px-2 py-1 font-medium",
              i === parts.length - 1
                ? "border-[#668e2b]/50 bg-[#668e2b]/10 text-[#5c7a24] dark:text-[#8fb53c]"
                : "border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-[#2a2a2a] dark:bg-[#141414] dark:text-neutral-400"
            )}
          >
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Figure (screenshot or mockup) ────────────

export function Figure({
  src,
  alt = "Screenshot",
  caption,
  children,
}: {
  src?: string;
  alt?: string;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <figure className="my-4">
      <div className={cn(PANEL, "overflow-hidden p-3 sm:p-4")}>{src ? <img src={src} alt={alt} className="w-full rounded-lg" /> : children}</div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── Mock UI wireframes ───────────────────────
// These render simplified versions of the real screens with the
// relevant control highlighted, so users can recognise where to click.

function Hot({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
        active && "bg-[#668e2b]/20 text-[#4c641f] ring-1 ring-[#668e2b]/60 dark:text-[#9cc24b]"
      )}
    >
      {children}
      {active && <span className="text-[9px] font-bold uppercase tracking-wide">click</span>}
    </span>
  );
}

// Mini version of the admin sidebar (collapsible groups + reports + user chip)
export function MockAdminSidebar({
  activeGroup,
  activeItem,
}: {
  activeGroup?: string;
  activeItem?: string;
}) {
  const groups = [
    { label: "Burn Box", items: ["Ingredients", "Recipes", "Inventory", "Adjustments", "Sales"] },
    { label: "Box Apparel", items: ["Products", "Inventory", "Sales"] },
    { label: "Purchases", items: ["Invoices", "Suppliers"] },
  ];
  const reports = ["Reports", "GymMaster Reconciliation", "Help & Guide"];

  return (
    <div className="w-44 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-[10px] dark:border-[#242424] dark:bg-[#0a0a0a]">
      <div className="mb-2 rounded-md bg-[#668e2b] px-2 py-1.5 text-center font-semibold text-black">
        View Dashboard
      </div>
      <p className="mb-1 px-1 text-[8px] font-bold uppercase tracking-widest text-neutral-400">Main Menu</p>
      {groups.map((g) => (
        <div key={g.label} className="mb-1">
          <p className="px-1 py-0.5 font-semibold text-neutral-500 dark:text-neutral-400">
            {g.label} <span className="text-[8px]">▸</span>
          </p>
          <div className="ml-2 space-y-0.5">
            {g.items.map((item) => (
              <div
                key={item}
                className={cn(
                  "rounded px-1.5 py-1",
                  activeGroup === g.label && activeItem === item
                    ? "bg-[#668e2b]/20 font-semibold text-[#4c641f] ring-1 ring-[#668e2b]/60 dark:text-[#9cc24b]"
                    : "text-neutral-500 dark:text-neutral-400"
                )}
              >
                {item}
                {activeGroup === g.label && activeItem === item && (
                  <span className="ml-1 text-[8px] font-bold uppercase">◀ you are here</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="mb-1 mt-2 px-1 text-[8px] font-bold uppercase tracking-widest text-neutral-400">Reports</p>
      <div className="space-y-0.5">
        {reports.map((r) => (
          <div
            key={r}
            className={cn(
              "rounded px-1.5 py-1",
              activeItem === r && !activeGroup
                ? "bg-[#668e2b]/20 font-semibold text-[#4c641f] ring-1 ring-[#668e2b]/60 dark:text-[#9cc24b]"
                : "text-neutral-500 dark:text-neutral-400"
            )}
          >
            {r}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-200 px-1 pt-2 dark:border-[#242424]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300 text-[8px] font-bold dark:bg-[#333]">U</span>
        <div className="leading-tight">
          <p className="font-medium text-neutral-600 dark:text-neutral-300">User Name</p>
          <p className="text-[8px] text-neutral-400">user@email.com ▾</p>
        </div>
      </div>
    </div>
  );
}

// Mini version of the front-desk sidebar
export function MockFdrSidebar({ active }: { active?: string }) {
  const items = [
    "Front Desk",
    "Record a Sale",
    "Stock Availability",
    "Stock History",
    "My Recent Sales",
    "Adjustments",
    "Customers",
    "Help & Guide",
  ];
  return (
    <div className="w-36 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-[10px] dark:border-[#242424] dark:bg-[#0a0a0a]">
      <div className="mb-2 h-6 rounded bg-neutral-200 dark:bg-[#1a1a1a]" />
      <div className="space-y-0.5">
        {items.map((label) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded px-1.5 py-1",
              active === label
                ? "bg-[#668e2b]/20 font-semibold text-[#4c641f] ring-1 ring-[#668e2b]/60 dark:text-[#9cc24b]"
                : "text-neutral-500 dark:text-neutral-400"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
            {label}
            {active === label && <span className="ml-auto text-[8px] font-bold uppercase">◀</span>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-200 px-1 pt-2 dark:border-[#242424]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300 text-[8px] font-bold dark:bg-[#333]">F</span>
        <div className="leading-tight">
          <p className="font-medium text-neutral-600 dark:text-neutral-300">Front Desk</p>
          <p className="text-[8px] text-neutral-400">Profile ▾</p>
        </div>
      </div>
    </div>
  );
}

// Fake page toolbar with highlighted button
export function MockBar({
  buttons,
  active,
  left,
}: {
  buttons: string[];
  active?: string;
  left?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-[#242424] dark:bg-[#0a0a0a]">
      <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{left ?? "Page title"}</span>
      <div className="flex items-center gap-1.5">
        {buttons.map((b) => (
          <Hot key={b} active={b === active}>
            <span
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium",
                b === active
                  ? "bg-[#668e2b] text-black"
                  : "border border-neutral-300 text-neutral-500 dark:border-[#333] dark:text-neutral-400"
              )}
            >
              {b}
            </span>
          </Hot>
        ))}
      </div>
    </div>
  );
}

// Fake product grid (record sale)
export function MockProductGrid({
  items,
  active,
}: {
  items: { name: string; price: string; badge: string }[];
  active?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((p) => (
        <div
          key={p.name}
          className={cn(
            "rounded-lg border p-2 text-center",
            p.name === active
              ? "border-[#668e2b]/60 bg-[#668e2b]/10 ring-1 ring-[#668e2b]/60"
              : "border-neutral-200 bg-neutral-50 dark:border-[#242424] dark:bg-[#111]"
          )}
        >
          <div className="mx-auto mb-1.5 flex h-10 items-center justify-center rounded bg-neutral-200 text-[9px] text-neutral-400 dark:bg-[#1a1a1a]">
            img
          </div>
          <p className="truncate text-[9px] font-medium text-neutral-700 dark:text-neutral-300">{p.name}</p>
          <p className="text-[10px] font-bold text-neutral-900 dark:text-neutral-100">{p.price}</p>
          <span
            className={cn(
              "mt-1 inline-block rounded px-1 text-[8px] font-semibold",
              p.badge === "Burn Box"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300"
            )}
          >
            {p.badge}
          </span>
          {p.name === active && (
            <p className="mt-1 text-[8px] font-bold uppercase text-[#5c7a24] dark:text-[#9cc24b]">
              tap + to add ◀
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Fake cart / checkout panel
export function MockCart({
  lines,
  customer,
  payment,
  discount,
  total,
  cta = "Complete Sale",
  activeCta,
}: {
  lines: { name: string; qty: number; price: string }[];
  customer?: string;
  payment?: string;
  discount?: string;
  total: string;
  cta?: string;
  activeCta?: boolean;
}) {
  return (
    <div className="w-44 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-[10px] dark:border-[#242424] dark:bg-[#0a0a0a]">
      <p className="mb-1.5 flex items-center justify-between font-semibold text-neutral-700 dark:text-neutral-200">
        Current Sale <span className="text-neutral-400">{lines.length} items</span>
      </p>
      <div className="space-y-1 border-b border-neutral-200 pb-1.5 dark:border-[#242424]">
        {lines.map((l) => (
          <div key={l.name} className="flex items-center justify-between gap-1">
            <span className="truncate text-neutral-600 dark:text-neutral-300">{l.name} ×{l.qty}</span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{l.price}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 py-1.5 text-neutral-500">
        <div className="flex justify-between"><span>Customer</span><span className="text-neutral-700 dark:text-neutral-300">{customer ?? "Walk-in"}</span></div>
        <div className="flex justify-between"><span>Payment</span><span className="text-neutral-700 dark:text-neutral-300">{payment ?? "—"}</span></div>
        {discount && <div className="flex justify-between"><span>Discount</span><span className="text-red-500">{discount}</span></div>}
        <div className="flex justify-between border-t border-dashed border-neutral-300 pt-1 font-bold text-neutral-900 dark:border-[#333] dark:text-neutral-100">
          <span>Total</span><span className="text-[#668e2b]">{total}</span>
        </div>
      </div>
      <div
        className={cn(
          "mt-1 rounded-md py-1.5 text-center text-[10px] font-bold",
          activeCta ? "bg-[#668e2b] text-black ring-2 ring-[#668e2b]/50 ring-offset-1" : "bg-[#668e2b]/70 text-black"
        )}
      >
        {cta} →
      </div>
      {activeCta && <p className="mt-1 text-center text-[8px] font-bold uppercase text-[#5c7a24] dark:text-[#9cc24b]">click here ◀</p>}
    </div>
  );
}

// Fake data table with optional highlighted row/column
export function MockTable({
  columns,
  rows,
  highlightRow,
  highlightCol,
}: {
  columns: string[];
  rows: string[][];
  highlightRow?: number;
  highlightCol?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-[#242424]">
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-neutral-100 text-left text-neutral-500 dark:bg-[#141414] dark:text-neutral-400">
            {columns.map((c, i) => (
              <th
                key={c}
                className={cn(
                  "px-2 py-1.5 font-semibold",
                  highlightCol === i && "bg-[#668e2b]/20 text-[#4c641f] dark:text-[#9cc24b]"
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={cn(
                "border-t border-neutral-200 dark:border-[#1f1f1f]",
                ri === highlightRow && "bg-[#668e2b]/10"
              )}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-2 py-1.5 text-neutral-600 dark:text-neutral-300",
                    ri === highlightRow && ci === highlightCol && "font-bold text-[#4c641f] ring-1 ring-inset ring-[#668e2b]/60 dark:text-[#9cc24b]"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {highlightRow !== undefined && (
        <p className="border-t border-neutral-200 px-2 py-1 text-center text-[8px] font-bold uppercase text-[#5c7a24] dark:border-[#242424] dark:text-[#9cc24b]">
          ▲ this row
        </p>
      )}
    </div>
  );
}

// Fake form fields
export function MockFields({
  fields,
}: {
  fields: { label: string; value?: string; active?: boolean }[];
}) {
  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f.label} className="grid grid-cols-[110px_1fr] items-center gap-2">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{f.label}</span>
          <span
            className={cn(
              "rounded-md border px-2 py-1 text-[10px]",
              f.active
                ? "border-[#668e2b]/60 bg-[#668e2b]/10 font-semibold text-[#4c641f] ring-1 ring-[#668e2b]/60 dark:text-[#9cc24b]"
                : "border-neutral-300 bg-neutral-50 text-neutral-500 dark:border-[#333] dark:bg-[#111] dark:text-neutral-400"
            )}
          >
            {f.value ?? "Type here…"}
            {f.active && <span className="ml-1 text-[8px] font-bold uppercase">◀ fill this</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// Fake stat cards row
export function MockStatCards({ cards }: { cards: { label: string; value: string; hot?: boolean }[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "rounded-lg border p-2 text-center",
            c.hot
              ? "border-[#668e2b]/60 bg-[#668e2b]/10 ring-1 ring-[#668e2b]/60"
              : "border-neutral-200 bg-neutral-50 dark:border-[#242424] dark:bg-[#111]"
          )}
        >
          <p className="text-[8px] uppercase tracking-wide text-neutral-400">{c.label}</p>
          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{c.value}</p>
          {c.hot && <p className="text-[8px] font-bold uppercase text-[#5c7a24] dark:text-[#9cc24b]">watch this ◀</p>}
        </div>
      ))}
    </div>
  );
}

// Generic "two-pane" layout: sidebar mock + content mock side by side
export function MockScreen({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {sidebar}
      <div className={cn(PANEL, "min-w-0 flex-1 space-y-2 p-3")}>{children}</div>
    </div>
  );
}
