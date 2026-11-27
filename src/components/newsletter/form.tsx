"use client";

import { useActionState, useId } from "react";
import { type NewsletterState, subscribeToNewsletter } from "./subscribe";
import styles from "./form.module.css";

const messages = {
  idle: "",
  invalid: "メールアドレスの形式を確認してください。",
  error: "登録を受け付けられませんでした。時間をおいてもう一度お試しください。",
  accepted: "メールマガジンのお申し込みを受け付けました。",
};

const initialState: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialState);
  const statusId = useId();

  return (
    <>
      <form action={action} aria-label="メールマガジン登録" className={styles.form}>
        <input
          type="email"
          name="email"
          aria-label="Email address"
          placeholder="Email address"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state.email ?? ""}
          aria-describedby={statusId}
        />
        <button
          type="submit"
          aria-label="メールマガジンに登録する"
          title="メールマガジンに登録する"
          disabled={pending}
        />
      </form>
      <p id={statusId} role="status">
        {pending ? "登録を受け付けています…" : messages[state.status]}
      </p>
    </>
  );
}
