type AuthSettings = {
  external?: {
    google?: boolean;
  };
};

export async function isGoogleProviderEnabled() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (!response.ok) return true;
    const settings = (await response.json()) as AuthSettings;
    return settings.external?.google !== false;
  } catch {
    // Do not block sign-in for a temporary settings-endpoint failure.
    return true;
  }
}
