import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "../../lib/utils";
import { ButtonProps, buttonVariants } from "./button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="{t('components.ui.pagination.label.{t('components.ui.pagination.aria-label.pagination')}')}"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />{t('components.ui.pagination.);_pagination.displayname_=_"pagination";_const_paginationcontent_=_react.forwardref')}<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />{t('components.ui.pagination.));_paginationcontent.displayname_=_"paginationcontent";_const_paginationitem_=_react.forwardref')}<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName={t("components.ui.pagination.name.paginationitem")};

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size">{t('components.ui.pagination.&_react.componentprops')}<"a">;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName={t("components.ui.pagination.name.paginationlink")};

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="{t('components.ui.pagination.label.{t('components.ui.pagination.aria-label.go_to_previous_page')}')}"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className={t("components.ui.pagination.name.h_4_w_4")} />
    <span>{t('components.ui.pagination.previous')}</span>
  </PaginationLink>
);
PaginationPrevious.displayName={t("components.ui.pagination.name.paginationprevious")};

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="{t('components.ui.pagination.label.{t('components.ui.pagination.aria-label.go_to_next_page')}')}"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>{t('components.ui.pagination.next')}</span>
    <ChevronRight className={t("components.ui.pagination.name.h_4_w_4")} />
  </PaginationLink>
);
PaginationNext.displayName={t("components.ui.pagination.name.paginationnext")};

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className={t("components.ui.pagination.name.h_4_w_4")} />
    <span className={t("components.ui.pagination.name.sr_only")}>{t('components.ui.pagination.more_pages')}</span>
  </span>
);
PaginationEllipsis.displayName={t("components.ui.pagination.name.paginationellipsis")};

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
