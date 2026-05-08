import type { FormEvent, FormHTMLAttributes, ReactNode } from "react";
import { usePermissions } from "../context/PermissionContext";
import { AlertTriangle } from "lucide-react";

type PermissionFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  children: ReactNode;
  requireWrite?: boolean;
  requireFull?: boolean;
  showWarning?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export default function PermissionForm({
  children,
  requireWrite = true,
  requireFull = false,
  showWarning = true,
  onSubmit,
  className = "",
  ...props
}: PermissionFormProps) {
  const { currentModulePermission, isReadOnly } = usePermissions();

  // Check if user has required permission
  const hasPermission = requireFull
    ? currentModulePermission === "full"
    : requireWrite
    ? currentModulePermission === "write" || currentModulePermission === "full"
    : true;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent submission if user doesn't have permission
    if (!hasPermission) {
      return;
    }

    onSubmit?.(e);
  };

  return (
    <div className="relative">
      {/* Read-only warning banner */}
      {showWarning && isReadOnly("/app") && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Read-Only Access</p>
            <p className="text-xs text-amber-600 mt-0.5">
              You can view this information but cannot make changes. Contact an administrator if you need write access.
            </p>
          </div>
        </div>
      )}

      <form
        {...props}
        onSubmit={handleSubmit}
        className={`${className} ${!hasPermission ? "pointer-events-none opacity-60" : ""}`}
      >
        {children}
      </form>
    </div>
  );
}
