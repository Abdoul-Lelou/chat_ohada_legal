const ADMIN_EMAILS = new Set(['admin@itcs.com', 'admin@itc.com']);

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase();
}

export function isAdminRole(role: string | null | undefined) {
  const normalizedRole = normalize(role);
  return normalizedRole === 'admin' || normalizedRole === 'administrateur';
}

export function canAccessAdmin(options: {
  role?: string | null;
  email?: string | null;
  appMetadataRole?: string | null;
  userMetadataRole?: string | null;
}) {
  const { role, email, appMetadataRole, userMetadataRole } = options;

  return (
    isAdminRole(role) ||
    isAdminRole(appMetadataRole) ||
    isAdminRole(userMetadataRole) ||
    ADMIN_EMAILS.has(normalize(email) ?? '')
  );
}