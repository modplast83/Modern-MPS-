import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { formatNumber, formatPercentage } from "../../lib/formatNumber";
import {
  Play,
  Clock,
  Users,
  CheckCircle,
  BookOpen,
  Plus,
  Calendar,
} from "lucide-react";

interface TrainingProgram {
  id: number;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  duration_hours: number;
  max_participants?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface TrainingEnrollment {
  id: number;
  employee_id: number;
  program_id: number;
  enrolled_date: string;
  completion_status: "not_started" | "in_progress" | "completed" | "dropped";
  completion_date?: string;
  score?: number;
  certificate_issued: boolean;
}

export default function TrainingPrograms() {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);

  const { data: programs = [], isLoading: programsLoading } = useQuery<
    TrainingProgram[]
  >({
    queryKey: ["/api/hr/training-programs"],
    initialData: [],
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<
    TrainingEnrollment[]
  >({
    queryKey: ["/api/hr/training-enrollments"],
    initialData: [],
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getDifficultyText = (level: string) => {
    switch (level) {
      case "beginner":
        return "مبتدئ";
      case "intermediate":
        return "متوسط";
      case "advanced":
        return "متقدم";
      default:
        return level;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "dropped":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t('hr.completed', 'مكتمل');
      case "in_progress":
        return "قيد التنفيذ";
      case "not_started":
        return "لم يبدأ";
      case "dropped":
        return "متوقف";
      default:
        return status;
    }
  };

  const getEnrollmentProgress = (programId: number) => {
    const programEnrollments = enrollments.filter(
      (e) => e.program_id === programId,
    );
    if (programEnrollments.length === 0) return 0;

    const completed = programEnrollments.filter(
      (e) => e.completion_status === "completed",
    ).length;
    return Math.round((completed / programEnrollments.length) * 100);
  };

  if (programsLoading || enrollmentsLoading) {
    return (
      <div className={t("components.hr.trainingprograms.name.flex_items_center_justify_center_h_64")}>
        <div className={t("components.hr.trainingprograms.name.text_center")}>
          <div className={t("components.hr.trainingprograms.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
          <p className={t("components.hr.trainingprograms.name.text_gray_600_dark_text_gray_400_mt_2")}>
            جاري تحميل ال{t('hr.trainingPrograms', 'برامج التدريب')}ية...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={t("components.hr.trainingprograms.name.space_y_6")}>
      {/* Header */}
      <div className={t("components.hr.trainingprograms.name.flex_justify_between_items_center")}>
        <div>
          <h2 className={t("components.hr.trainingprograms.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>{t('components.hr.TrainingPrograms.منصة_التدريب_الإلكتروني')}</h2>
          <p className={t("components.hr.trainingprograms.name.text_gray_600_dark_text_gray_300")}>
            إدارة ال{t('hr.trainingPrograms', 'برامج التدريب')}ية وتتبع تقدم الموظفين
          </p>
        </div>
        <Button className={t("components.hr.trainingprograms.name.bg_blue_600_hover_bg_blue_700_text_white")}>
          <Plus className={t("components.hr.trainingprograms.name.w_4_h_4_ml_2")} />{t('components.hr.TrainingPrograms.برنامج_تدريبي_جديد')}</Button>
      </div>

      {/* Stats Cards */}
      <div className={t("components.hr.trainingprograms.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
        <Card>
          <CardContent className={t("components.hr.trainingprograms.name.p_4")}>
            <div className={t("components.hr.trainingprograms.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.trainingprograms.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {t('hr.totalPrograms', 'إجمالي البرامج')}
                </p>
                <p className={t("components.hr.trainingprograms.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatNumber(programs.length)}
                </p>
              </div>
              <BookOpen className={t("components.hr.trainingprograms.name.w_8_h_8_text_blue_600")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.trainingprograms.name.p_4")}>
            <div className={t("components.hr.trainingprograms.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.trainingprograms.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {t('hr.activePrograms', 'البرامج النشطة')}
                </p>
                <p className={t("components.hr.trainingprograms.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatNumber(programs.filter((p) => p.is_active).length)}
                </p>
              </div>
              <Play className={t("components.hr.trainingprograms.name.w_8_h_8_text_green_600")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.trainingprograms.name.p_4")}>
            <div className={t("components.hr.trainingprograms.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.trainingprograms.name.text_sm_text_gray_600_dark_text_gray_400")}>{t('components.hr.TrainingPrograms.إجمالي_التسجيلات')}</p>
                <p className={t("components.hr.trainingprograms.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatNumber(enrollments.length)}
                </p>
              </div>
              <Users className={t("components.hr.trainingprograms.name.w_8_h_8_text_purple_600")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.trainingprograms.name.p_4")}>
            <div className={t("components.hr.trainingprograms.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.trainingprograms.name.text_sm_text_gray_600_dark_text_gray_400")}>{t('components.hr.TrainingPrograms.معدل_الإنجاز')}</p>
                <p className={t("components.hr.trainingprograms.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatPercentage(
                    enrollments.length > 0
                      ? Math.round(
                          (enrollments.filter(
                            (e) => e.completion_status === "completed",
                          ).length /
                            enrollments.length) *
                            100,
                        )
                      : 0,
                  )}
                </p>
              </div>
              <CheckCircle className={t("components.hr.trainingprograms.name.w_8_h_8_text_emerald_600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className={t("components.hr.trainingprograms.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_6")}>
        {programs.map((program) => (
          <Card key={program.id} className={t("components.hr.trainingprograms.name.hover_shadow_lg_transition_shadow")}>
            <CardHeader>
              <div className={t("components.hr.trainingprograms.name.flex_justify_between_items_start")}>
                <div className={t("components.hr.trainingprograms.name.flex_1")}>
                  <CardTitle className={t("components.hr.trainingprograms.name.text_lg_mb_2")}>
                    {program.title_ar || program.title}
                  </CardTitle>
                  <Badge
                    className={getDifficultyColor(program.difficulty_level)}
                  >
                    {getDifficultyText(program.difficulty_level)}
                  </Badge>
                </div>
                <Badge variant={program.is_active ? "default" : "secondary"}>
                  {program.is_active ? t('common.active', 'نشط') : "معطل"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className={t("components.hr.trainingprograms.name.space_y_4")}>
              <p className={t("components.hr.trainingprograms.name.text_sm_text_gray_600_dark_text_gray_400_line_clamp_3")}>
                {program.description_ar ||
                  program.description ||
                  "لا يوجد وصف متاح"}
              </p>

              <div className={t("components.hr.trainingprograms.name.flex_items_center_justify_between_text_sm_text_gray_600_dark_text_gray_400")}>
                <div className={t("components.hr.trainingprograms.name.flex_items_center_gap_1")}>
                  <Clock className={t("components.hr.trainingprograms.name.w_4_h_4")} />
                  <span>{program.duration_hours} ساعة</span>
                </div>
                <div className={t("components.hr.trainingprograms.name.flex_items_center_gap_1")}>
                  <Users className={t("components.hr.trainingprograms.name.w_4_h_4")} />
                  <span>{program.max_participants || "غير محدود"}</span>
                </div>
              </div>

              <div className={t("components.hr.trainingprograms.name.space_y_2")}>
                <div className={t("components.hr.trainingprograms.name.flex_justify_between_text_sm")}>
                  <span>{t('components.hr.TrainingPrograms.معدل_الإنجاز')}</span>
                  <span>{getEnrollmentProgress(program.id)}%</span>
                </div>
                <Progress
                  value={getEnrollmentProgress(program.id)}
                  className={t("components.hr.trainingprograms.name.h_2")}
                />
              </div>

              <div className={t("components.hr.trainingprograms.name.flex_items_center_gap_2_text_xs_text_gray_500_dark_text_gray_400")}>
                <Calendar className={t("components.hr.trainingprograms.name.w_3_h_3")} />
                <span>
                  تم الإنشاء:{" "}
                  {new Date(program.created_at).toLocaleDateString("ar")}
                </span>
              </div>

              <div className={t("components.hr.trainingprograms.name.flex_gap_2_pt_2")}>
                <Button
                  size="sm"
                  className={t("components.hr.trainingprograms.name.flex_1")}
                  onClick={() => setSelectedProgram(program.id)}
                >
                  {t('common.viewDetails', 'عرض التفاصيل')}
                </Button>
                <Button size="sm" variant="outline" className={t("components.hr.trainingprograms.name.flex_1")}>{t('components.hr.TrainingPrograms.تسجيل_موظف')}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {programs.length === 0 && (
        <Card>
          <CardContent className={t("components.hr.trainingprograms.name.p_12_text_center")}>
            <BookOpen className={t("components.hr.trainingprograms.name.w_16_h_16_text_gray_400_mx_auto_mb_4")} />
            <h3 className={t("components.hr.trainingprograms.name.text_xl_font_semibold_text_gray_900_dark_text_white_mb_2")}>
              {t('hr.noTrainingPrograms', 'لا توجد برامج تدريبية')}
            </h3>
            <p className={t("components.hr.trainingprograms.name.text_gray_600_dark_text_gray_400_mb_4")}>{t('components.hr.TrainingPrograms.ابدأ_بإنشاء_برنامج_تدريبي_جديد_لتطوير_مهارات_فريقك')}</p>
            <Button className={t("components.hr.trainingprograms.name.bg_blue_600_hover_bg_blue_700_text_white")}>
              <Plus className={t("components.hr.trainingprograms.name.w_4_h_4_ml_2")} />{t('components.hr.TrainingPrograms.إنشاء_برنامج_تدريبي')}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
