import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  getModulePermission,
  canWrite,
  canFullAccess,
  isReadOnly,
  type PermissionLevel,
} from "../config/roleConfig";

interface PermissionContextType {
  getPermission: (modulePath: string) => PermissionLevel;
  canWrite: (modulePath: string) => boolean;
  canFullAccess: (modulePath: string) => boolean;
  isReadOnly: (modulePath: string) => boolean;
  currentModulePermission: PermissionLevel;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  const { user } = useAuth();

  const getPermission = (modulePath: string): PermissionLevel => {
    if (!user) return "none";
    return getModulePermission(user.role, modulePath);
  };

  const currentModulePermission = getPermission(currentPath);

  const contextValue: PermissionContextType = {
    getPermission,
    canWrite: (modulePath: string) => canWrite(getPermission(modulePath)),
    canFullAccess: (modulePath: string) => canFullAccess(getPermission(modulePath)),
    isReadOnly: (modulePath: string) => isReadOnly(getPermission(modulePath)),
    currentModulePermission,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
