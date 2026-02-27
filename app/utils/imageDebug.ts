/**
 * Utilidad para debuggear problemas con imágenes
 */

export const testFirebaseImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        Accept: "image/*",
      },
    });

    if (__DEV__) {
      console.log("Image URL test:", {
        url: url.substring(0, 100),
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
      });
    }

    return response.ok;
  } catch (error) {
    if (__DEV__) {
      console.error("Image URL test failed:", {
        url: url.substring(0, 100),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return false;
  }
};

export const validateImageUrls = async (
  urls: string[],
): Promise<{ valid: string[]; invalid: string[] }> => {
  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      valid: await testFirebaseImageUrl(url),
    })),
  );

  return {
    valid: results.filter((r) => r.valid).map((r) => r.url),
    invalid: results.filter((r) => !r.valid).map((r) => r.url),
  };
};
