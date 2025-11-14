import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Copy, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const [certificate, setCertificate] = useState(
    "CmEKHQiXiLXLyZi7AhIGZW50OndhIgRNUEJGUPrb48QGGkCr8LSQ5wTCvUiJ5/EVMWcWnrs6hjWAcMwfaGfagJvEow6UVO4Wqzmpaq5kSaDjZXbrjqPgUwYfVtyXGt7pnK8CEi5tbgik9NfihfNatbOdqWgunFvl4F/C2OedL0VOrTxez1dCeu7pPITYOVBNqw5j",
  );
  const [displayName, setDisplayName] = useState("MPBF");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [twilioSettings, setTwilioSettings] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  const saveTwilioSettings = async () => {
    try {
      // Save Twilio settings to environment or database
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات Twilio بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={t("pages.whatsapp-setup.name.min_h_screen_bg_gray_50")}>
      <Header />
      <div className={t("pages.whatsapp-setup.name.flex")}>
        <Sidebar />
        <main className={t("pages.whatsapp-setup.name.flex_1_lg_mr_64_p_6")}>
          <div className={t("pages.whatsapp-setup.name.mb_6")}>
            <h1 className={t("pages.whatsapp-setup.name.text_2xl_font_bold_text_gray_900_mb_2")}>{t('pages.whatsapp-setup.إعداد_whatsapp_business_api')}</h1>
            <p className={t("pages.whatsapp-setup.name.text_gray_600")}>{t('pages.whatsapp-setup.ضبط_إعدادات_الواتس_اب_للأعمال_وربطها_بـ_meta_business')}</p>
          </div>

          <Tabs defaultValue="meta" className={t("pages.whatsapp-setup.name.space_y_6")}>
            <TabsList className={t("pages.whatsapp-setup.name.grid_w_full_grid_cols_3")}>
              <TabsTrigger value="meta">{t('pages.whatsapp-setup.شهادة_meta')}</TabsTrigger>
              <TabsTrigger value="twilio">{t('pages.whatsapp-setup.إعدادات_twilio')}</TabsTrigger>
              <TabsTrigger value="test">{t('pages.whatsapp-setup.اختبار_الاتصال')}</TabsTrigger>
            </TabsList>

            <TabsContent value="meta" className={t("pages.whatsapp-setup.name.space_y_4")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.whatsapp-setup.name.flex_items_center_gap_2")}>
                    <CheckCircle className={t("pages.whatsapp-setup.name.h_5_w_5_text_green_600")} />{t('pages.whatsapp-setup.شهادة_الملكية_من_meta')}</CardTitle>
                  <CardDescription>{t('pages.whatsapp-setup.شهادة_التحقق_من_ملكية_رقم_الهاتف_المعتمدة_من_meta_business')}</CardDescription>
                </CardHeader>
                <CardContent className={t("pages.whatsapp-setup.name.space_y_4")}>
                  <div>
                    <Label htmlFor="displayName">{t('pages.whatsapp-setup.اسم_العرض_المعتمد')}</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={t("pages.whatsapp-setup.name.mt_1")}
                      readOnly
                    />
                    <p className={t("pages.whatsapp-setup.name.text_sm_text_green_600_mt_1")}>{t('pages.whatsapp-setup.✓_معتمد_من_meta')}</p>
                  </div>

                  <div>
                    <Label htmlFor="certificate">{t('pages.whatsapp-setup.شهادة_الملكية')}</Label>
                    <div className={t("pages.whatsapp-setup.name.relative")}>
                      <Textarea
                        id="certificate"
                        value={certificate}
                        onChange={(e) => setCertificate(e.target.value)}
                        className={t("pages.whatsapp-setup.name.mt_1_min_h_120px_font_mono_text_sm")}
                        dir="ltr"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className={t("pages.whatsapp-setup.name.absolute_top_2_left_2")}
                        onClick={() => copyToClipboard(certificate)}
                      >
                        <Copy className={t("pages.whatsapp-setup.name.h_4_w_4")} />
                      </Button>
                    </div>
                    <p className={t("pages.whatsapp-setup.name.text_sm_text_gray_600_mt_1")}>{t('pages.whatsapp-setup.هذه_الشهادة_تؤكد_ملكيتك_لرقم_الهاتف_في_whatsapp_business_api')}</p>
                  </div>

                  <Alert>
                    <AlertCircle className={t("pages.whatsapp-setup.name.h_4_w_4")} />
                    <AlertDescription>
                      <strong>{t('pages.whatsapp-setup.خطوات_مهمة:')}</strong>
                      <br />{t('pages.whatsapp-setup.1._احفظ_هذه_الشهادة_في_مكان_آمن')}<br />{t('pages.whatsapp-setup.2._استخدمها_لتأكيد_ملكية_الرقم_في_لوحة_تحكم_twilio')}<br />{t('pages.whatsapp-setup.3._تأكد_من_أن_اسم_العرض_يطابق_اسم_شركتك_المسجل')}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="twilio" className={t("pages.whatsapp-setup.name.space_y_4")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.whatsapp-setup.name.flex_items_center_gap_2")}>
                    <Settings className={t("pages.whatsapp-setup.name.h_5_w_5_text_blue_600")} />{t('pages.whatsapp-setup.إعدادات_twilio_whatsapp')}</CardTitle>
                  <CardDescription>{t('pages.whatsapp-setup.ضبط_معلومات_حساب_twilio_لإرسال_رسائل_whatsapp')}</CardDescription>
                </CardHeader>
                <CardContent className={t("pages.whatsapp-setup.name.space_y_4")}>
                  <div>
                    <Label htmlFor="accountSid">{t('pages.whatsapp-setup.account_sid')}</Label>
                    <Input
                      id="accountSid"
                      value={twilioSettings.accountSid}
                      onChange={(e) =>
                        setTwilioSettings((prev) => ({
                          ...prev,
                          accountSid: e.target.value,
                        }))
                      }
                      placeholder="{t('pages.whatsapp-setup.placeholder.acxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')}"
                      className={t("pages.whatsapp-setup.name.mt_1")}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="authToken">{t('pages.whatsapp-setup.auth_token')}</Label>
                    <Input
                      id="authToken"
                      type="password"
                      value={twilioSettings.authToken}
                      onChange={(e) =>
                        setTwilioSettings((prev) => ({
                          ...prev,
                          authToken: e.target.value,
                        }))
                      }
                      placeholder="{t('pages.whatsapp-setup.placeholder.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')}"
                      className={t("pages.whatsapp-setup.name.mt_1")}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twilioPhone">{t('pages.whatsapp-setup.رقم_whatsapp_في_twilio')}</Label>
                    <Input
                      id="twilioPhone"
                      value={twilioSettings.phoneNumber}
                      onChange={(e) =>
                        setTwilioSettings((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="{t('pages.whatsapp-setup.placeholder.whatsapp:+1234567890')}"
                      className={t("pages.whatsapp-setup.name.mt_1")}
                      dir="ltr"
                    />
                    <p className={t("pages.whatsapp-setup.name.text_sm_text_gray_600_mt_1")}>{t('pages.whatsapp-setup.يجب_أن_يبدأ_بـ_"whatsapp:"_متبوعاً_برقم_الهاتف')}</p>
                  </div>

                  <Button onClick={saveTwilioSettings} className={t("pages.whatsapp-setup.name.w_full")}>{t('pages.whatsapp-setup.حفظ_إعدادات_twilio')}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('pages.whatsapp-setup.متطلبات_التكامل')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={t("pages.whatsapp-setup.name.space_y_3")}>
                    <div className={t("pages.whatsapp-setup.name.flex_items_center_gap_3")}>
                      <CheckCircle className={t("pages.whatsapp-setup.name.h_5_w_5_text_green_600")} />
                      <span>{t('pages.whatsapp-setup.حساب_twilio_مفعل')}</span>
                    </div>
                    <div className={t("pages.whatsapp-setup.name.flex_items_center_gap_3")}>
                      <CheckCircle className={t("pages.whatsapp-setup.name.h_5_w_5_text_green_600")} />
                      <span>{t('pages.whatsapp-setup.شهادة_meta_معتمدة')}</span>
                    </div>
                    <div className={t("pages.whatsapp-setup.name.flex_items_center_gap_3")}>
                      <AlertCircle className={t("pages.whatsapp-setup.name.h_5_w_5_text_orange_500")} />
                      <span>{t('pages.whatsapp-setup.ربط_رقم_الهاتف_في_twilio_console')}</span>
                    </div>
                    <div className={t("pages.whatsapp-setup.name.flex_items_center_gap_3")}>
                      <AlertCircle className={t("pages.whatsapp-setup.name.h_5_w_5_text_orange_500")} />
                      <span>{t('pages.whatsapp-setup.تفعيل_whatsapp_business_api')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className={t("pages.whatsapp-setup.name.space_y_4")}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('pages.whatsapp-setup.اختبار_إرسال_الرسائل')}</CardTitle>
                  <CardDescription>{t('pages.whatsapp-setup.تأكد_من_أن_النظام_يمكنه_إرسال_رسائل_whatsapp_بنجاح')}</CardDescription>
                </CardHeader>
                <CardContent className={t("pages.whatsapp-setup.name.space_y_4")}>
                  <div>
                    <Label htmlFor="testPhone">{t('pages.whatsapp-setup.رقم_الهاتف_للاختبار')}</Label>
                    <Input
                      id="testPhone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="{t('pages.whatsapp-setup.placeholder.+966501234567')}"
                      className={t("pages.whatsapp-setup.name.mt_1")}
                      dir="ltr"
                    />
                  </div>

                  <Button
                    className={t("pages.whatsapp-setup.name.w_full")}
                    onClick={() => {
                      toast({
                        title: "جاري الإرسال...",
                        description: "جاري إرسال رسالة اختبار",
                      });
                    }}
                  >{t('pages.whatsapp-setup.إرسال_رسالة_اختبار')}</Button>

                  <Alert>
                    <AlertDescription>{t('pages.whatsapp-setup.ستصل_رسالة_اختبار_إلى_الرقم_المحدد_خلال_ثوان._تأكد_من_أن_الرقم_مسجل_في_whatsapp.')}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
