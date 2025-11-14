import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { formatNumber, formatPercentage } from "../../lib/formatNumber";
import {
  Target,
  Star,
  TrendingUp,
  Calendar,
  User,
  Plus,
  BarChart3,
  Award,
} from "lucide-react";

interface PerformanceReview {
  id: number;
  employee_id: number;
  review_period_start: string;
  review_period_end: string;
  reviewer_id: number;
  review_type: "annual" | "quarterly" | "project_based" | "probation";
  status: "draft" | "in_progress" | "completed" | "approved";
  overall_score?: number;
  overall_rating?:
    | "excellent"
    | "very_good"
    | "good"
    | "needs_improvement"
    | "unsatisfactory";
  goals_for_next_period?: string;
  development_plan?: string;
  reviewer_comments?: string;
  employee_comments?: string;
  created_at: string;
  updated_at?: string;
}

interface PerformanceCriteria {
  id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  weight: number;
  is_active: boolean;
  category: string;
}

export default function PerformanceReviews() {
  const { t } = useTranslation();
  const [selectedReview, setSelectedReview] = useState<number | null>(null);

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<
    PerformanceReview[]
  >({
    queryKey: ["/api/hr/performance-reviews"],
    initialData: [],
  });

  const { data: criteria = [], isLoading: criteriaLoading } = useQuery<
    PerformanceCriteria[]
  >({
    queryKey: ["/api/hr/performance-criteria"],
    initialData: [],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t('hr.completed', 'مكتمل');
      case "in_progress":
        return t('hr.inReview', 'قيد المراجعة');
      case "draft":
        return t('status.draft', 'مسودة');
      case "approved":
        return t('status.approved', 'معتمد');
      default:
        return status;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "text-green-600 dark:text-green-400";
      case "very_good":
        return "text-blue-600 dark:text-blue-400";
      case "good":
        return "text-yellow-600 dark:text-yellow-400";
      case "needs_improvement":
        return "text-orange-600 dark:text-orange-400";
      case "unsatisfactory":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getRatingText = (rating: string) => {
    switch (rating) {
      case "excellent":
        return t('hr.excellent', 'ممتاز');
      case "very_good":
        return t('hr.veryGood', 'جيد جداً');
      case "good":
        return t('hr.good', 'جيد');
      case "needs_improvement":
        return t('hr.needsImprovement', 'يحتاج تحسين');
      case "unsatisfactory":
        return t('hr.unsatisfactory', 'غير مرضي');
      default:
        return rating;
    }
  };

  const getReviewTypeText = (type: string) => {
    switch (type) {
      case "annual":
        return t('hr.annualReview', 'تقييم سنوي');
      case "quarterly":
        return t('hr.quarterlyReview', 'تقييم ربع سنوي');
      case "project_based":
        return t('hr.projectReview', 'تقييم مشروع');
      case "probation":
        return t('hr.probationReview', 'تقييم فترة تجريبية');
      default:
        return type;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const averageScore =
    reviews.length > 0
      ? parseFloat(
          (
            reviews
              .filter((r) => r.overall_score)
              .reduce((sum, r) => sum + (r.overall_score || 0), 0) /
            reviews.filter((r) => r.overall_score).length
          ).toFixed(1),
        )
      : 0;

  if (reviewsLoading || criteriaLoading) {
    return (
      <div className={t("components.hr.performancereviews.name.flex_items_center_justify_center_h_64")}>
        <div className={t("components.hr.performancereviews.name.text_center")}>
          <div className={t("components.hr.performancereviews.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
          <p className={t("components.hr.performancereviews.name.text_gray_600_dark_text_gray_400_mt_2")}>
            {t('hr.loadingPerformanceReviews', 'جاري تحميل تقييمات الأداء...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={t("components.hr.performancereviews.name.space_y_6")}>
      {/* Header */}
      <div className={t("components.hr.performancereviews.name.flex_justify_between_items_center")}>
        <div>
          <h2 className={t("components.hr.performancereviews.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
            {t('hr.performanceReviewSystem', 'نظام تقييم الأداء')}
          </h2>
          <p className={t("components.hr.performancereviews.name.text_gray_600_dark_text_gray_300")}>
            {t('hr.performanceReviewDescription', 'متابعة وتقييم أداء الموظفين بشكل دوري ومنهجي')}
          </p>
        </div>
        <Button className={t("components.hr.performancereviews.name.bg_green_600_hover_bg_green_700_text_white")}>
          <Plus className={t("components.hr.performancereviews.name.w_4_h_4_ml_2")} />
          {t('hr.newReview', 'تقييم جديد')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={t("components.hr.performancereviews.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
        <Card>
          <CardContent className={t("components.hr.performancereviews.name.p_4")}>
            <div className={t("components.hr.performancereviews.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {t('hr.totalReviews', 'إجمالي التقييمات')}
                </p>
                <p className={t("components.hr.performancereviews.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatNumber(reviews.length)}
                </p>
              </div>
              <Target className={t("components.hr.performancereviews.name.w_8_h_8_text_blue_600")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.performancereviews.name.p_4")}>
            <div className={t("components.hr.performancereviews.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {t('hr.overallAverage', 'المتوسط العام')}
                </p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(averageScore)}`}
                >
                  {formatPercentage(averageScore)}
                </p>
              </div>
              <BarChart3 className={t("components.hr.performancereviews.name.w_8_h_8_text_green_600")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.performancereviews.name.p_4")}>
            <div className={t("components.hr.performancereviews.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {t('hr.completedReviews', 'التقييمات المكتملة')}
                </p>
                <p className={t("components.hr.performancereviews.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatNumber(
                    reviews.filter(
                      (r) =>
                        r.status === "completed" || r.status === "approved",
                    ).length,
                  )}
                </p>
              </div>
              <Award className={t("components.hr.performancereviews.name.w_8_h_8_text_purple_600")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.performancereviews.name.p_4")}>
            <div className={t("components.hr.performancereviews.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {t('hr.inReview', 'قيد المراجعة')}
                </p>
                <p className={t("components.hr.performancereviews.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
                  {formatNumber(
                    reviews.filter((r) => r.status === "in_progress").length,
                  )}
                </p>
              </div>
              <TrendingUp className={t("components.hr.performancereviews.name.w_8_h_8_text_orange_600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className={t("components.hr.performancereviews.name.flex_items_center_gap_2")}>
            <Star className={t("components.hr.performancereviews.name.w_5_h_5")} />
            {t('hr.activePerformanceCriteria', 'معايير التقييم النشطة')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={t("components.hr.performancereviews.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_4")}>
            {criteria.map((criterion) => (
              <div
                key={criterion.id}
                className={t("components.hr.performancereviews.name.p_4_border_rounded_lg_bg_gray_50_dark_bg_gray_800")}
              >
                <div className={t("components.hr.performancereviews.name.flex_justify_between_items_start_mb_2")}>
                  <h4 className={t("components.hr.performancereviews.name.font_medium")}>
                    {criterion.name_ar || criterion.name}
                  </h4>
                  <Badge variant="outline">
                    {formatPercentage(criterion.weight)}
                  </Badge>
                </div>
                <p className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>
                  {criterion.description_ar ||
                    criterion.description ||
                    t('common.noDescription', 'لا يوجد وصف')}
                </p>
                <div className={t("components.hr.performancereviews.name.mt_2")}>
                  <Badge variant="secondary" className={t("components.hr.performancereviews.name.text_xs")}>
                    {criterion.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {criteria.length === 0 && (
            <div className={t("components.hr.performancereviews.name.text_center_py_8")}>
              <Star className={t("components.hr.performancereviews.name.w_12_h_12_text_gray_400_mx_auto_mb_3")} />
              <p className={t("components.hr.performancereviews.name.text_gray_600_dark_text_gray_400")}>
                {t('hr.noCriteriaDefined', 'لا توجد معايير تقييم محددة')}
              </p>
              <Button variant="outline" className={t("components.hr.performancereviews.name.mt_2")}>
                {t('hr.addPerformanceCriteria', 'إضافة معايير التقييم')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className={t("components.hr.performancereviews.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
        {reviews.map((review) => (
          <Card key={review.id} className={t("components.hr.performancereviews.name.hover_shadow_lg_transition_shadow")}>
            <CardHeader>
              <div className={t("components.hr.performancereviews.name.flex_justify_between_items_start")}>
                <div>
                  <CardTitle className={t("components.hr.performancereviews.name.text_lg_mb_1")}>
                    {getReviewTypeText(review.review_type)}
                  </CardTitle>
                  <div className={t("components.hr.performancereviews.name.flex_items_center_gap_2_text_sm_text_gray_600_dark_text_gray_400")}>
                    <User className={t("components.hr.performancereviews.name.w_4_h_4")} />
                    <span>{t('hr.employeeNo', 'موظف رقم')} {review.employee_id}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(review.status)}>
                  {getStatusText(review.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className={t("components.hr.performancereviews.name.space_y_4")}>
              <div className={t("components.hr.performancereviews.name.grid_grid_cols_2_gap_4_text_sm")}>
                <div>
                  <p className={t("components.hr.performancereviews.name.text_gray_600_dark_text_gray_400")}>
                    {t('hr.reviewPeriod', 'فترة التقييم')}
                  </p>
                  <p className={t("components.hr.performancereviews.name.font_medium")}>
                    {new Date(review.review_period_start).toLocaleDateString(
                      "ar",
                    )}{" "}
                    -
                    {new Date(review.review_period_end).toLocaleDateString(
                      "ar",
                    )}
                  </p>
                </div>
                <div>
                  <p className={t("components.hr.performancereviews.name.text_gray_600_dark_text_gray_400")}>{t('hr.reviewer', 'المقيم')}</p>
                  <p className={t("components.hr.performancereviews.name.font_medium")}>{t('hr.managerNo', 'مدير رقم')} {review.reviewer_id}</p>
                </div>
              </div>

              {review.overall_score && (
                <div className={t("components.hr.performancereviews.name.space_y_2")}>
                  <div className={t("components.hr.performancereviews.name.flex_justify_between")}>
                    <span className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>
                      {t('hr.overallScore', 'النتيجة الإجمالية')}
                    </span>
                    <span
                      className={`font-bold ${getScoreColor(review.overall_score)}`}
                    >
                      {formatPercentage(review.overall_score)}
                    </span>
                  </div>
                  <Progress value={review.overall_score} className={t("components.hr.performancereviews.name.h_2")} />
                </div>
              )}

              {review.overall_rating && (
                <div className={t("components.hr.performancereviews.name.flex_items_center_justify_between")}>
                  <span className={t("components.hr.performancereviews.name.text_sm_text_gray_600_dark_text_gray_400")}>{t('components.hr.PerformanceReviews.التقدير_العام')}</span>
                  <Badge
                    className={`${getRatingColor(review.overall_rating)} bg-transparent border`}
                  >
                    {getRatingText(review.overall_rating)}
                  </Badge>
                </div>
              )}

              <div className={t("components.hr.performancereviews.name.flex_items_center_gap_2_text_xs_text_gray_500_dark_text_gray_400")}>
                <Calendar className={t("components.hr.performancereviews.name.w_3_h_3")} />
                <span>
                  تم الإنشاء:{" "}
                  {new Date(review.created_at).toLocaleDateString("ar")}
                </span>
              </div>

              <div className={t("components.hr.performancereviews.name.flex_gap_2_pt_2")}>
                <Button
                  size="sm"
                  className={t("components.hr.performancereviews.name.flex_1")}
                  onClick={() => setSelectedReview(review.id)}
                >
                  {t('common.viewDetails', 'عرض التفاصيل')}
                </Button>
                <Button size="sm" variant="outline" className={t("components.hr.performancereviews.name.flex_1")}>{t('components.hr.PerformanceReviews.تحرير')}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className={t("components.hr.performancereviews.name.p_12_text_center")}>
            <Target className={t("components.hr.performancereviews.name.w_16_h_16_text_gray_400_mx_auto_mb_4")} />
            <h3 className={t("components.hr.performancereviews.name.text_xl_font_semibold_text_gray_900_dark_text_white_mb_2")}>
              {t('hr.noPerformanceReviews', 'لا توجد تقييمات أداء')}
            </h3>
            <p className={t("components.hr.performancereviews.name.text_gray_600_dark_text_gray_400_mb_4")}>
              {t('hr.startByCreatingReview', 'ابدأ بإنشاء تقييم أداء جديد لتتبع أداء فريقك')}
            </p>
            <Button className={t("components.hr.performancereviews.name.bg_green_600_hover_bg_green_700_text_white")}>
              <Plus className={t("components.hr.performancereviews.name.w_4_h_4_ml_2")} />
              {t('hr.createNewReview', 'إنشاء تقييم جديد')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
