"use server";

import { createHash, randomUUID } from "node:crypto";
import { isValidEmail } from "@/lib/email";
import { adminGraphql } from "@/lib/shopify/admin";
import { type ContactFields, limits } from "./fields";

export type ContactState = {
  status: "idle" | "invalid" | "error" | "accepted";
  values?: ContactFields;
  errors?: Partial<ContactFields>;
  requestId?: string;
};

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function saveInquiry({ email, subject, body }: ContactFields, requestId: string) {
  const type = "contact_inquiry";
  // 設定ミスでお問い合わせが公開されることを防ぐ。書き込み前に定義を確認する。
  const { metaobjectDefinitionByType: definition } = await adminGraphql<{
    metaobjectDefinitionByType: { access: { storefront: string; customerAccount: string } } | null;
  }>(
    `query ContactDefinition($type: String!) {
      metaobjectDefinitionByType(type: $type) { access { storefront customerAccount } }
    }`,
    { type },
  );
  if (definition?.access.storefront !== "NONE" || definition.access.customerAccount !== "NONE") {
    throw new Error("Contact inquiry requires a private metaobject definition.");
  }

  const { customerSet } = await adminGraphql<{
    customerSet: { customer: { id: string } | null; userErrors: { code: string | null }[] };
  }>(
    `mutation ContactCustomer($email: String!) {
      customerSet(identifier: { email: $email }, input: { email: $email }) {
        customer { id }
        userErrors { code }
      }
    }`,
    { email },
  );
  if (customerSet.userErrors.length || !customerSet.customer) {
    throw new Error(
      `Contact customer lookup or creation failed (${customerSet.userErrors[0]?.code ?? "no customer"}).`,
    );
  }

  // タイムアウト後の再送は同じ受付にまとめる。別の本文や宛先で同じ受付を更新させない。
  const handle = createHash("sha256")
    .update(JSON.stringify([requestId, email, subject, body]))
    .digest("hex");
  const { metaobjectUpsert } = await adminGraphql<{
    metaobjectUpsert: { metaobject: { id: string } | null; userErrors: { code: string | null }[] };
  }>(
    `mutation SaveContactInquiry($handle: MetaobjectHandleInput!, $entry: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $entry) {
        metaobject { id }
        userErrors { code }
      }
    }`,
    {
      handle: { type, handle },
      entry: {
        fields: [
          { key: "subject", value: subject },
          { key: "body", value: body },
          { key: "email", value: email },
          { key: "customer", value: customerSet.customer.id },
        ],
      },
    },
  );
  if (metaobjectUpsert.userErrors.length || !metaobjectUpsert.metaobject) {
    throw new Error(`Contact inquiry was not saved (${metaobjectUpsert.userErrors[0]?.code ?? "no entry"}).`);
  }
}

export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  if (readText(formData, "website")) return { status: "accepted" };

  const email = readText(formData, "email");
  const subject = readText(formData, "subject");
  const body = readText(formData, "body").replace(/\r\n?/g, "\n");
  const errors: Partial<ContactFields> = {};
  if (!isValidEmail(email)) errors.email = "返信先のメールアドレスを正しい形式で入力してください。";
  if (!subject || subject.length > limits.subject || /[\r\n]/.test(subject)) {
    errors.subject = `件名は${limits.subject}文字以内の1行で入力してください。`;
  }
  if (!body || body.length > limits.body) errors.body = `本文は${limits.body}文字以内で入力してください。`;
  const values = {
    email: email.slice(0, limits.email),
    subject: subject.slice(0, limits.subject),
    body: body.slice(0, limits.body),
  };
  const key = readText(formData, "requestId");
  const requestId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)
    ? key
    : randomUUID();
  if (Object.keys(errors).length) return { status: "invalid", errors, values, requestId };

  try {
    await saveInquiry(values, requestId);
    return { status: "accepted" };
  } catch (error) {
    console.error("Contact form submission failed.", error instanceof Error ? error.message : "Unknown error");
    return { status: "error", values, requestId };
  }
}
