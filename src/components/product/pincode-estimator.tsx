"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function estimateDelivery(pin: string): { days: string; free: boolean } {
  const first = parseInt(pin[0]);
  // Metro / tier-1 cities (1xx, 2xx, 4xx, 5xx, 6xx — Delhi, Mumbai, Chennai, Bangalore, Kolkata)
  if ([1, 2, 4, 5, 6].includes(first)) return { days: "3–5 business days", free: true };
  // Tier-2 / tier-3
  return { days: "5–7 business days", free: true };
}

export default function PincodeEstimator() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<{ days: string; free: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const check = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a valid 6-digit pincode.");
      setResult(null);
      return;
    }
    setError("");
    setChecking(true);
    // Simulate async check
    setTimeout(() => {
      setResult(estimateDelivery(pincode));
      setChecking(false);
    }, 600);
  };

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted">
        Check Delivery
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setResult(null);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Enter pincode"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-border bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal transition-all"
          />
        </div>
        <button
          onClick={check}
          disabled={checking || pincode.length !== 6}
          className="h-10 px-4 rounded-xl bg-charcoal text-warm-white text-xs font-semibold tracking-wide disabled:opacity-40 hover:bg-terracotta transition-colors"
        >
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Check"}
        </button>
      </div>

      {error && <p className="text-xs text-terracotta">{error}</p>}

      {result && (
        <div className={cn("flex items-start gap-2 px-3 py-2.5 rounded-xl bg-cream text-xs")}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-none" />
          <div>
            <p className="text-charcoal font-medium">
              Delivery in {result.days}
            </p>
            <p className="text-muted mt-0.5">
              {result.free ? "Free shipping on this order" : "₹99 shipping"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
