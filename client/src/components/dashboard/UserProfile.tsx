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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('dashboard.userProfile')}
          </CardTitle>
          <CardDescription>
            {t('userProfile.updateInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('userProfile.personalInfo')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
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
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
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
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
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
                  placeholder="+966 5X XXX XXXX"
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
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
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('userProfile.appearance')}</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {userSettings.theme === "light" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
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
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('userProfile.dashboardSettings')}</h4>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('userProfile.autoRefresh')}</Label>
                <p className="text-sm text-muted-foreground">
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
              <div className="space-y-2">
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

          <div className="flex justify-end">
            <Button
              onClick={handleSaveUserSettings}
              disabled={saveUserSettingsMutation.isPending}
              data-testid="button-save-profile"
            >
              {saveUserSettingsMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {t('userProfile.saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
