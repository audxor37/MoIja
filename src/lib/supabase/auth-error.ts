export function isMissingRefreshTokenError(error: unknown) {
  const message = getErrorProperty(error, "message");
  const name = getErrorProperty(error, "name");

  return /invalid refresh token|refresh token not found|auth session missing/i.test(message) ||
    /authsessionmissingerror/i.test(name);
}

function getErrorProperty(error: unknown, key: "message" | "name") {
  if (error instanceof Error) {
    return error[key];
  }

  if (typeof error === "object" && error !== null && key in error) {
    return String((error as Record<string, unknown>)[key]);
  }

  return "";
}
