"use client";

import type { Route } from "next";
import { useTransitionRouter } from "@/components/transitions/transition-provider";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import TextLink from "@/components/forms/text-link";
import { RouteReady } from "@/components/transitions/route-ready";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { firstAuthErrorMessage, postAuthApi } from "@/lib/auth/client";
import { syncStoredThemeToAccount } from "@/lib/theme/persist-theme";
import type { User } from "@/types/auth";

const codeSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});
const recoverySchema = z.object({
  recovery_code: z.string().min(1, "Enter a recovery code"),
});

type CodeValues = z.infer<typeof codeSchema>;
type RecoveryValues = z.infer<typeof recoverySchema>;

export default function TwoFactorChallengePage() {
  const router = useTransitionRouter();
  const [challengeToken] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem("challenge_token"),
  );
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  useEffect(() => {
    if (!challengeToken) {
      router.replace("/login");
    }
  }, [challengeToken, router]);

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const recoveryForm = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { recovery_code: "" },
  });

  async function completeChallenge(body: Record<string, string>) {
    const result = await postAuthApi<{ user: User }>(
      "/api/auth/two-factor-challenge",
      { challenge_token: challengeToken, ...body },
    );

    if (!result.ok) {
      toast.error(firstAuthErrorMessage(result.error), { duration: 4000 });
      return;
    }

    const next = (sessionStorage.getItem("challenge_next") ??
      "/admin") as Route;
    sessionStorage.removeItem("challenge_token");
    sessionStorage.removeItem("challenge_next");

    await syncStoredThemeToAccount(result.data.user.theme);
    toast.success("Verified");
    router.push(next);
    router.refresh();
  }

  if (!challengeToken) {
    return null;
  }

  return (
    <Card>
      <RouteReady />
      <CardHeader>
        <CardTitle className="text-2xl">Two-factor verification</CardTitle>
        <CardDescription>
          {useRecoveryCode
            ? "Enter one of your recovery codes."
            : "Enter the 6-digit code from your authenticator app."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {useRecoveryCode ? (
          <Form {...recoveryForm}>
            <form
              onSubmit={recoveryForm.handleSubmit((values) =>
                completeChallenge({ recovery_code: values.recovery_code }),
              )}
              className="space-y-5"
            >
              <FormField
                control={recoveryForm.control}
                name="recovery_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery code</FormLabel>
                    <FormControl>
                      <Input autoComplete="one-time-code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={recoveryForm.formState.isSubmitting}
              >
                {recoveryForm.formState.isSubmitting ? "Verifying…" : "Verify"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...codeForm}>
            <form
              onSubmit={codeForm.handleSubmit((values) =>
                completeChallenge({ code: values.code }),
              )}
              className="space-y-5"
            >
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication code</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={codeForm.formState.isSubmitting}
              >
                {codeForm.formState.isSubmitting ? "Verifying…" : "Verify"}
              </Button>
            </form>
          </Form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => setUseRecoveryCode((prev) => !prev)}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {useRecoveryCode
              ? "Use an authenticator code instead"
              : "Use a recovery code instead"}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <TextLink href="/login">Back to sign in</TextLink>
        </p>
      </CardContent>
    </Card>
  );
}
