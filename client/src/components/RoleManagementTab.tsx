import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { type Role } from "../../../shared/schema";
import { PERMISSIONS, PERMISSION_CATEGORIES, type Permission } from "../../../shared/permissions";
import { Plus, Edit, Trash2, Shield, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function RoleManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newRole, setNewRole] = useState({
    name: "",
    name_ar: "",
    permissions: [] as string[],
  });

  const [editingRole, setEditingRole] = useState<any | null>{t('components.RoleManagementTab.(null);_const_[viewingrole,_setviewingrole]_=_usestate')}<any | null>(null);

  // Use permissions from centralized registry
  const availablePermissions = PERMISSIONS;

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/roles"],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest("/api/roles", {
        method: "POST",
        body: JSON.stringify(roleData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setNewRole({ name: "", name_ar: "", permissions: [] });
      toast({
        title: "تم إنشاء الدور بنجاح",
        description: "تم إضافة الدور الجديد إلى النظام",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء الدور",
        description: "حدث خطأ أثناء إنشاء الدور",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleData }: { id: number; roleData: any }) => {
      return await apiRequest(`/api/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(roleData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setEditingRole(null);
      toast({
        title: "تم تحديث الدور بنجاح",
        description: "تم حفظ التغييرات على الدور",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في تحديث الدور",
        description: "حدث خطأ أثناء تحديث الدور",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/roles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "تم حذف الدور بنجاح",
        description: "تم إزالة الدور من النظام",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف الدور",
        description: "حدث خطأ أثناء حذف الدور",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.name_ar) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم الدور باللغتين العربية والإنجليزية",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate(newRole);
  };

  const handleUpdateRole = () => {
    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        roleData: editingRole,
      });
    }
  };

  const handlePermissionChange = (
    permissionId: string,
    checked: boolean,
    isEditing = false,
  ) => {
    if (isEditing && editingRole) {
      setEditingRole({
        ...editingRole,
        permissions: checked
          ? [...editingRole.permissions, permissionId]
          : editingRole.permissions.filter((p: string) => p !== permissionId),
      });
    } else {
      setNewRole({
        ...newRole,
        permissions: checked
          ? [...newRole.permissions, permissionId]
          : newRole.permissions.filter((p) => p !== permissionId),
      });
    }
  };

  const handleCategoryToggle = (category: string, isEditing = false) => {
    const categoryPermissions = availablePermissions
      .filter(p => p.category === category)
      .map(p => p.id);
    
    const currentPermissions = isEditing ? editingRole?.permissions || [] : newRole.permissions;
    const allSelected = categoryPermissions.every(p => currentPermissions.includes(p));

    if (isEditing && editingRole) {
      if (allSelected) {
        // Remove all category permissions
        setEditingRole({
          ...editingRole,
          permissions: editingRole.permissions.filter(
            (p: string) => !categoryPermissions.includes(p as any)
          ),
        });
      } else {
        // Add all category permissions
        const newPermissions = Array.from(new Set([...editingRole.permissions, ...categoryPermissions]));
        setEditingRole({
          ...editingRole,
          permissions: newPermissions,
        });
      }
    } else {
      if (allSelected) {
        // Remove all category permissions
        setNewRole({
          ...newRole,
          permissions: newRole.permissions.filter(p => !categoryPermissions.includes(p as any)),
        });
      } else {
        // Add all category permissions
        const newPermissions = Array.from(new Set([...newRole.permissions, ...categoryPermissions]));
        setNewRole({
          ...newRole,
          permissions: newPermissions,
        });
      }
    }
  };

  const getCategoryPermissionCount = (category: string, permissions: string[]) => {
    const categoryPermissions = availablePermissions
      .filter(p => p.category === category)
      .map(p => p.id);
    const selectedCount = categoryPermissions.filter(p => permissions.includes(p)).length;
    return { selected: selectedCount, total: categoryPermissions.length };
  };

  const PermissionsEditor = ({ permissions, isEditing }: { permissions: string[], isEditing: boolean }) => (
    <Accordion type="multiple" className={t("components.rolemanagementtab.name.w_full")}>
      {PERMISSION_CATEGORIES.map((category) => {
        const categoryPermissions = availablePermissions.filter(p => p.category === category);
        if (categoryPermissions.length === 0) return null;
        
        const counts = getCategoryPermissionCount(category, permissions);
        const allSelected = counts.selected === counts.total;
        const someSelected = counts.selected >{t('components.RoleManagementTab.0_&&_counts.selected')}< counts.total;

        return (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className={t("components.rolemanagementtab.name.hover_no_underline")}>
              <div className={t("components.rolemanagementtab.name.flex_items_center_gap_3_w_full")}>
                <div className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        const checkbox = el.querySelector('input');
                        if (checkbox) {
                          (checkbox as HTMLInputElement).indeterminate = someSelected;
                        }
                      }
                    }}
                    onCheckedChange={(checked) => {
                      handleCategoryToggle(category, isEditing);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`checkbox-category-${category}`}
                  />
                  <span className={t("components.rolemanagementtab.name.font_medium")}>{category}</span>
                </div>
                <Badge variant={counts.selected > 0 ? "default" : "outline"} className={t("components.rolemanagementtab.name.mr_auto")}>
                  {counts.selected} / {counts.total}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className={t("components.rolemanagementtab.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_3_pt_2_pr_6")}>
                {categoryPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className={t("components.rolemanagementtab.name.flex_items_start_space_x_2_space_x_reverse_p_2_rounded_md_hover_bg_muted_50_transition_colors")}
                  >
                    <Checkbox
                      id={`${isEditing ? 'edit' : 'new'}-${permission.id}`}
                      checked={permissions.includes(permission.id)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(permission.id, checked as boolean, isEditing)
                      }
                      data-testid={`checkbox-permission-${permission.id}`}
                    />
                    <div className={t("components.rolemanagementtab.name.flex_1_space_y_1")}>
                      <label
                        htmlFor={`${isEditing ? 'edit' : 'new'}-${permission.id}`}
                        className={t("components.rolemanagementtab.name.text_sm_font_medium_leading_none_cursor_pointer_peer_disabled_cursor_not_allowed_peer_disabled_opacity_70")}
                      >
                        {permission.name_ar}
                      </label>
                      {permission.description && (
                        <p className={t("components.rolemanagementtab.name.text_xs_text_muted_foreground")}>
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  if (isLoading) {
    return <div className={t("components.rolemanagementtab.name.text_center_py_8")}>{t('components.RoleManagementTab.جاري_تحميل_الأدوار...')}</div>;
  }

  return (
    <div className={t("components.rolemanagementtab.name.space_y_6")}>
      {/* Statistics Cards */}
      <div className={t("components.rolemanagementtab.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
        <Card>
          <CardHeader className={t("components.rolemanagementtab.name.pb_3")}>
            <CardTitle className={t("components.rolemanagementtab.name.text_sm_font_medium")}>{t('components.RoleManagementTab.إجمالي_الأدوار')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("components.rolemanagementtab.name.text_2xl_font_bold")}>{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.rolemanagementtab.name.pb_3")}>
            <CardTitle className={t("components.rolemanagementtab.name.text_sm_font_medium")}>{t('components.RoleManagementTab.إجمالي_الصلاحيات')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("components.rolemanagementtab.name.text_2xl_font_bold")}>{PERMISSIONS.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.rolemanagementtab.name.pb_3")}>
            <CardTitle className={t("components.rolemanagementtab.name.text_sm_font_medium")}>{t('components.RoleManagementTab.فئات_الصلاحيات')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("components.rolemanagementtab.name.text_2xl_font_bold")}>{PERMISSION_CATEGORIES.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Role Section */}
      <Card>
        <CardHeader>
          <CardTitle className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
            <Plus className={t("components.rolemanagementtab.name.w_5_h_5")} />{t('components.RoleManagementTab.إضافة_دور_جديد')}</CardTitle>
          <CardDescription>{t('components.RoleManagementTab.قم_بإنشاء_دور_جديد_وتحديد_صلاحياته_من_القائمة_المنظمة_أدناه')}</CardDescription>
        </CardHeader>
        <CardContent className={t("components.rolemanagementtab.name.space_y_6")}>
          <div className={t("components.rolemanagementtab.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
            <div className={t("components.rolemanagementtab.name.space_y_2")}>
              <Label htmlFor="roleName">{t('components.RoleManagementTab.اسم_الدور_(بالإنجليزية)')}</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole({ ...newRole, name: e.target.value })
                }
                placeholder="{t('components.RoleManagementTab.placeholder.admin,_manager,_operator...')}"
                data-testid="input-role-name"
              />
            </div>
            <div className={t("components.rolemanagementtab.name.space_y_2")}>
              <Label htmlFor="roleNameAr">{t('components.RoleManagementTab.اسم_الدور_(بالعربية)')}</Label>
              <Input
                id="roleNameAr"
                value={newRole.name_ar}
                onChange={(e) =>
                  setNewRole({ ...newRole, name_ar: e.target.value })
                }
                placeholder="{t('components.RoleManagementTab.placeholder.مدير،_مشرف،_مشغل...')}"
                data-testid="input-role-name-ar"
              />
            </div>
          </div>

          <div className={t("components.rolemanagementtab.name.space_y_2")}>
            <div className={t("components.rolemanagementtab.name.flex_items_center_justify_between")}>
              <Label>الصلاحيات ({newRole.permissions.length} محددة)</Label>
              <div className={t("components.rolemanagementtab.name.flex_gap_2")}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setNewRole({
                      ...newRole,
                      permissions: availablePermissions.map((p) => p.id),
                    })
                  }
                  data-testid="button-select-all-new"
                >{t('components.RoleManagementTab.تحديد_الكل')}</Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setNewRole({
                      ...newRole,
                      permissions: [],
                    })
                  }
                  data-testid="button-clear-all-new"
                >{t('components.RoleManagementTab.إلغاء_تحديد_الكل')}</Button>
              </div>
            </div>
            <PermissionsEditor permissions={newRole.permissions} isEditing={false} />
          </div>

          <div className={t("components.rolemanagementtab.name.flex_justify_end")}>
            <Button
              onClick={handleCreateRole}
              disabled={createRoleMutation.isPending}
              className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}
              data-testid="button-create-role"
            >
              {createRoleMutation.isPending ? (
                <>
                  <div className={t("components.rolemanagementtab.name.w_4_h_4_border_2_border_white_border_t_transparent_rounded_full_animate_spin")} />{t('components.RoleManagementTab.جاري_الإضافة...')}</>{t('components.RoleManagementTab.)_:_(')}<>
                  <Plus className={t("components.rolemanagementtab.name.w_4_h_4")} />{t('components.RoleManagementTab.إضافة_الدور')}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
            <Shield className={t("components.rolemanagementtab.name.w_5_h_5")} />{t('components.RoleManagementTab.الأدوار_الموجودة')}</CardTitle>
          <CardDescription>{t('components.RoleManagementTab.عرض_وإدارة_جميع_الأدوار_المعرفة_في_النظام')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('components.RoleManagementTab.الرقم')}</TableHead>
                <TableHead>{t('components.RoleManagementTab.اسم_الدور')}</TableHead>
                <TableHead>{t('components.RoleManagementTab.الاسم_بالعربية')}</TableHead>
                <TableHead>{t('components.RoleManagementTab.الصلاحيات')}</TableHead>
                <TableHead>{t('components.RoleManagementTab.الإجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(roles as any[]).map((role: any) => (
                <TableRow key={role.id} data-testid={`row-role-${role.id}`}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={t("components.rolemanagementtab.name.font_medium")}>{role.name_ar}</span>
                  </TableCell>
                  <TableCell>
                    <div className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
                      <Badge variant="secondary">
                        {role.permissions?.length || 0} صلاحية
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingRole(role)}
                            className={t("components.rolemanagementtab.name.h_8_px_2_text_xs")}
                            data-testid={`button-view-permissions-${role.id}`}
                          >{t('components.RoleManagementTab.عرض_التفاصيل')}</Button>
                        </DialogTrigger>
                        <DialogContent className={t("components.rolemanagementtab.name.max_w_4xl_max_h_80vh_overflow_y_auto")}>
                          <DialogHeader>
                            <DialogTitle>صلاحيات الدور: {role.name_ar}</DialogTitle>
                            <DialogDescription>
                              عرض جميع الصلاحيات المخصصة لهذا الدور ({role.permissions?.length || 0} صلاحية)
                            </DialogDescription>
                          </DialogHeader>
                          <div className={t("components.rolemanagementtab.name.space_y_4_mt_4")}>
                            {PERMISSION_CATEGORIES.map((category) => {
                              const categoryPerms = availablePermissions
                                .filter(p =>{t('components.RoleManagementTab.p.category_===_category_&&_role.permissions?.includes(p.id));_if_(categoryperms.length_===_0)_return_null;_return_(')}<div key={category} className={t("components.rolemanagementtab.name.space_y_2")}>
                                  <div className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
                                    <h4 className={t("components.rolemanagementtab.name.font_medium")}>{category}</h4>
                                    <Badge variant="outline">{categoryPerms.length}</Badge>
                                  </div>
                                  <div className={t("components.rolemanagementtab.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_2_pr_4")}>
                                    {categoryPerms.map((perm) => (
                                      <div key={perm.id} className={t("components.rolemanagementtab.name.flex_items_center_gap_2_text_sm_p_2_bg_muted_50_rounded")}>
                                        <Check className={t("components.rolemanagementtab.name.w_4_h_4_text_green_600")} />
                                        <span>{perm.name_ar}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRole({ ...role })}
                        className={t("components.rolemanagementtab.name.flex_items_center_gap_1")}
                        data-testid={`button-edit-role-${role.id}`}
                      >
                        <Edit className={t("components.rolemanagementtab.name.w_3_h_3")} />{t('components.RoleManagementTab.تعديل')}</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الدور "${role.name_ar}"؟`)) {
                            deleteRoleMutation.mutate(role.id);
                          }
                        }}
                        disabled={deleteRoleMutation.isPending}
                        className={t("components.rolemanagementtab.name.flex_items_center_gap_1")}
                        data-testid={`button-delete-role-${role.id}`}
                      >
                        <Trash2 className={t("components.rolemanagementtab.name.w_3_h_3")} />{t('components.RoleManagementTab.حذف')}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(roles as any[]).length === 0 && (
            <div className={t("components.rolemanagementtab.name.text_center_py_8_text_muted_foreground")}>{t('components.RoleManagementTab.لا_توجد_أدوار_محددة_في_النظام')}</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      {editingRole && (
        <Card className={t("components.rolemanagementtab.name.border_2_border_primary")}>
          <CardHeader>
            <CardTitle className={t("components.rolemanagementtab.name.flex_items_center_justify_between")}>
              <div className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}>
                <Shield className={t("components.rolemanagementtab.name.w_5_h_5")} />
                تعديل الدور: {editingRole.name_ar}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingRole(null)}
                data-testid="button-cancel-edit"
              >
                <X className={t("components.rolemanagementtab.name.w_4_h_4")} />
              </Button>
            </CardTitle>
            <CardDescription>{t('components.RoleManagementTab.قم_بتعديل_بيانات_الدور_وصلاحياته')}</CardDescription>
          </CardHeader>
          <CardContent className={t("components.rolemanagementtab.name.space_y_6")}>
            <div className={t("components.rolemanagementtab.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
              <div className={t("components.rolemanagementtab.name.space_y_2")}>
                <Label htmlFor="editRoleName">{t('components.RoleManagementTab.اسم_الدور_(بالإنجليزية)')}</Label>
                <Input
                  id="editRoleName"
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole({
                      ...editingRole,
                      name: e.target.value,
                    })
                  }
                  data-testid="input-edit-role-name"
                />
              </div>
              <div className={t("components.rolemanagementtab.name.space_y_2")}>
                <Label htmlFor="editRoleNameAr">{t('components.RoleManagementTab.اسم_الدور_(بالعربية)')}</Label>
                <Input
                  id="editRoleNameAr"
                  value={editingRole.name_ar}
                  onChange={(e) =>
                    setEditingRole({
                      ...editingRole,
                      name_ar: e.target.value,
                    })
                  }
                  data-testid="input-edit-role-name-ar"
                />
              </div>
            </div>

            <div className={t("components.rolemanagementtab.name.space_y_2")}>
              <div className={t("components.rolemanagementtab.name.flex_items_center_justify_between")}>
                <Label>الصلاحيات ({editingRole.permissions?.length || 0} محددة)</Label>
                <div className={t("components.rolemanagementtab.name.flex_gap_2")}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingRole({
                        ...editingRole,
                        permissions: availablePermissions.map((p) => p.id),
                      })
                    }
                    data-testid="button-select-all-edit"
                  >{t('components.RoleManagementTab.تحديد_الكل')}</Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingRole({
                        ...editingRole,
                        permissions: [],
                      })
                    }
                    data-testid="button-clear-all-edit"
                  >{t('components.RoleManagementTab.إلغاء_تحديد_الكل')}</Button>
                </div>
              </div>
              <PermissionsEditor permissions={editingRole.permissions || []} isEditing={true} />
            </div>

            <div className={t("components.rolemanagementtab.name.flex_justify_end_gap_2")}>
              <Button
                variant="outline"
                onClick={() => setEditingRole(null)}
                data-testid="button-cancel-edit-bottom"
              >{t('components.RoleManagementTab.إلغاء')}</Button>
              <Button
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending}
                className={t("components.rolemanagementtab.name.flex_items_center_gap_2")}
                data-testid="button-save-role"
              >
                {updateRoleMutation.isPending ? (
                  <>
                    <div className={t("components.rolemanagementtab.name.w_4_h_4_border_2_border_white_border_t_transparent_rounded_full_animate_spin")} />{t('components.RoleManagementTab.جاري_الحفظ...')}</>{t('components.RoleManagementTab.)_:_(')}<>
                    <Check className={t("components.rolemanagementtab.name.w_4_h_4")} />{t('components.RoleManagementTab.حفظ_التغييرات')}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
