"use client";

import { useActionState, useEffect, useRef } from "react";
import { limits } from "./fields";
import { type ContactState, submitContact } from "./submit";
import styles from "./index.module.css";

const initialState: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState, "/contact");
  const form = useRef<HTMLFormElement>(null);
  const requestId = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.status === "invalid") form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    if (state.status === "accepted" && requestId.current) requestId.current.value = "";
  }, [state]);

  return (
    <form
      ref={form}
      className={styles.form}
      aria-labelledby="contact-heading"
      action={action}
      onSubmit={() => {
        if (requestId.current && !requestId.current.value && window.isSecureContext) {
          requestId.current.value = crypto.randomUUID();
        }
      }}
    >
      {/*<p>お問い合わせいただいた内容は、確認後3営業日以内に入力されたメールアドレス宛に返信します。</p>*/}
      <input ref={requestId} type="hidden" name="requestId" defaultValue={state.requestId ?? ""} />
      <div hidden>
        <label data-required="必須" htmlFor="contact-website">
          ウェブサイト（空欄のままお送りください）
        </label>
        <input id="contact-website" type="text" name="website" autoComplete="off" tabIndex={-1} />
      </div>
      <div className={styles.field}>
        <label data-required="必須" htmlFor="contact-email">
          メールアドレス
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          readOnly={pending}
          maxLength={limits.email}
          placeholder={`受信可能なメールアドレスを入力してください`}
          defaultValue={state.values?.email ?? ""}
          aria-invalid={state.errors?.email ? true : undefined}
          aria-describedby={state.errors?.email ? "contact-email-error" : undefined}
        />
        {state.errors?.email && <p id="contact-email-error">{state.errors.email}</p>}
      </div>
      <div className={styles.field}>
        <label data-required="必須" htmlFor="contact-subject">
          件名
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          readOnly={pending}
          maxLength={limits.subject}
          placeholder={`件名を${limits.subject}文字以内で入力してください`}
          defaultValue={state.values?.subject ?? ""}
          aria-invalid={state.errors?.subject ? true : undefined}
          aria-describedby={state.errors?.subject ? "contact-subject-error" : undefined}
        />
        {state.errors?.subject && <p id="contact-subject-error">{state.errors.subject}</p>}
      </div>
      <div className={styles.field}>
        <label data-required="必須" htmlFor="contact-body">
          本文
        </label>
        <textarea
          id="contact-body"
          name="body"
          rows={7}
          required
          readOnly={pending}
          maxLength={limits.body}
          placeholder={`問い合わせ内容を${limits.body}文字以内で入力してください`}
          defaultValue={state.values?.body ?? ""}
          aria-invalid={state.errors?.body ? true : undefined}
          aria-describedby={state.errors?.body ? "contact-body-error" : undefined}
        />
        {state.errors?.body && <p id="contact-body-error">{state.errors.body}</p>}
      </div>
      <div>
        <button type="submit" disabled={pending}>
          {pending ? "送信中…" : "送信する"}
        </button>
        <p role="status" className={styles.status}>
          {state.status === "accepted" && "お問い合わせを受け付けました。"}
          {state.status === "invalid" && "入力内容を確認してください。"}
          {state.status === "error" && "受付を確認できませんでした。時間をおいてもう一度送信してください。"}
        </p>
      </div>
    </form>
  );
}
