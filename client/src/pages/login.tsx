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
import FactoryLogoPath from "../../../attached_assets/FactoryLogoHPNGW.png";

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "اسم المستخدم مطلوب")
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

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
        title: "مرحباً بك",
        description: "تم تسجيل الدخول بنجاح",
      });
    } catch (error) {
      let errorMessage = "حدث خطأ غير متوقع";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // If it's a network error, provide helpful message
      if (
        errorMessage.includes("Network error") ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage =
          "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.";
      }

      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center">
            <img 
              src={FactoryLogoPath} 
              alt="شعار مصنع الأكياس البلاستيكية" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">MPBF System</CardTitle>
          <p className="text-muted-foreground">
            نظام إدارة مصنع الأكياس البلاستيكية
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
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="أدخل اسم المستخدم"
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
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة المرور"
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
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                أو
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
              تسجيل الدخول باستخدام Replit
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              جميع الحقوق محفوظة لـ AbuKhalid مطور ومنفذ
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
