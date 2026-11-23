"use server";

import { adminGraphql } from "@/lib/shopify/admin";

export type NewsletterState = { status: "idle" | "invalid" | "error" | "accepted"; email?: string };

type CustomerMutation = { customer: { id: string } | null; userErrors: { field: string[] | null }[] };
type ExistingCustomer = {
  id: string;
  defaultEmailAddress: { emailAddress: string; marketingState: string } | null;
};

// HTML の input[type=email] と同じ形式を、直接送信されたリクエストにも適用する。
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

async function subscribeEmail(email: string) {
  const consent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: new Date().toISOString(),
  };
  const { customerCreate } = await adminGraphql<{ customerCreate: CustomerMutation }>(
    `mutation CreateNewsletterCustomer($input: CustomerInput!) {
      customerCreate(input: $input) { customer { id } userErrors { field } }
    }`,
    { input: { email, emailMarketingConsent: consent } },
  );
  if (!customerCreate.userErrors.length) {
    if (!customerCreate.customer) throw new Error("Shopify returned no newsletter customer.");
    return;
  }

  // メールの重複は同時申込でも起きる。既存顧客を完全一致で確認し、プロフィールは書き換えない。
  const { customerByIdentifier } = await adminGraphql<{ customerByIdentifier: ExistingCustomer | null }>(
    `query NewsletterCustomer($email: String!) {
      customerByIdentifier(identifier: { emailAddress: $email }) {
        id
        defaultEmailAddress { emailAddress marketingState }
      }
    }`,
    { email },
  );
  const address = customerByIdentifier?.defaultEmailAddress;
  if (!customerByIdentifier || !address || address.emailAddress.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Shopify could not resolve the newsletter email address.");
  }
  // 登録済み・確認待ち・配信不能なアドレスの状態は維持する。
  if (address.marketingState !== "NOT_SUBSCRIBED" && address.marketingState !== "UNSUBSCRIBED") return;

  const { customerEmailMarketingConsentUpdate } = await adminGraphql<{
    customerEmailMarketingConsentUpdate: CustomerMutation;
  }>(
    `mutation SubscribeNewsletterCustomer($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) { customer { id } userErrors { field } }
    }`,
    { input: { customerId: customerByIdentifier.id, emailMarketingConsent: consent } },
  );
  if (!customerEmailMarketingConsentUpdate.customer || customerEmailMarketingConsentUpdate.userErrors.length) {
    throw new Error("Shopify could not update newsletter consent.");
  }
}

export async function subscribeToNewsletter(_previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const value = formData.get("email");
  const email = typeof value === "string" ? value.trim() : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "invalid", email: email.slice(0, 254) };
  }
  try {
    await subscribeEmail(email);
    return { status: "accepted" };
  } catch (error) {
    console.error("Newsletter signup failed.", error instanceof Error ? error.message : "Unknown error");
    return { status: "error", email };
  }
}
