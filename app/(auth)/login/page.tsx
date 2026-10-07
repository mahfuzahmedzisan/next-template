"use client";

import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { useTransitionRouter } from "@/components/transitions/transition-provider";
import { Suspense, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import PasswordInput from "@/components/forms/password-input";
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
import { Input } from "@/components/ui/input";
import { firstAuthErrorMessage, postAuthApi } from "@/lib/auth/client";
import { SESSION_EXPIRED_REASON } from "@/lib/auth/session-expired";
import { syncStoredThemeToAccount } from "@/lib/theme/persist-theme";
import type { TwoFactorChallengeResponse, User } from "@/types/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Only ever follow our own paths, never an absolute URL from the query. */
function safeNext(value: string | null): Route {
  return (
    value?.startsWith("/") && !value.startsWith("//") ? value : "/admin"
  ) as Route;
}

function LoginForm() {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === SESSION_EXPIRED_REASON;
  const next = safeNext(searchParams.get("next"));
  const sessionToastShown = useRef(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (sessionExpired && !sessionToastShown.current) {
      sessionToastShown.current = true;
      toast.info(
        "Your session ended. Sign in again to pick up where you left off.",
        { duration: 4000 },
      );
    }
  }, [sessionExpired]);

  async function onSubmit(values: LoginValues) {
    const result = await postAuthApi<
      { user: User } | TwoFactorChallengeResponse
    >("/api/auth/login", values);

    if (!result.ok) {
      toast.error(firstAuthErrorMessage(result.error), { duration: 4000 });
      return;
    }

    if ("two_factor" in result.data && result.data.two_factor) {
      sessionStorage.setItem("challenge_token", result.data.challenge_token);
      sessionStorage.setItem("challenge_next", next);
      router.push("/two-factor-challenge");
      return;
    }

    if ("user" in result.data) {
      await syncStoredThemeToAccount(result.data.user.theme);
    }
    toast.success("Signed in");
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <RouteReady />
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <TextLink
                      href="/forgot-password"
                      className="text-xs text-muted-foreground"
                    >
                      Forgot password?
                    </TextLink>
                  </div>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <TextLink href="/register">Create one</TextLink>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
