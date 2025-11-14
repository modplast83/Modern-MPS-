import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Save,
  RefreshCw,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function UserProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: userSettingsData } = useQuery({
    queryKey: ["/api/settings/user", user?.id],
    enabled: !!user?.id,
  });

  // User preferences state
  const [userSettings, setUserSettings] = useState({
    displayName: user?.display_name_ar || "",
    email: "",
    phone: "",
    language: "ar",
    theme: "light",
    notifications: {
      email: true,
      sms: false,
      push: true,
      sound: true,
    },
    dashboard: {
      autoRefresh: true,
      refreshInterval: 30,
      compactView: false,
    },
  });

  // Update userSettings when data is fetched
  useEffect(() => {
    if (userSettingsData && Array.isArray(userSettingsData)) {
      const settingsMap = userSettingsData.reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      setUserSettings((prev) => ({
        ...prev,
        displayName: user?.display_name_ar || settingsMap.displayName || "",
        email: settingsMap.email || "",
        phone: settingsMap.phone || "",
        language: settingsMap.language || "ar",
        theme: settingsMap.theme || "light",
        notifications: {
          email: settingsMap.notificationsEmail === "true",
          sms: settingsMap.notificationsSms === "true",
          push: settingsMap.notificationsPush === "true",
          sound: settingsMap.notificationsSound === "true",
        },
        dashboard: {
          autoRefresh: settingsMap.dashboardAutoRefresh === "true",
          refreshInterval: parseInt(settingsMap.dashboardRefreshInterval || "30"),
          compactView: settingsMap.dashboardCompactView === "true",
        },
      }));
    }
  }, [userSettingsData, user]);

  // Mutation for saving user settings
  const saveUserSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const flattenedSettings = {
        displayName: settings.displayName,
        email: settings.email,
        phone: settings.phone,
        language: settings.language,
        theme: settings.theme,
        notificationsEmail: settings.notifications.email.toString(),
        notificationsSms: settings.notifications.sms.toString(),
        notificationsPush: settings.notifications.push.toString(),
        notificationsSound: settings.notifications.sound.toString(),
        dashboardAutoRefresh: settings.dashboard.autoRefresh.toString(),
        dashboardRefreshInterval: settings.dashboard.refreshInterval.toString(),
        dashboardCompactView: settings.dashboard.compactView.toString(),
      };

      return await apiRequest("/api/settings/user", {
        method: "POST",
        body: JSON.stringify(flattenedSettings),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/settings/user", user?.id],
      });
      toast({
        title: t('userProfile.settingsSaved'),
        description: t('userProfile.preferencesUpdated'),
      });
    },
    onError: () => {
      toast({
        title: t('userProfile.settingsSaveError'),
        description: t('userProfile.settingsSaveErrorDesc'),
        variant: "destructive",
      });
    },
  });

  const handleSaveUserSettings = () => {
    saveUserSettingsMutation.mutate(userSettings);
  };

  return (
    <div className={t("components.dashboard.userprofile.name.space_y_6")}>
      <Card>
        <CardHeader>
          <CardTitle className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
            <User className={t("components.dashboard.userprofile.name.w_5_h_5")} />
            {t('dashboard.userProfile')}
          </CardTitle>
          <CardDescription>
            {t('userProfile.updateInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent className={t("components.dashboard.userprofile.name.space_y_6")}>
          {/* Personal Information */}
          <div className={t("components.dashboard.userprofile.name.space_y_4")}>
            <h4 className={t("components.dashboard.userprofile.name.text_sm_font_medium")}>{t('userProfile.personalInfo')}</h4>
            <div className={t("components.dashboard.userprofile.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
              <div className={t("components.dashboard.userprofile.name.space_y_2")}>
                <Label htmlFor="displayName" className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
                  <User className={t("components.dashboard.userprofile.name.w_4_h_4")} />
                  {t('userProfile.displayName')}
                </Label>
                <Input
                  id="displayName"
                  value={userSettings.displayName}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  data-testid="input-display-name"
                />
              </div>
              <div className={t("components.dashboard.userprofile.name.space_y_2")}>
                <Label htmlFor="email" className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
                  <Mail className={t("components.dashboard.userprofile.name.w_4_h_4")} />
                  {t('userProfile.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  data-testid="input-email"
                />
              </div>
              <div className={t("components.dashboard.userprofile.name.space_y_2")}>
                <Label htmlFor="phone" className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
                  <Phone className={t("components.dashboard.userprofile.name.w_4_h_4")} />
                  {t('userProfile.phone')}
                </Label>
                <Input
                  id="phone"
                  value={userSettings.phone}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="{t('components.dashboard.UserProfile.placeholder.+966_5x_xxx_xxxx')}"
                  data-testid="input-phone"
                />
              </div>
              <div className={t("components.dashboard.userprofile.name.space_y_2")}>
                <Label htmlFor="language" className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
                  <Globe className={t("components.dashboard.userprofile.name.w_4_h_4")} />
                  {t('userProfile.preferredLanguage')}
                </Label>
                <Select
                  value={userSettings.language ?? "ar"}
                  onValueChange={(value) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      language: value,
                    }))
                  }
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">{t('components.dashboard.UserProfile.العربية')}</SelectItem>
                    <SelectItem value="en">{t('components.dashboard.UserProfile.english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className={t("components.dashboard.userprofile.name.space_y_4")}>
            <h4 className={t("components.dashboard.userprofile.name.text_sm_font_medium")}>{t('userProfile.appearance')}</h4>
            <div className={t("components.dashboard.userprofile.name.flex_items_center_justify_between")}>
              <div className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
                {userSettings.theme === "light" ? (
                  <Sun className={t("components.dashboard.userprofile.name.w_4_h_4")} />{t('components.dashboard.UserProfile.)_:_(')}<Moon className={t("components.dashboard.userprofile.name.w_4_h_4")} />
                )}
                <Label>{t('userProfile.darkMode')}</Label>
              </div>
              <Switch
                checked={userSettings.theme === "dark"}
                onCheckedChange={(checked) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    theme: checked ? "dark" : "light",
                  }))
                }
                data-testid="switch-dark-mode"
              />
            </div>
            <div className={t("components.dashboard.userprofile.name.flex_items_center_justify_between")}>
              <div className={t("components.dashboard.userprofile.name.flex_items_center_gap_2")}>
                <Monitor className={t("components.dashboard.userprofile.name.w_4_h_4")} />
                <Label>{t('userProfile.compactView')}</Label>
              </div>
              <Switch
                checked={userSettings.dashboard.compactView}
                onCheckedChange={(checked) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    dashboard: {
                      ...prev.dashboard,
                      compactView: checked,
                    },
                  }))
                }
                data-testid="switch-compact-view"
              />
            </div>
          </div>

          <Separator />

          {/* Dashboard Settings */}
          <div className={t("components.dashboard.userprofile.name.space_y_4")}>
            <h4 className={t("components.dashboard.userprofile.name.text_sm_font_medium")}>{t('userProfile.dashboardSettings')}</h4>
            <div className={t("components.dashboard.userprofile.name.flex_items_center_justify_between")}>
              <div>
                <Label className={t("components.dashboard.userprofile.name.text_base")}>{t('userProfile.autoRefresh')}</Label>
                <p className={t("components.dashboard.userprofile.name.text_sm_text_muted_foreground")}>
                  {t('userProfile.autoRefreshDesc')}
                </p>
              </div>
              <Switch
                checked={userSettings.dashboard.autoRefresh}
                onCheckedChange={(checked) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    dashboard: {
                      ...prev.dashboard,
                      autoRefresh: checked,
                    },
                  }))
                }
                data-testid="switch-auto-refresh"
              />
            </div>

            {userSettings.dashboard.autoRefresh && (
              <div className={t("components.dashboard.userprofile.name.space_y_2")}>
                <Label htmlFor="refreshInterval">
                  {t('userProfile.refreshInterval')}
                </Label>
                <Select
                  value={(
                    userSettings.dashboard.refreshInterval ?? 30
                  ).toString()}
                  onValueChange={(value) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      dashboard: {
                        ...prev.dashboard,
                        refreshInterval: parseInt(value),
                      },
                    }))
                  }
                >
                  <SelectTrigger data-testid="select-refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">{t('userProfile.seconds', { count: 15 })}</SelectItem>
                    <SelectItem value="30">{t('userProfile.seconds', { count: 30 })}</SelectItem>
                    <SelectItem value="60">{t('userProfile.oneMinute')}</SelectItem>
                    <SelectItem value="300">{t('userProfile.minutes', { count: 5 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className={t("components.dashboard.userprofile.name.flex_justify_end")}>
            <Button
              onClick={handleSaveUserSettings}
              disabled={saveUserSettingsMutation.isPending}
              data-testid="button-save-profile"
            >
              {saveUserSettingsMutation.isPending ? (
                <RefreshCw className={t("components.dashboard.userprofile.name.w_4_h_4_mr_2_animate_spin")} />{t('components.dashboard.UserProfile.)_:_(')}<Save className={t("components.dashboard.userprofile.name.w_4_h_4_mr_2")} />
              )}
              {t('userProfile.saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
