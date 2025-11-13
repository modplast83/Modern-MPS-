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
        return t('hr.inReview', '{t('hr.inReview', 'قيد المراجعة')}');
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('hr.loadingPerformanceReviews', 'جاري تحميل تقييمات الأداء...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('hr.performanceReviewSystem', 'نظام تقييم الأداء')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('hr.performanceReviewDescription', 'متابعة وتقييم أداء الموظفين بشكل دوري ومنهجي')}
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 ml-2" />
          {t('hr.newReview', 'تقييم جديد')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('hr.totalReviews', 'إجمالي {t('hr.rating', 'التقييم')}ات')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(reviews.length)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('hr.overallAverage', 'المتوسط العام')}
                </p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(averageScore)}`}
                >
                  {formatPercentage(averageScore)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('hr.completedReviews', '{t('hr.rating', 'التقييم')}ات المكتملة')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(
                    reviews.filter(
                      (r) =>
                        r.status === "completed" || r.status === "approved",
                    ).length,
                  )}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('hr.inReview', 'قيد المراجعة')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(
                    reviews.filter((r) => r.status === "in_progress").length,
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            {t('hr.activePerformanceCriteria', 'معايير {t('hr.rating', 'التقييم')} النشطة')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criteria.map((criterion) => (
              <div
                key={criterion.id}
                className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">
                    {criterion.name_ar || criterion.name}
                  </h4>
                  <Badge variant="outline">
                    {formatPercentage(criterion.weight)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {criterion.description_ar ||
                    criterion.description ||
                    t('common.noDescription', 'لا يوجد وصف')}
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {criterion.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {criteria.length === 0 && (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('hr.noCriteriaDefined', 'لا توجد معايير تقييم محددة')}
              </p>
              <Button variant="outline" className="mt-2">
                {t('hr.addPerformanceCriteria', 'إضافة معايير {t('hr.rating', 'التقييم')}')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg mb-1">
                    {getReviewTypeText(review.review_type)}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{t('hr.employeeNo', 'موظف رقم')} {review.employee_id}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(review.status)}>
                  {getStatusText(review.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('hr.reviewPeriod', 'فترة {t('hr.rating', 'التقييم')}')}
                  </p>
                  <p className="font-medium">
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
                  <p className="text-gray-600 dark:text-gray-400">{t('hr.reviewer', 'المقيم')}</p>
                  <p className="font-medium">{t('hr.managerNo', 'مدير رقم')} {review.reviewer_id}</p>
                </div>
              </div>

              {review.overall_score && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('hr.overallScore', 'النتيجة الإجمالية')}
                    </span>
                    <span
                      className={`font-bold ${getScoreColor(review.overall_score)}`}
                    >
                      {formatPercentage(review.overall_score)}
                    </span>
                  </div>
                  <Progress value={review.overall_score} className="h-2" />
                </div>
              )}

              {review.overall_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    التقدير العام
                  </span>
                  <Badge
                    className={`${getRatingColor(review.overall_rating)} bg-transparent border`}
                  >
                    {getRatingText(review.overall_rating)}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>
                  تم الإنشاء:{" "}
                  {new Date(review.created_at).toLocaleDateString("ar")}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedReview(review.id)}
                >
                  {t('common.viewDetails', 'عرض التفاصيل')}
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  تحرير
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('hr.noPerformanceReviews', 'لا توجد تقييمات أداء')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ابدأ ب{t('hr.createReview', 'إنشاء تقييم')} أداء جديد لتتبع أداء فريقك
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 ml-2" />
              {t('hr.createReview', 'إنشاء تقييم')} جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
