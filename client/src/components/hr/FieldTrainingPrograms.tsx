import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";
import { apiRequest } from "../../lib/queryClient";
import { formatNumber } from "../../lib/formatNumber";
import {
  Shield,
  Heart,
  Flame,
  Wrench,
  Film,
  Printer,
  Scissors,
  Users,
  MapPin,
  Clock,
  Plus,
  Star,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const trainingProgramSchema = z.object({
  title: z.string().min(1, "Title required"),
  title_ar: z.string().min(1, "Arabic title required"),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  category: z.string().min(1, "Category required"),
  training_scope: z.string().min(1, "Training type required"),
  duration_hours: z.number().min(1, "Duration required"),
  max_participants: z.number().min(1, "Max participants required"),
  location: z.string().min(1, "Location required"),
  practical_requirements: z.string().optional(),
  instructor_id: z.number().optional(),
  department_id: z.string().optional(),
  status: z.string().default("active"),
});

const enrollmentSchema = z.object({
  program_id: z.string().min(1, "Program required"),
  employee_id: z.string().min(1, "Employee required"),
  training_date: z.string().min(1, "Training date required"),
  attendance_notes: z.string().optional(),
});

const evaluationSchema = z.object({
  enrollment_id: z.string().min(1, "Enrollment required"),
  program_id: z.string().min(1, "Program required"),
  employee_id: z.string().min(1, "Employee required"),
  evaluator_id: z.string().min(1, "Evaluator required"),
  evaluation_date: z.string(),
  theoretical_understanding: z.string().min(1, "Theoretical understanding required"),
  practical_skills: z.string().min(1, "Practical skills required"),
  safety_compliance: z.string().min(1, "Safety compliance required"),
  teamwork: z.string().min(1, "Teamwork required"),
  communication: z.string().min(1, "Communication required"),
  strengths: z.string().optional(),
  areas_for_improvement: z.string().optional(),
  additional_notes: z.string().optional(),
  recommendation: z.string().min(1, "Recommendation required"),
});

interface TrainingProgram {
  id: number;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  training_scope: string;
  duration_hours: number;
  max_participants?: number;
  location?: string;
  practical_requirements?: string;
  instructor_id?: number;
  department_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface TrainingEnrollment {
  id: number;
  program_id: number;
  employee_id: number;
  enrolled_date: string;
  training_date?: string;
  attendance_status: string;
  completion_status: string;
  attendance_notes?: string;
  practical_performance?: string;
  final_score?: number;
  certificate_issued: boolean;
  certificate_number?: string;
}

interface TrainingEvaluation {
  id: number;
  enrollment_id: number;
  program_id: number;
  employee_id: number;
  evaluator_id: number;
  evaluation_date: string;
  theoretical_understanding: number;
  practical_skills: number;
  safety_compliance: number;
  teamwork: number;
  communication: number;
  overall_rating: number;
  strengths?: string;
  areas_for_improvement?: string;
  additional_notes?: string;
  recommendation: string;
}

export default function FieldTrainingPrograms() {
  const { t } = useTranslation();
  const [selectedView, setSelectedView] = useState<
    "programs" | "enrollments" | "evaluations"
  >{t('components.hr.FieldTrainingPrograms.("programs");_const_[iscreateprogramopen,_setiscreateprogramopen]_=_usestate(false);_const_[isenrollmentopen,_setisenrollmentopen]_=_usestate(false);_const_[isevaluationopen,_setisevaluationopen]_=_usestate(false);_const_[selectedenrollment,_setselectedenrollment]_=_usestate')}<TrainingEnrollment | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Forms
  const programForm = useForm<z.infer<typeof trainingProgramSchema>>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      category: "general",
      training_scope: "safety",
      duration_hours: 4,
      max_participants: 20,
      status: "active",
    },
  });

  const enrollmentForm = useForm<z.infer<typeof enrollmentSchema>>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      program_id: "",
      employee_id: "",
      training_date: new Date().toISOString().split("T")[0],
      attendance_notes: "",
    },
  });

  const evaluationForm = useForm<z.infer<typeof evaluationSchema>>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      enrollment_id: "",
      program_id: "",
      employee_id: "",
      evaluator_id: user?.id?.toString() || "",
      evaluation_date: new Date().toISOString().split("T")[0],
      theoretical_understanding: "3",
      practical_skills: "3",
      safety_compliance: "3",
      teamwork: "3",
      communication: "3",
      strengths: "",
      areas_for_improvement: "",
      additional_notes: "",
      recommendation: "pass",
    },
  });

  // Queries
  const { data: programs = [], isLoading: programsLoading } = useQuery<
    TrainingProgram[]
  >({
    queryKey: ["/api/hr/training-programs"],
    enabled: false, // Disable for now to test
    initialData: [],
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<
    TrainingEnrollment[]
  >({
    queryKey: ["/api/hr/training-enrollments"],
    enabled: false, // Disable for now to test
    initialData: [],
  });

  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery<
    TrainingEvaluation[]
  >({
    queryKey: ["/api/hr/training-evaluations"],
    enabled: false, // Disable for now to test
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: false, // Disable for now to test
    initialData: [],
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["/api/sections"],
    enabled: false, // Disable for now to test
    initialData: [],
  });

  // Mutations
  const createProgramMutation = useMutation({
    mutationFn: (data: z.infer<typeof trainingProgramSchema>) =>
      apiRequest("/api/hr/training-programs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/hr/training-programs"],
      });
      setIsCreateProgramOpen(false);
      programForm.reset();
      toast({ title: t('toast.trainingProgramCreated', 'تم إنشاء برنامج التدريب بنجاح') });
    },
    onError: () => {
      toast({ title: t('toast.trainingProgramCreateError', 'خطأ في إنشاء برنامج التدريب'), variant: "destructive" });
    },
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/hr/training-enrollments", {
        method: "POST",
        body: {
          ...data,
          program_id: parseInt(data.program_id),
          employee_id: parseInt(data.employee_id),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/hr/training-enrollments"],
      });
      setIsEnrollmentOpen(false);
      enrollmentForm.reset();
      toast({ title: t('toast.employeeEnrolled', 'تم تسجيل الموظف في التدريب بنجاح') });
    },
    onError: () => {
      toast({ title: t('toast.enrollmentError', 'خطأ في تسجيل الموظف'), variant: "destructive" });
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: (data: any) => {
      const processedData = {
        ...data,
        enrollment_id: parseInt(data.enrollment_id),
        program_id: parseInt(data.program_id),
        employee_id: parseInt(data.employee_id),
        evaluator_id: parseInt(data.evaluator_id),
        theoretical_understanding: parseInt(data.theoretical_understanding),
        practical_skills: parseInt(data.practical_skills),
        safety_compliance: parseInt(data.safety_compliance),
        teamwork: parseInt(data.teamwork),
        communication: parseInt(data.communication),
        overall_rating:
          Math.round(
            ((parseInt(data.theoretical_understanding) +
              parseInt(data.practical_skills) +
              parseInt(data.safety_compliance) +
              parseInt(data.teamwork) +
              parseInt(data.communication)) /
              5) *
              10,
          ) / 10,
      };
      return apiRequest("/api/hr/training-evaluations", {
        method: "POST",
        body: processedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/hr/training-evaluations"],
      });
      setIsEvaluationOpen(false);
      evaluationForm.reset();
      toast({ title: t('toast.evaluationSaved', 'تم حفظ تقييم التدريب بنجاح') });
    },
    onError: () => {
      toast({ title: t('toast.evaluationSaveError', 'خطأ في حفظ التقييم'), variant: "destructive" });
    },
  });

  // Helper functions
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "safety":
        return <Shield className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_case_"first_aid":_return')}<Heart className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_case_"fire_safety":_return')}<Flame className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_case_"technical":_return')}<Wrench className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_case_"film":_return')}<Film className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_case_"printing":_return')}<Printer className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_case_"cutting":_return')}<Scissors className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />{t('components.hr.FieldTrainingPrograms.;_default:_return')}<Shield className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />;
    }
  };

  const getScopeText = (scope: string) => {
    switch (scope) {
      case "safety":
        return t('hr.occupationalSafety', 'السلامة المهنية');
      case "first_aid":
        return t('hr.firstAid', 'الإسعافات الأولية');
      case "fire_safety":
        return t('hr.fireSafety', 'السلامة من الحريق');
      case "technical":
        return t('hr.technical', 'التقني');
      case "film":
        return t('production.film', 'الفيلم');
      case "printing":
        return t('production.printing', 'الطباعة');
      case "cutting":
        return t('production.cutting', 'التقطيع');
      default:
        return scope;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "general":
        return t('hr.generalTraining', 'تدريب عام');
      case "department_specific":
        return t('hr.specializedTraining', 'تدريب متخصص');
      default:
        return category;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t('common.active', 'نشط');
      case "inactive":
        return t('common.inactive', 'غير نشط');
      case "draft":
        return t('status.draft', 'مسودة');
      default:
        return status;
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case "attended":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "enrolled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case "attended":
        return t('hr.attended', 'حضر');
      case "absent":
        return t('hr.absent', 'غائب');
      case "enrolled":
        return t('hr.enrolled', 'مسجل');
      case "cancelled":
        return t('hr.cancelled', 'ملغى');
      default:
        return status;
    }
  };

  const getCompletionStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getCompletionStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t('hr.completed', 'مكتمل');
      case "failed":
        return t('hr.failed', 'راسب');
      case "not_started":
        return t('hr.notStarted', 'لم يبدأ');
      default:
        return status;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "pass":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "fail":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "needs_retraining":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case "pass":
        return t('hr.passed', 'نجح');
      case "fail":
        return t('hr.failed', 'رسب');
      case "needs_retraining":
        return t('hr.needsRetraining', 'يحتاج إعادة تدريب');
      default:
        return recommendation;
    }
  };

  const calculateOverallRating = (evaluation: TrainingEvaluation) => {
    return (
      Math.round(
        ((evaluation.theoretical_understanding +
          evaluation.practical_skills +
          evaluation.safety_compliance +
          evaluation.teamwork +
          evaluation.communication) /
          5) *
          10,
      ) / 10
    );
  };

  const onCreateProgram = async (
    data: z.infer<typeof trainingProgramSchema>,
  ) => {
    await createProgramMutation.mutateAsync(data);
  };

  const onCreateEnrollment = async (data: z.infer<typeof enrollmentSchema>) => {
    await createEnrollmentMutation.mutateAsync(data);
  };

  const onCreateEvaluation = async (data: z.infer<typeof evaluationSchema>) => {
    await createEvaluationMutation.mutateAsync(data);
  };

  const openEvaluationDialog = (enrollment: TrainingEnrollment) => {
    setSelectedEnrollment(enrollment);
    evaluationForm.setValue("enrollment_id", enrollment.id.toString());
    evaluationForm.setValue("program_id", enrollment.program_id.toString());
    evaluationForm.setValue("employee_id", enrollment.employee_id.toString());
    setIsEvaluationOpen(true);
  };

  if (programsLoading) {
    return (
      <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_center_p_8")}>
        <div className={t("components.hr.fieldtrainingprograms.name.text_center")}>
          <div className={t("components.hr.fieldtrainingprograms.name.animate_spin_rounded_full_h_12_w_12_border_b_2_border_blue_600_mx_auto_mb_4")}></div>
          <p className={t("components.hr.fieldtrainingprograms.name.text_gray_600_dark_text_gray_300")}>
            {t('hr.loadingTrainingPrograms', 'جاري تحميل برامج التدريب...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={t("components.hr.fieldtrainingprograms.name.space_y_6")} dir="rtl">
      {/* Header */}
      <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_between")}>
        <div>
          <h2 className={t("components.hr.fieldtrainingprograms.name.text_2xl_font_bold_text_gray_900_dark_text_white_mb_2")}>
            {t('hr.fieldTrainingSystem', 'نظام التدريب الميداني')}
          </h2>
          <p className={t("components.hr.fieldtrainingprograms.name.text_gray_600_dark_text_gray_300")}>
            {t('hr.fieldTrainingDescription', 'إدارة التدريبات العملية والميدانية مع التقييم وإصدار الشهادات')}
          </p>
        </div>

        <Dialog
          open={isCreateProgramOpen}
          onOpenChange={setIsCreateProgramOpen}
        >
          <DialogTrigger asChild>
            <Button
              className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_2")}
              data-testid="button-create-program"
            >
              <Plus className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />
              {t('hr.addTrainingProgram', 'إضافة برنامج تدريبي')}
            </Button>
          </DialogTrigger>
          <DialogContent className={t("components.hr.fieldtrainingprograms.name.max_w_2xl")} dir="rtl">
            <DialogHeader>
              <DialogTitle>{t('hr.addNewTrainingProgram', 'إضافة برنامج تدريبي جديد')}</DialogTitle>
              <DialogDescription>
                {t('hr.createTrainingProgramDescription', 'إنشاء برنامج تدريبي جديد للموظفين مع تحديد المدة والمتطلبات')}
              </DialogDescription>
            </DialogHeader>
            <Form {...programForm}>
              <form
                onSubmit={programForm.handleSubmit(onCreateProgram)}
                className={t("components.hr.fieldtrainingprograms.name.space_y_4")}
              >
                <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_2_gap_4")}>
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.title')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.titleEnglish', 'العنوان (إنجليزي)')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-program-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.title_ar')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.titleArabic', 'العنوان (عربي)')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-program-title-ar"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_2_gap_4")}>
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.category')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.trainingCategory', 'فئة التدريب')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-program-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">{t('hr.generalTraining', 'تدريب عام')}</SelectItem>
                              <SelectItem value="department_specific">
                                {t('hr.specializedTraining', 'تدريب متخصص')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.training_scope')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.trainingType', 'نوع التدريب')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-program-scope">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="safety">
                                {t('hr.occupationalSafety', 'السلامة المهنية')}
                              </SelectItem>
                              <SelectItem value="first_aid">
                                {t('hr.firstAid', 'الإسعافات الأولية')}
                              </SelectItem>
                              <SelectItem value="fire_safety">
                                {t('hr.fireSafety', 'السلامة من الحريق')}
                              </SelectItem>
                              <SelectItem value="technical">{t('hr.technical', 'التقني')}</SelectItem>
                              <SelectItem value="film">{t('production.film', 'الفيلم')}</SelectItem>
                              <SelectItem value="printing">{t('production.printing', 'الطباعة')}</SelectItem>
                              <SelectItem value="cutting">{t('production.cutting', 'التقطيع')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_3_gap_4")}>
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.duration_hours')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.trainingDurationHours', 'مدة التدريب (ساعات)')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                            data-testid="input-program-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.max_participants')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.maxParticipants', 'العدد الأقصى للمشاركين')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                            data-testid="input-program-max-participants"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={programForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.location')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.trainingLocation', 'مكان التدريب')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-program-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={t("components.hr.fieldtrainingprograms.name.flex_justify_end_gap_2")}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateProgramOpen(false)}
                    data-testid="button-cancel-program"
                  >
                    {t('common.cancel', 'إلغاء')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProgramMutation.isPending}
                    data-testid="button-save-program"
                  >
                    {createProgramMutation.isPending ? t('common.saving', 'جاري الحفظ...') : t('common.save', 'حفظ')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Tabs */}
      <div className={t("components.hr.fieldtrainingprograms.name.flex_gap_2_border_b")}>
        <Button
          variant={selectedView === "programs" ? "default" : "ghost"}
          onClick={() => setSelectedView("programs")}
          className={t("components.hr.fieldtrainingprograms.name.rounded_b_none")}
          data-testid="tab-programs"
        >
          <Shield className={t("components.hr.fieldtrainingprograms.name.w_4_h_4_ml_2")} />
          {t('hr.trainingPrograms', 'برامج التدريب')}
        </Button>
        <Button
          variant={selectedView === "enrollments" ? "default" : "ghost"}
          onClick={() => setSelectedView("enrollments")}
          className={t("components.hr.fieldtrainingprograms.name.rounded_b_none")}
          data-testid="tab-enrollments"
        >
          <Users className={t("components.hr.fieldtrainingprograms.name.w_4_h_4_ml_2")} />
          {t('hr.enrollments', 'التسجيلات')}
        </Button>
        <Button
          variant={selectedView === "evaluations" ? "default" : "ghost"}
          onClick={() => setSelectedView("evaluations")}
          className={t("components.hr.fieldtrainingprograms.name.rounded_b_none")}
          data-testid="tab-evaluations"
        >
          <Star className={t("components.hr.fieldtrainingprograms.name.w_4_h_4_ml_2")} />
          {t('hr.evaluations', 'التقييمات')}
        </Button>
      </div>

      {/* Programs View */}
      {selectedView === "programs" && (
        <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_1_lg_grid_cols_2_xl_grid_cols_3_gap_6")}>
          {programs.map((program) => (
            <Card
              key={program.id}
              className={t("components.hr.fieldtrainingprograms.name.border_2_hover_border_blue_300_transition_colors")}
              data-testid={`card-program-${program.id}`}
            >
              <CardHeader className={t("components.hr.fieldtrainingprograms.name.pb_3")}>
                <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_between")}>
                  <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_2")}>
                    {getScopeIcon(program.training_scope)}
                    <span className={t("components.hr.fieldtrainingprograms.name.text_sm_text_gray_500")}>
                      {getScopeText(program.training_scope)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(program.status)}>
                    {getStatusText(program.status)}
                  </Badge>
                </div>
                <CardTitle
                  className={t("components.hr.fieldtrainingprograms.name.text_lg")}
                  data-testid={`text-program-title-${program.id}`}
                >
                  {program.title_ar || program.title}
                </CardTitle>
              </CardHeader>

              <CardContent className={t("components.hr.fieldtrainingprograms.name.space_y_4")}>
                <p
                  className={t("components.hr.fieldtrainingprograms.name.text_gray_600_dark_text_gray_300_text_sm")}
                  data-testid={`text-program-description-${program.id}`}
                >
                  {program.description_ar ||
                    program.description ||
                    t('common.noDescription', 'لا يوجد وصف')}
                </p>

                <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_4_text_sm_text_gray_500")}>
                  <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_1")}>
                    <Clock className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />
                    {formatNumber(program.duration_hours)} {t('hr.hours', 'ساعات')}
                  </div>
                  {program.max_participants && (
                    <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_1")}>
                      <Users className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />
                      {formatNumber(program.max_participants)} {t('hr.participants', 'مشارك')}
                    </div>
                  )}
                  {program.location && (
                    <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_1")}>
                      <MapPin className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />
                      {program.location}
                    </div>
                  )}
                </div>

                <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_2")}>
                  <Badge variant="outline">
                    {getCategoryText(program.category)}
                  </Badge>
                </div>

                <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_between_pt_2")}>
                  <div className={t("components.hr.fieldtrainingprograms.name.text_xs_text_gray_500")}>
                    {t('common.createdAt', 'تم الإنشاء')}:{" "}
                    {format(new Date(program.created_at), "dd/MM/yyyy")}
                  </div>

                  <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_1")}>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-view-${program.id}`}
                    >
                      <Eye className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {programs.length === 0 && (
            <Card className={t("components.hr.fieldtrainingprograms.name.col_span_full")}>
              <CardContent className={t("components.hr.fieldtrainingprograms.name.flex_flex_col_items_center_justify_center_p_8")}>
                <Shield className={t("components.hr.fieldtrainingprograms.name.w_16_h_16_text_gray_400_mb_4")} />
                <h3 className={t("components.hr.fieldtrainingprograms.name.text_lg_font_semibold_text_gray_600_mb_2")}>
                  {t('hr.noTrainingPrograms', 'لا توجد برامج تدريبية')}
                </h3>
                <p className={t("components.hr.fieldtrainingprograms.name.text_gray_500_text_center_mb_4")}>
                  {t('hr.startAddingPrograms', 'ابدأ بإضافة برامج التدريب الميداني للموظفين')}
                </p>
                <Button
                  onClick={() => setIsCreateProgramOpen(true)}
                  data-testid="button-create-first-program"
                >
                  <Plus className={t("components.hr.fieldtrainingprograms.name.w_4_h_4_ml_2")} />
                  {t('hr.addTrainingProgram', 'إضافة برنامج تدريبي')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Enrollments View */}
      {selectedView === "enrollments" && (
        <div className={t("components.hr.fieldtrainingprograms.name.space_y_4")}>
          <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_between")}>
            <h3 className={t("components.hr.fieldtrainingprograms.name.text_xl_font_semibold")}>{t('hr.trainingEnrollments', 'التسجيلات في التدريب')}</h3>
            <Dialog open={isEnrollmentOpen} onOpenChange={setIsEnrollmentOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-enrollment">
                  <Plus className={t("components.hr.fieldtrainingprograms.name.w_4_h_4_ml_2")} />
                  {t('hr.newEnrollment', 'تسجيل جديد')}
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>{t('hr.enrollEmployee', 'تسجيل موظف في التدريب')}</DialogTitle>
                  <DialogDescription>
                    {t('hr.enrollEmployeeDescription', 'تسجيل موظف جديد في برنامج التدريب مع تحديد تاريخ التدريب')}
                  </DialogDescription>
                </DialogHeader>
                <Form {...enrollmentForm}>
                  <form
                    onSubmit={enrollmentForm.handleSubmit(onCreateEnrollment)}
                    className={t("components.hr.fieldtrainingprograms.name.space_y_4")}
                  >
                    <FormField
                      control={enrollmentForm.control}
                      name="{t('components.hr.FieldTrainingPrograms.name.program_id')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('hr.trainingProgram', 'برنامج التدريب')}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger data-testid="select-training-program">
                                <SelectValue placeholder={t('hr.selectTrainingProgram', 'اختر برنامج التدريب')} />
                              </SelectTrigger>
                              <SelectContent>
                                {programs
                                  .filter(
                                    (program) =>
                                      program &&
                                      program.id &&
                                      program.id.toString().trim() !== "",
                                  )
                                  .map((program) => (
                                    <SelectItem
                                      key={program.id}
                                      value={program.id.toString()}
                                    >
                                      {program.title_ar || program.title}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={enrollmentForm.control}
                      name="{t('components.hr.FieldTrainingPrograms.name.employee_id')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('hr.employeeName', 'الموظف')}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger data-testid="select-enrollment-employee">
                                <SelectValue placeholder={t('hr.selectEmployee', 'اختر الموظف')} />
                              </SelectTrigger>
                              <SelectContent>
                                {users
                                  .filter(
                                    (user: any) =>
                                      user &&
                                      user.id &&
                                      user.id.toString().trim() !== "",
                                  )
                                  .map((user: any) => (
                                    <SelectItem
                                      key={user.id}
                                      value={user.id.toString()}
                                    >
                                      {user.display_name_ar ||
                                        user.display_name ||
                                        user.username}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={enrollmentForm.control}
                      name="{t('components.hr.FieldTrainingPrograms.name.training_date')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('hr.trainingDate', 'تاريخ التدريب')}</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-enrollment-training-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className={t("components.hr.fieldtrainingprograms.name.flex_justify_end_gap_2")}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEnrollmentOpen(false)}
                        data-testid="button-cancel-enrollment"
                      >
                        {t('common.cancel', 'إلغاء')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={createEnrollmentMutation.isPending}
                        data-testid="button-submit-enrollment"
                      >
                        {createEnrollmentMutation.isPending
                          ? t('hr.enrolling', 'جاري التسجيل...')
                          : t('hr.enroll', 'تسجيل')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className={t("components.hr.fieldtrainingprograms.name.grid_gap_4")}>
            {enrollments.map((enrollment) => (
              <Card
                key={enrollment.id}
                data-testid={`card-enrollment-${enrollment.id}`}
              >
                <CardContent className={t("components.hr.fieldtrainingprograms.name.p_6")}>
                  <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_between")}>
                    <div className={t("components.hr.fieldtrainingprograms.name.space_y_2")}>
                      <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_4")}>
                        <span
                          className={t("components.hr.fieldtrainingprograms.name.font_medium")}
                          data-testid={`text-enrollment-program-${enrollment.id}`}
                        >
                          {t('hr.trainingProgram', 'برنامج التدريب')} #{enrollment.program_id}
                        </span>
                        <Badge
                          className={getAttendanceStatusColor(
                            enrollment.attendance_status,
                          )}
                        >
                          {getAttendanceStatusText(
                            enrollment.attendance_status,
                          )}
                        </Badge>
                        <Badge
                          className={getCompletionStatusColor(
                            enrollment.completion_status,
                          )}
                        >
                          {getCompletionStatusText(
                            enrollment.completion_status,
                          )}
                        </Badge>
                      </div>
                      <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_4_text_sm_text_gray_500")}>
                        <span>{t('hr.employeeName', 'الموظف')}: {enrollment.employee_id}</span>
                        {enrollment.training_date && (
                          <span>
                            {t('hr.trainingDate', 'تاريخ التدريب')}:{" "}
                            {format(
                              new Date(enrollment.training_date),
                              "dd/MM/yyyy",
                            )}
                          </span>
                        )}
                        {enrollment.final_score && (
                          <span>{t('hr.score', 'الدرجة')}: {enrollment.final_score}%</span>
                        )}
                      </div>
                    </div>

                    <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_2")}>
                      {enrollment.certificate_issued && (
                        <Badge className={t("components.hr.fieldtrainingprograms.name.bg_green_100_text_green_800_dark_bg_green_900_dark_text_green_200")}>
                          <Award className={t("components.hr.fieldtrainingprograms.name.w_3_h_3_ml_1")} />
                          {t('hr.certificateIssued', 'شهادة صادرة')}
                        </Badge>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEvaluationDialog(enrollment)}
                        data-testid={`button-evaluate-${enrollment.id}`}
                      >
                        <Star className={t("components.hr.fieldtrainingprograms.name.w_4_h_4")} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {enrollments.length === 0 && (
              <Card>
                <CardContent className={t("components.hr.fieldtrainingprograms.name.flex_flex_col_items_center_justify_center_p_8")}>
                  <Users className={t("components.hr.fieldtrainingprograms.name.w_16_h_16_text_gray_400_mb_4")} />
                  <h3 className={t("components.hr.fieldtrainingprograms.name.text_lg_font_semibold_text_gray_600_mb_2")}>
                    {t('hr.noEnrollments', 'لا توجد تسجيلات')}
                  </h3>
                  <p className={t("components.hr.fieldtrainingprograms.name.text_gray_500_text_center_mb_4")}>
                    {t('hr.noEmployeesEnrolled', 'لم يتم تسجيل أي موظفين في التدريبات بعد')}
                  </p>
                  <Button
                    onClick={() => setIsEnrollmentOpen(true)}
                    data-testid="button-create-first-enrollment"
                  >
                    <Plus className={t("components.hr.fieldtrainingprograms.name.w_4_h_4_ml_2")} />
                    {t('hr.enrollEmployee', 'تسجيل موظف')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Evaluations View */}
      {selectedView === "evaluations" && (
        <div className={t("components.hr.fieldtrainingprograms.name.space_y_4")}>
          <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_justify_between")}>
            <h3 className={t("components.hr.fieldtrainingprograms.name.text_xl_font_semibold")}>{t('hr.trainingEvaluations', 'تقييمات التدريب')}</h3>
          </div>

          <div className={t("components.hr.fieldtrainingprograms.name.grid_gap_4")}>
            {evaluations.map((evaluation) => (
              <Card
                key={evaluation.id}
                data-testid={`card-evaluation-${evaluation.id}`}
              >
                <CardContent className={t("components.hr.fieldtrainingprograms.name.p_6")}>
                  <div className={t("components.hr.fieldtrainingprograms.name.flex_items_start_justify_between")}>
                    <div className={t("components.hr.fieldtrainingprograms.name.space_y_3_flex_1")}>
                      <div className={t("components.hr.fieldtrainingprograms.name.flex_items_center_gap_4")}>
                        <span
                          className={t("components.hr.fieldtrainingprograms.name.font_medium")}
                          data-testid={`text-evaluation-program-${evaluation.id}`}
                        >
                          {t('hr.program', 'برنامج')} #{evaluation.program_id} - {t('hr.employee', 'موظف')} #
                          {evaluation.employee_id}
                        </span>
                        <Badge
                          className={getRecommendationColor(
                            evaluation.recommendation,
                          )}
                        >
                          {getRecommendationText(evaluation.recommendation)}
                        </Badge>
                        <span className={t("components.hr.fieldtrainingprograms.name.text_sm_text_gray_500")}>
                          {t('hr.overallRating', 'التقييم الإجمالي')}: {calculateOverallRating(evaluation)}
                          /5
                        </span>
                      </div>

                      <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_5_gap_4_text_sm")}>
                        <div className={t("components.hr.fieldtrainingprograms.name.text_center")}>
                          <span className={t("components.hr.fieldtrainingprograms.name.block_text_gray_500")}>
                            {t('hr.theoreticalUnderstanding', 'الفهم النظري')}
                          </span>
                          <span className={t("components.hr.fieldtrainingprograms.name.font_medium")}>
                            {evaluation.theoretical_understanding}/5
                          </span>
                        </div>
                        <div className={t("components.hr.fieldtrainingprograms.name.text_center")}>
                          <span className={t("components.hr.fieldtrainingprograms.name.block_text_gray_500")}>
                            {t('hr.practicalSkills', 'المهارات العملية')}
                          </span>
                          <span className={t("components.hr.fieldtrainingprograms.name.font_medium")}>
                            {evaluation.practical_skills}/5
                          </span>
                        </div>
                        <div className={t("components.hr.fieldtrainingprograms.name.text_center")}>
                          <span className={t("components.hr.fieldtrainingprograms.name.block_text_gray_500")}>{t('hr.safety', 'السلامة')}</span>
                          <span className={t("components.hr.fieldtrainingprograms.name.font_medium")}>
                            {evaluation.safety_compliance}/5
                          </span>
                        </div>
                        <div className={t("components.hr.fieldtrainingprograms.name.text_center")}>
                          <span className={t("components.hr.fieldtrainingprograms.name.block_text_gray_500")}>
                            {t('hr.teamwork', 'العمل الجماعي')}
                          </span>
                          <span className={t("components.hr.fieldtrainingprograms.name.font_medium")}>
                            {evaluation.teamwork}/5
                          </span>
                        </div>
                        <div className={t("components.hr.fieldtrainingprograms.name.text_center")}>
                          <span className={t("components.hr.fieldtrainingprograms.name.block_text_gray_500")}>{t('hr.communication', 'التواصل')}</span>
                          <span className={t("components.hr.fieldtrainingprograms.name.font_medium")}>
                            {evaluation.communication}/5
                          </span>
                        </div>
                      </div>

                      <div className={t("components.hr.fieldtrainingprograms.name.text_xs_text_gray_500")}>
                        {t('hr.evaluationDate', 'تاريخ التقييم')}:{" "}
                        {format(
                          new Date(evaluation.evaluation_date),
                          "dd/MM/yyyy",
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {evaluations.length === 0 && (
              <Card>
                <CardContent className={t("components.hr.fieldtrainingprograms.name.flex_flex_col_items_center_justify_center_p_8")}>
                  <Star className={t("components.hr.fieldtrainingprograms.name.w_16_h_16_text_gray_400_mb_4")} />
                  <h3 className={t("components.hr.fieldtrainingprograms.name.text_lg_font_semibold_text_gray_600_mb_2")}>
                    {t('hr.noEvaluations', 'لا توجد تقييمات')}
                  </h3>
                  <p className={t("components.hr.fieldtrainingprograms.name.text_gray_500_text_center_mb_4")}>
                    {t('hr.noTrainingEvaluations', 'لم يتم إجراء أي تقييمات للتدريب بعد')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Evaluation Dialog */}
      <Dialog open={isEvaluationOpen} onOpenChange={setIsEvaluationOpen}>
        <DialogContent className={t("components.hr.fieldtrainingprograms.name.max_w_3xl")} dir="rtl">
          <DialogHeader>
            <DialogTitle>{t('hr.fieldTrainingEvaluation', 'تقييم التدريب الميداني')}</DialogTitle>
            <DialogDescription>
              {t('hr.evaluateEmployeePerformance', 'تقييم أداء الموظف في التدريب الميداني بناءً على المعايير المحددة')}
            </DialogDescription>
          </DialogHeader>
          <Form {...evaluationForm}>
            <form
              onSubmit={evaluationForm.handleSubmit(onCreateEvaluation)}
              className={t("components.hr.fieldtrainingprograms.name.space_y_4")}
            >
              <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_2_gap_4")}>
                <FormField
                  control={evaluationForm.control}
                  name="{t('components.hr.FieldTrainingPrograms.name.evaluation_date')}"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hr.evaluationDate', 'تاريخ التقييم')}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-evaluation-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={evaluationForm.control}
                  name="{t('components.hr.FieldTrainingPrograms.name.recommendation')}"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hr.recommendation', 'التوصية')}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger data-testid="select-recommendation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">{t('hr.passed', 'نجح')}</SelectItem>
                            <SelectItem value="fail">{t('hr.failed', 'رسب')}</SelectItem>
                            <SelectItem value="needs_retraining">
                              {t('hr.needsRetraining', 'يحتاج إعادة تدريب')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className={t("components.hr.fieldtrainingprograms.name.space_y_4")}>
                <h4 className={t("components.hr.fieldtrainingprograms.name.font_medium")}>{t('hr.evaluationCriteria', 'معايير التقييم')} (1-5)</h4>
                <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_2_gap_4")}>
                  <FormField
                    control={evaluationForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.theoretical_understanding')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.theoreticalUnderstanding', 'الفهم النظري')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-theoretical">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={evaluationForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.practical_skills')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.practicalSkills', 'المهارات العملية')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-practical">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={evaluationForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.safety_compliance')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.safetyCompliance', 'الالتزام بالسلامة')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-safety">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={evaluationForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.teamwork')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.teamwork', 'العمل الجماعي')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-teamwork">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={evaluationForm.control}
                    name="{t('components.hr.FieldTrainingPrograms.name.communication')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hr.communication', 'التواصل')}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger data-testid="select-communication">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className={t("components.hr.fieldtrainingprograms.name.grid_grid_cols_2_gap_4")}>
                <FormField
                  control={evaluationForm.control}
                  name="{t('components.hr.FieldTrainingPrograms.name.strengths')}"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hr.strengths', 'نقاط القوة')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          data-testid="textarea-strengths"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={evaluationForm.control}
                  name="{t('components.hr.FieldTrainingPrograms.name.areas_for_improvement')}"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hr.areasForImprovement', 'مجالات التحسين')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          data-testid="textarea-improvements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={evaluationForm.control}
                name="{t('components.hr.FieldTrainingPrograms.name.additional_notes')}"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hr.additionalNotes', 'ملاحظات إضافية')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        data-testid="textarea-additional-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={t("components.hr.fieldtrainingprograms.name.flex_justify_end_gap_2")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEvaluationOpen(false)}
                  data-testid="button-cancel-evaluation"
                >
                  {t('common.cancel', 'إلغاء')}
                </Button>
                <Button
                  type="submit"
                  disabled={createEvaluationMutation.isPending}
                  data-testid="button-save-evaluation"
                >
                  {createEvaluationMutation.isPending
                    ? t('common.saving', 'جاري الحفظ...')
                    : t('hr.saveEvaluation', 'حفظ التقييم')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
