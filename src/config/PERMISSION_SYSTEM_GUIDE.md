# Permission System Guide

## Overview

This guide explains how to use the new role-based permission system in the TaxSync application.

## Architecture

### 1. **Role Configuration** (`roleConfig.ts`)
Centralized configuration for all roles and their module access.

### 2. **Permission Context** (`PermissionContext.tsx`)
Provides permission checking throughout the application.

### 3. **Protected Routes** (`ProtectedRoute.tsx`)
Prevents unauthorized URL access.

### 4. **Permission Components**
- `PermissionButton` - Buttons that respect permissions
- `PermissionForm` - Forms that prevent unauthorized submissions

---

## Usage Examples

### 1. Using PermissionButton

```tsx
import PermissionButton from "../components/PermissionButton";

function MyComponent() {
  return (
    <div>
      {/* Button requires write permission */}
      <PermissionButton
        requireWrite
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Save Changes
      </PermissionButton>

      {/* Button requires full permission (Admin only) */}
      <PermissionButton
        requireFull
        onClick={handleDelete}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Delete Property
      </PermissionButton>
    </div>
  );
}
```

### 2. Using PermissionForm

```tsx
import PermissionForm from "../components/PermissionForm";

function PropertyForm() {
  const handleSubmit = (e: React.FormEvent) => {
    // This will only execute if user has write permission
    console.log("Form submitted");
  };

  return (
    <PermissionForm
      requireWrite
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input type="text" name="propertyName" />
      <button type="submit">Submit</button>
    </PermissionForm>
  );
}
```

### 3. Using Permission Context

```tsx
import { usePermissions } from "../context/PermissionContext";

function MyComponent() {
  const { currentModulePermission, canWrite, isReadOnly } = usePermissions();

  return (
    <div>
      {currentModulePermission === "full" && (
        <button>Admin Only Action</button>
      )}

      {canWrite("/app/property-registration") && (
        <button>Edit Property</button>
      )}

      {isReadOnly("/app") && (
        <div className="alert">You have read-only access</div>
      )}
    </div>
  );
}
```

### 4. Protected Routes

```tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/app" element={<AppLayout />}>
        {/* Protected route - checks if user has access */}
        <Route
          path="property-registration"
          element={
            <ProtectedRoute requiredPath="/app/property-registration">
              <PropertyRegistration />
            </ProtectedRoute>
          }
        />

        {/* Admin-only route */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredPath="/app/users">
              <UserManagement />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
```

---

## Permission Levels

| Level | Description | Can View | Can Edit | Can Delete |
|-------|-------------|----------|----------|------------|
| `none` | No access | ❌ | ❌ | ❌ |
| `read` | Read-only | ✅ | ❌ | ❌ |
| `write` | Can create/edit | ✅ | ✅ | ❌ |
| `full` | Full CRUD | ✅ | ✅ | ✅ |

---

## Role Permissions

### Admin
- **Access Level**: 4/4
- **Permissions**: Full access to all modules
- All modules have `full` permission

### Accountant
- **Access Level**: 3/4
- **Full Access**: Tax Calculation, Payment Management, Govt Reporting
- **Read-Only**: Dashboard, Property Registry, Compliance, Audit Support

### Auditor
- **Access Level**: 2/4
- **Read-Only**: All accessible modules
- Cannot modify any data

### Staff
- **Access Level**: 2/4
- **Full Access**: Property Registry
- **Write Access**: Tax Calculation, Filing & Docs
- **Read-Only**: Dashboard, Payment Management, Compliance, Govt Reporting

---

## Adding New Modules

1. **Update `roleConfig.ts`**:

```typescript
export const roleModules: Record<string, RoleConfig> = {
  Admin: {
    modules: [
      // ... existing modules
      {
        name: "New Module",
        path: "/app/new-module",
        icon: NewIcon,
        description: "Module description",
        permission: "full",
      },
    ],
  },
  // ... other roles
};
```

2. **Create the route** with protection:

```tsx
<Route
  path="new-module"
  element={
    <ProtectedRoute requiredPath="/app/new-module">
      <NewModule />
    </ProtectedRoute>
  }
/>
```

3. **Use permission components** in your page:

```tsx
function NewModule() {
  return (
    <div>
      <h1>New Module</h1>
      
      <PermissionForm requireWrite onSubmit={handleSubmit}>
        {/* Form fields */}
      </PermissionForm>

      <PermissionButton requireFull onClick={handleDelete}>
        Delete
      </PermissionButton>
    </div>
  );
}
```

---

## Helper Functions

### From `roleConfig.ts`:

```typescript
// Get role configuration
const config = getRoleConfig("Admin");

// Check if user has access to a module
const hasAccess = hasModuleAccess("Auditor", "/app/users"); // false

// Get permission level for a module
const permission = getModulePermission("Staff", "/app/property-registration"); // "full"

// Check if user can write
const canWrite = canWrite("write"); // true

// Check if user has full access
const canFullAccess = canFullAccess("read"); // false

// Check if user is read-only
const isReadOnly = isReadOnly("read"); // true
```

---

## Best Practices

1. **Always use ProtectedRoute** for routes that require specific access
2. **Use PermissionButton** for action buttons (Save, Delete, Edit)
3. **Use PermissionForm** for forms that modify data
4. **Check permissions** before showing UI elements
5. **Provide feedback** to users when they don't have permission
6. **Test with different roles** to ensure proper access control

---

## Testing

Test your components with different roles:

```tsx
// In your test file
import { render } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";

test("Admin can see delete button", () => {
  const { getByText } = render(
    <AuthProvider initialUser={{ role: "Admin" }}>
      <MyComponent />
    </AuthProvider>
  );
  
  expect(getByText("Delete")).toBeInTheDocument();
});

test("Auditor cannot see delete button", () => {
  const { queryByText } = render(
    <AuthProvider initialUser={{ role: "Auditor" }}>
      <MyComponent />
    </AuthProvider>
  );
  
  expect(queryByText("Delete")).not.toBeInTheDocument();
});
```

---

## Troubleshooting

### Button is disabled but should be enabled
- Check the `currentModulePermission` in the component
- Verify the role configuration in `roleConfig.ts`
- Ensure you're using the correct `requireWrite` or `requireFull` prop

### User can access route via URL
- Make sure you wrapped the route with `ProtectedRoute`
- Verify the `requiredPath` matches the module path in `roleConfig.ts`

### Permission context not working
- Ensure `PermissionProvider` wraps your component tree
- Check that `currentPath` is being passed correctly

---

## Migration from Old System

If you're migrating from the old permission system:

1. Remove old `hasPermission` checks
2. Replace with `usePermissions` hook
3. Update buttons to use `PermissionButton`
4. Update forms to use `PermissionForm`
5. Add `ProtectedRoute` to all routes
6. Test thoroughly with all roles

---

**Version**: 1.0.0  
**Last Updated**: May 3, 2026
