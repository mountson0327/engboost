import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  /** Nhãn nhỏ phía trên (VD: "Thẻ cần ôn hôm nay") */
  label: string;
  /** Con số / giá trị hiển thị lớn */
  value: string | number;
  /** Dòng chú thích nhỏ phía dưới (tuỳ chọn) */
  hint?: string;
  /** Class bổ sung cho Card ngoài cùng (tuỳ chọn) */
  className?: string;
};

/**
 * Ô thống kê dùng chung cho dashboard (và có thể tái dùng ở trang khác).
 * Tách riêng để dễ tìm chỗ sửa và tái sử dụng.
 */
export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
