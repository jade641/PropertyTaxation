import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePermissions } from "../context/PermissionContext";
import { Lock } from "lucide-react";

interface PermissionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  requireWrite?: boolean;
  requireFull?: boolean;
  showLockIcon?: boolean;
}

export default function PermissionButton({
  children,
  requireWrite = false,
  requireFull = false,
  showLockIcon = true,
  disabled,
  className = "",
  ...props
}: PermissionButtonProps) {
  const { currentModulePermission } = usePermissions();

  // Check if user has required permission
  const hasPermission = requireFull
    ? currentModulePermission === "full"
    : requireWrite
    ? currentModulePermission === "write" || currentModulePermission === "full"
    : true;

  const isDisabled = disabled || !hasPermission;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${className} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      } relative`}
      title={
        !hasPermission
          ? "You don't have permission to perform this action"
          : props.title
      }
    >
      {children}
      {!hasPermission && showLockIcon && (
        <Lock className="h-3 w-3 absolute top-1 right-1 text-slate-400" />
      )}
    </button>
  );
}
