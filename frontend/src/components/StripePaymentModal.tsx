import React, { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import "../styles/StripePaymentModal.css";
import type { TransactionData } from "../types/transaction.types";

interface StripePaymentModalProps {
  transactionId: string;
  buyerId: string;
  amount: number;
  currency: string;
  onSuccess: (updated: TransactionData) => void;
  onClose: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  transactionId,
  buyerId,
  amount,
  currency,
  onSuccess,
  onClose,
}) => {
  const cardElementRef = useRef<HTMLDivElement>(null);
  const stripeRef      = useRef<Stripe | null>(null);
  const cardRef        = useRef<StripeCardElement | null>(null);

  const [stripeReady, setStripeReady] = useState(false);
  const [processing, setProcessing]  = useState(false);
  const [cardError, setCardError]    = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    stripePromise.then((stripe) => {
      if (!stripe || !cardElementRef.current || !mounted) return;

      stripeRef.current = stripe;

      const elements = stripe.elements();
      const card = elements.create("card", {
        style: {
          base: {
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: "15px",
            "::placeholder": { color: "#666" },
          },
          invalid: { color: "#f87171" },
        },
      });

      card.mount(cardElementRef.current);
      cardRef.current = card;

      card.on("change", (e) => {
        setCardError(e.error ? e.error.message : null);
      });

      setStripeReady(true);
    });

    return () => {
      mounted = false;
      cardRef.current?.destroy();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeRef.current || !cardRef.current || processing) return;

    setProcessing(true);
    setCardError(null);

    try {
      // Step 1 — create PaymentIntent on the backend (manual capture = hold funds)
      const piRes = await fetch("/api/payment/create-payment-intent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const piJson = await piRes.json();
      if (!piRes.ok) throw new Error(piJson.error ?? "Failed to create payment intent.");

      const { clientSecret, paymentIntentId } = piJson as {
        clientSecret: string;
        paymentIntentId: string;
      };

      // Step 2 — confirm the card with Stripe (authorizes the card, does NOT charge yet)
      const { paymentIntent, error } = await stripeRef.current.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardRef.current } }
      );

      if (error) throw new Error(error.message);

      // Stripe puts the intent into requires_capture after confirmCardPayment with manual capture
      if (paymentIntent?.status !== "requires_capture") {
        throw new Error(`Unexpected payment status: ${paymentIntent?.status}`);
      }

      // Step 3 — tell the backend the card was authorized; it verifies and marks buyer as funded
      const txRes = await fetch(`/api/transactions/${transactionId}/milestone1/buyer`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, paymentIntentId }),
      });
      const txJson = await txRes.json();
      if (!txRes.ok) throw new Error(txJson.error ?? "Failed to record deposit.");

      onSuccess(txJson.transaction as TransactionData);
    } catch (err: any) {
      setCardError(err.message ?? "Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="spm-overlay" onClick={onClose}>
      <div className="spm-modal" onClick={(e) => e.stopPropagation()}>

        <div className="spm-header">
          <div>
            <h2>Deposit into Escrow</h2>
            <p>Your card is authorized but not charged until you confirm delivery.</p>
          </div>
          <button className="spm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="spm-amount-box">
          <span className="spm-amount-label">Amount to hold</span>
          <span className="spm-amount-value">
            ${amount.toLocaleString()} {currency.toUpperCase()}
          </span>
        </div>

        {/* Card element container is always in the DOM so Stripe can mount to it */}
        <form onSubmit={handleSubmit} style={{ display: stripeReady ? "block" : "none" }}>
          <label className="spm-field-label">Card details</label>
          <div className="spm-card-element-wrapper">
            <div ref={cardElementRef} />
          </div>

          {cardError && <div className="spm-error">{cardError}</div>}

          <button className="spm-submit" type="submit" disabled={processing}>
            {processing ? "Processing…" : `Authorize $${amount.toLocaleString()}`}
          </button>
        </form>

        {!stripeReady && <div className="spm-loading">Loading payment form…</div>}

        <p className="spm-note">
          🔒 Secured by Stripe · Test mode — use card 4242 4242 4242 4242
        </p>
      </div>
    </div>
  );
};
