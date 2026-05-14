import { redirect } from "next/navigation";

// Email verification is currently disabled; this route just bounces to /account.
export default function VerifyEmailPage() {
  redirect("/account");
}