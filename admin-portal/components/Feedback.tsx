"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/client/api";
import styles from "./workspace.module.css";

type FeedbackValue = {
  kind: "error" | "success";
  message: string;
  expired?: boolean;
} | null;

export function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  return {
    feedback,
    clearFeedback: useCallback(() => setFeedback(null), []),
    success: useCallback(
      (message: string) => setFeedback({ kind: "success", message }),
      [],
    ),
    failure: useCallback(
      (error: unknown) =>
        setFeedback({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to complete this request. Please try again.",
          expired: error instanceof ApiError && error.status === 401,
        }),
      [],
    ),
  };
}

export function Feedback({ value }: { value: FeedbackValue }) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (value) notice.current?.scrollIntoView({ block: "nearest" });
  }, [value]);
  if (!value) return null;
  return (
    <div
      ref={notice}
      className={`${styles.notice} ${value.kind === "error" ? styles.error : styles.success}`}
      role={value.kind === "error" ? "alert" : "status"}
    >
      <strong>
        {value.kind === "error" ? "Attention needed" : "Changes saved"}
      </strong>
      <span>{value.message}</span>
      {value.expired && <Link href="/login">Sign in again →</Link>}
    </div>
  );
}

export function LoadingState({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.loadingLine} />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
