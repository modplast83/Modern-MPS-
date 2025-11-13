import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { useToast } from "../hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Factory } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const loginSchema = z.object({
    username: z
      .string()
      .min(1, t("login.usernameRequired"))
      .min(3, t("login.usernameMinLength")),
    password: z
      .string()
      .min(1, t("login.passwordRequired"))
      .min(6, t("login.passwordMinLength")),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password);
      toast({
        title: t("login.welcome"),
        description: t("login.loginSuccessful"),
      });
    } catch (error) {
      let errorMessage = t("login.unexpectedError");

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (
        errorMessage.includes("Network error") ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage = t("login.connectionError");
      }

      toast({
        title: t("login.loginFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-full w-fit mb-4">
            <img src="/FactoryLogoHPNGWg.png" alt="Logo" className="w-34 h-34" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
          <p className="text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.username")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("login.enterUsername")}
                        className="text-right"
                        disabled={isLoading}
                        data-testid="input-username"
                        {...field}
                      />
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
                    <FormLabel>{t("login.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("login.enterPassword")}
                        className="text-right"
                        disabled={isLoading}
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? t("login.loggingIn") : t("login.login")}
              </Button>
            </form>
          </Form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("login.or")}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.location.href = "/api/login-replit";
              }}
              data-testid="button-login-replit"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/>
              </svg>
              {t("login.loginWithReplit")}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              {t("login.copyrightText")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
