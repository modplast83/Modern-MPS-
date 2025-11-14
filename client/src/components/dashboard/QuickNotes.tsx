import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Plus,
  AlertCircle,
  Package,
  Palette,
  FileText,
  DollarSign,
  Truck,
  Phone,
  MoreHorizontal,
  Trash2,
  Eye,
  Paperclip,
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "../../lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface QuickNote {
  id: number;
  content: string;
  note_type: string;
  priority: string;
  created_by: number;
  assigned_to: number;
  is_read: boolean;
  created_at: string;
  creator_name: string;
  assignee_name: string;
  attachments?: any[];
}

const noteTypeConfig = {
  order: { key: "order", icon: Package, color: "bg-blue-100 text-blue-700 border-blue-300" },
  design: { key: "design", icon: Palette, color: "bg-purple-100 text-purple-700 border-purple-300" },
  statement: { key: "statement", icon: FileText, color: "bg-green-100 text-green-700 border-green-300" },
  quote: { key: "quote", icon: DollarSign, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  delivery: { key: "delivery", icon: Truck, color: "bg-orange-100 text-orange-700 border-orange-300" },
  call_customer: { key: "callCustomer", icon: Phone, color: "bg-pink-100 text-pink-700 border-pink-300" },
  other: { key: "other", icon: MoreHorizontal, color: "bg-gray-100 text-gray-700 border-gray-300" },
};

const priorityConfig = {
  low: { key: "low", color: "bg-gray-50 border-gray-200" },
  normal: { key: "normal", color: "bg-blue-50 border-blue-200" },
  high: { key: "high", color: "bg-orange-50 border-orange-200" },
  urgent: { key: "urgent", color: "bg-red-50 border-red-300 shadow-md" },
};

export default function QuickNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    content: "",
    note_type: "other",
    priority: "normal",
    assigned_to: 0,
  });

  // Update assigned_to when user is loaded
  useEffect(() => {
    if (user?.id && newNote.assigned_to === 0) {
      setNewNote(prev => ({ ...prev, assigned_to: user.id }));
    }
  }, [user?.id, newNote.assigned_to]);

  // Fetch quick notes for current user
  const { data: notes = [], isLoading } = useQuery<QuickNote[]>({
    queryKey: ["/api/quick-notes"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      return await apiRequest("/api/quick-notes", {
        method: "POST",
        body: JSON.stringify(noteData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-notes"] });
      toast({
        title: t('quickNotes.noteCreated'),
        description: t('quickNotes.noteCreatedSuccess'),
      });
      setIsModalOpen(false);
      setNewNote({
        content: "",
        note_type: "other",
        priority: "normal",
        assigned_to: user?.id || 0,
      });
    },
    onError: (error: any) => {
      toast({
        title: t('quickNotes.error'),
        description: error.message || t('quickNotes.createFailed'),
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest(`/api/quick-notes/${noteId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-notes"] });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest(`/api/quick-notes/${noteId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-notes"] });
      toast({
        title: t('quickNotes.deleted'),
        description: t('quickNotes.deletedSuccess'),
      });
    },
  });

  const handleCreateNote = () => {
    if (!newNote.content.trim()) {
      toast({
        title: t('quickNotes.error'),
        description: t('quickNotes.contentRequired'),
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate(newNote);
  };

  // Filter notes assigned to current user and unread notes
  const userNotes = notes.filter(
    (note) => note.assigned_to === user?.id || note.created_by === user?.id
  );
  const unreadNotes = userNotes.filter((note) =>{t('components.dashboard.QuickNotes.!note.is_read);_return_(')}<Card className={t("components.dashboard.quicknotes.name.shadow_lg")} data-testid="card-quick-notes">
      <CardHeader className={t("components.dashboard.quicknotes.name.flex_flex_row_items_center_justify_between_pb_3")}>
        <div className={t("components.dashboard.quicknotes.name.flex_items_center_gap_2")}>
          <AlertCircle className={t("components.dashboard.quicknotes.name.w_5_h_5_text_blue_600")} />
          <CardTitle className={t("components.dashboard.quicknotes.name.text_lg_font_bold")}>{t('quickNotes.title')}</CardTitle>
          {unreadNotes.length >{t('components.dashboard.QuickNotes.0_&&_(')}<span className={t("components.dashboard.quicknotes.name.bg_red_500_text_white_text_xs_font_bold_px_2_py_1_rounded_full")}>
              {unreadNotes.length}
            </span>
          )}
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className={t("components.dashboard.quicknotes.name.gap_2")} data-testid="button-add-note">
              <Plus className={t("components.dashboard.quicknotes.name.w_4_h_4")} />
              {t('quickNotes.addNote')}
            </Button>
          </DialogTrigger>
          <DialogContent className={t("components.dashboard.quicknotes.name.sm_max_w_500px_")}>
            <DialogHeader>
              <DialogTitle>{t('quickNotes.newNote')}</DialogTitle>
            </DialogHeader>
            <div className={t("components.dashboard.quicknotes.name.space_y_4_py_4")}>
              <div>
                <Label>{t('quickNotes.noteType')}</Label>
                <Select
                  value={newNote.note_type}
                  onValueChange={(value) =>
                    setNewNote({ ...newNote, note_type: value })
                  }
                >
                  <SelectTrigger data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(noteTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className={t("components.dashboard.quicknotes.name.flex_items_center_gap_2")}>
                          <config.icon className={t("components.dashboard.quicknotes.name.w_4_h_4")} />
                          {t(`quickNotes.types.${config.key}`)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('quickNotes.priority')}</Label>
                <Select
                  value={newNote.priority}
                  onValueChange={(value) =>
                    setNewNote({ ...newNote, priority: value })
                  }
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {t(`quickNotes.priorities.${config.key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('quickNotes.assignTo')}</Label>
                <Select
                  value={newNote.assigned_to.toString()}
                  onValueChange={(value) =>
                    setNewNote({ ...newNote, assigned_to: parseInt(value) })
                  }
                >
                  <SelectTrigger data-testid="select-assigned-to">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.display_name || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('quickNotes.content')}</Label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  placeholder={t('quickNotes.placeholder')}
                  className={t("components.dashboard.quicknotes.name.min_h_100px_")}
                  data-testid="textarea-note-content"
                />
              </div>

              <div className={t("components.dashboard.quicknotes.name.flex_justify_end_gap_2")}>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  data-testid="button-cancel"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateNote}
                  disabled={createNoteMutation.isPending}
                  data-testid="button-save-note"
                >
                  {createNoteMutation.isPending ? t('dashboard.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className={t("components.dashboard.quicknotes.name.space_y_3_max_h_500px_overflow_y_auto")}>
        {isLoading ? (
          <div className={t("components.dashboard.quicknotes.name.text_center_py_4_text_gray_500")}>{t('quickNotes.loading')}</div>{t('components.dashboard.QuickNotes.)_:_usernotes.length_===_0_?_(')}<div className={t("components.dashboard.quicknotes.name.text_center_py_8_text_gray_500")}>
            {t('quickNotes.noNotes')}
          </div>
        ) : (
          userNotes.map((note) => {
            const typeConfig = noteTypeConfig[note.note_type as keyof typeof noteTypeConfig] || noteTypeConfig.other;
            const priorityStyle = priorityConfig[note.priority as keyof typeof priorityConfig] || priorityConfig.normal;
            const Icon = typeConfig.icon;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-lg border-2 ${priorityStyle.color} ${!note.is_read ? "ring-2 ring-blue-400" : ""}`}
                data-testid={`note-${note.id}`}
              >
                <div className={t("components.dashboard.quicknotes.name.flex_items_start_justify_between_gap_3")}>
                  <div className={t("components.dashboard.quicknotes.name.flex_1")}>
                    <div className={t("components.dashboard.quicknotes.name.flex_items_center_gap_2_mb_2")}>
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <Icon className={t("components.dashboard.quicknotes.name.w_4_h_4")} />
                      </div>
                      <span className={t("components.dashboard.quicknotes.name.text_xs_font_semibold_px_2_py_1_rounded_bg_gray_100")}>
                        {t(`quickNotes.types.${typeConfig.key}`)}
                      </span>
                      {!note.is_read && (
                        <span className={t("components.dashboard.quicknotes.name.text_xs_font_bold_text_blue_600")}>
                          {t('quickNotes.new')}
                        </span>
                      )}
                    </div>
                    <p className={t("components.dashboard.quicknotes.name.font_bold_text_gray_900_mb_2_whitespace_pre_wrap")}>
                      {note.content}
                    </p>
                    <div className={t("components.dashboard.quicknotes.name.flex_items_center_gap_3_text_xs_text_gray_600")}>
                      <span>{t('quickNotes.from')}: {note.creator_name}</span>
                      <span>•</span>
                      <span>{t('quickNotes.to')}: {note.assignee_name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </span>
                      {note.attachments && note.attachments.length >{t('components.dashboard.QuickNotes.0_&&_(')}<>
                          <span>•</span>
                          <span className={t("components.dashboard.quicknotes.name.flex_items_center_gap_1")}>
                            <Paperclip className={t("components.dashboard.quicknotes.name.w_3_h_3")} />
                            {note.attachments.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={t("components.dashboard.quicknotes.name.flex_gap_1")}>
                    {!note.is_read && note.assigned_to === user?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(note.id)}
                        data-testid={`button-mark-read-${note.id}`}
                      >
                        <Eye className={t("components.dashboard.quicknotes.name.w_4_h_4")} />
                      </Button>
                    )}
                    {(note.created_by === user?.id || user?.role_id === 1) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        data-testid={`button-delete-${note.id}`}
                      >
                        <Trash2 className={t("components.dashboard.quicknotes.name.w_4_h_4_text_red_600")} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
