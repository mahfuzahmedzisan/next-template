"use client";

import { useSearchParams } from "next/navigation";
import { useTransitionRouter } from "@/components/transitions/transition-provider";
import { Suspense } from "react";
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
} from "@/components/forms/form";
import { firstAuthErrorMessage, postAuthApi } from "@/lib/auth/client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });

type Values = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  async function onSubmit(values: Values) {
    const result = await postAuthApi<{ message: string }>(
      "/api/auth/reset-password",
      {
        token,
        email,
        ...values,
      },
    );

    if (!result.ok) {
      toast.error(firstAuthErrorMessage(result.error), { duration: 4000 });
      return;
    }

    toast.success("Password updated. You can sign in now.");
    router.push("/login");
  }

  if (!token || !email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is missing required information. Request a
            new one below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TextLink href="/forgot-password">Request a new link</TextLink>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <RouteReady />
      <CardHeader>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>Choose a new password for {email}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password_confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
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
              {form.formState.isSubmitting ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
