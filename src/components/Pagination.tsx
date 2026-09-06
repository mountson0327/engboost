"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

/** Simple centered prev/next pager. Renders nothing when there's one page. */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹ {t("common.prev")}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("common.pageOf", { page, total: totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {t("common.next")} ›
      </Button>
    </div>
  );
}
