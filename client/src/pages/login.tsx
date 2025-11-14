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
    <div className={t("pages.login.name.min_h_screen_bg_gray_50_flex_items_center_justify_center_p_4")}>
      <Card className={t("pages.login.name.w_full_max_w_md")}>
        <CardHeader className={t("pages.login.name.text_center")}>
          <div className={t("pages.login.name.mx_auto_bg_primary_text_primary_foreground_p_3_rounded_full_w_fit_mb_4")}>
            <img src="/FactoryLogoHPNGWg.png" alt="{t('pages.login.alt.logo')}" className={t("pages.login.name.w_34_h_34")} />
          </div>
          <CardTitle className={t("pages.login.name.text_2xl_font_bold")}>{t("login.title")}</CardTitle>
          <p className={t("pages.login.name.text_muted_foreground")}>
            {t("login.subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={t("pages.login.name.space_y_4")}>
              <FormField
                control={form.control}
                name="{t('pages.login.name.username')}"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.username")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("login.enterUsername")}
                        className={t("pages.login.name.text_right")}
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
                name="{t('pages.login.name.password')}"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("login.enterPassword")}
                        className={t("pages.login.name.text_right")}
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
                className={t("pages.login.name.w_full_btn_primary")}
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? t("login.loggingIn") : t("login.login")}
              </Button>
            </form>
          </Form>

          <div className={t("pages.login.name.mt_4_relative")}>
            <div className={t("pages.login.name.absolute_inset_0_flex_items_center")}>
              <span className={t("pages.login.name.w_full_border_t")} />
            </div>
            <div className={t("pages.login.name.relative_flex_justify_center_text_xs_uppercase")}>
              <span className={t("pages.login.name.bg_background_px_2_text_muted_foreground")}>
                {t("login.or")}
              </span>
            </div>
          </div>

          <div className={t("pages.login.name.mt_4")}>
            <Button
              variant="outline"
              className={t("pages.login.name.w_full")}
              onClick={() => {
                window.location.href = "/api/login-replit";
              }}
              data-testid="button-login-replit"
            >
              <svg 
                className={t("pages.login.name.w_5_h_5_mr_2")} 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/>
              </svg>
              {t("login.loginWithReplit")}
            </Button>
          </div>

          <div className={t("pages.login.name.mt_6_pt_6_border_t")}>
            <p className={t("pages.login.name.text_xs_text_muted_foreground_text_center")}>
              {t("login.copyrightText")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
