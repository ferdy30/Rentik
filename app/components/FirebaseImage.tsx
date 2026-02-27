import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Image as RNImage,
    ImageProps as RNImageProps,
    StyleSheet,
    View,
} from "react-native";

interface FirebaseImageProps extends Omit<RNImageProps, "source"> {
  uri: string;
  style?: any;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}

/**
 * Componente optimizado para cargar imágenes de Firebase Storage
 * Usa expo-image para mejor rendimiento y soporte de caché
 * Incluye manejo de errores y retry automático con estrategia específica para iOS
 */
export default function FirebaseImage({
  uri,
  style,
  resizeMode = "cover",
  onLoad,
  onError,
  ...props
}: FirebaseImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageUri, setImageUri] = useState(uri);
  const [useNativeFallback, setUseNativeFallback] = useState(false);

  const MAX_RETRIES = Platform.OS === "ios" ? 3 : 2; // Más reintentos en iOS

  // Validar que la URI sea válida
  const isValidUri =
    uri &&
    typeof uri === "string" &&
    uri.trim().length > 0 &&
    (uri.startsWith("http://") || uri.startsWith("https://"));
  const isFirebaseUrl =
    isValidUri &&
    (uri.includes("firebasestorage.googleapis.com") ||
      uri.includes("firebasestorage.app"));
  const placeholderUrl = "https://via.placeholder.com/400x300?text=No+Image";

  const sanitizeFirebaseUrl = (input: string) => {
    let result = input.trim();
    // Remover ? o & al final
    result = result.replace(/[?&]$/, "");

    // Si hay query inválida (sin '='), removerla
    const queryIndex = result.indexOf("?");
    if (queryIndex !== -1) {
      const query = result.slice(queryIndex + 1);
      if (!query.includes("=")) {
        result = result.slice(0, queryIndex);
      }
    }

    return result;
  };

  const ensureAltMedia = (input: string) => {
    if (!input.includes("alt=media")) {
      return input.includes("?") ? `${input}&alt=media` : `${input}?alt=media`;
    }
    return input;
  };

  const stripToken = (input: string) => {
    try {
      const urlObj = new URL(input);
      urlObj.searchParams.delete("token");
      urlObj.searchParams.delete("_retry");
      return urlObj.toString();
    } catch {
      return input;
    }
  };

  const swapBucketDomain = (input: string) => {
    if (!input.includes("firebasestorage.app")) return input;
    return input.replace("firebasestorage.app", "appspot.com");
  };

  const buildFirebaseUrl = (input: string) => {
    const sanitized = sanitizeFirebaseUrl(input);
    return ensureAltMedia(sanitized);
  };

  // Si la URI cambia, resetear estado
  useEffect(() => {
    const normalized = isFirebaseUrl ? buildFirebaseUrl(uri) : uri;
    setImageUri(normalized);
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
    setUseNativeFallback(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, isFirebaseUrl]); // buildFirebaseUrl es una función pura, no necesita estar en dependencias

  // Si la URI no es válida, mostrar placeholder directamente
  if (!isValidUri) {
    return (
      <RNImage
        source={{ uri: placeholderUrl }}
        style={style}
        resizeMode={resizeMode}
      />
    );
  }

  const handleLoad = (event: any) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(event);
  };

  const handleError = (event: any) => {
    setIsLoading(false);

    // Log para debugging en desarrollo
    if (__DEV__) {
      console.log("FirebaseImage: Error loading image", {
        uri: imageUri.substring(0, 150),
        fullUri: imageUri,
        isFirebaseUrl,
        retryCount,
        platform: Platform.OS,
        hasAltMedia: imageUri.includes("alt=media"),
        hasToken: imageUri.includes("token="),
      });
    }

    // Intentar retry con backoff exponencial
    if (retryCount < MAX_RETRIES && isFirebaseUrl) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 4000); // max 4 segundos

      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setIsLoading(true);
        const baseUrl = buildFirebaseUrl(uri);

        // Estrategia de fallback:
        // 0 -> quitar token (si existe)
        // 1 -> swap bucket .firebasestorage.app -> .appspot.com
        // 2 -> cache-busting con _retry
        let nextUrl = baseUrl;

        if (retryCount === 0) {
          nextUrl = ensureAltMedia(stripToken(baseUrl));
        } else if (retryCount === 1) {
          nextUrl = ensureAltMedia(stripToken(swapBucketDomain(baseUrl)));
        } else {
          nextUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}_retry=${Date.now()}`;
        }

        setImageUri(nextUrl);
      }, delay);
    } else {
      setHasError(true);
      if (Platform.OS === "ios") {
        setUseNativeFallback(true);
      }
      onError?.(event);
    }
  };

  // Si hay error después de los reintentos, mostrar placeholder
  if (hasError) {
    return (
      <RNImage
        source={{ uri: placeholderUrl }}
        style={style}
        resizeMode={resizeMode}
      />
    );
  }

  if (isFirebaseUrl && !useNativeFallback) {
    return (
      <View style={style}>
        <ExpoImage
          key={`${retryCount}-${imageUri}`}
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          contentFit={resizeMode}
          cachePolicy={Platform.OS === "ios" ? "disk" : "memory-disk"}
          transition={300}
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          onLoad={handleLoad}
          onError={handleError}
          recyclingKey={imageUri}
          priority="high"
          {...props}
        />
        {isLoading && (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator size="small" color="#3B82F6" />
          </View>
        )}
      </View>
    );
  }

  // Para URLs no-Firebase (placeholders, etc), usar Image nativo
  return (
    <RNImage
      source={{
        uri: imageUri || uri,
        cache: "reload",
        headers: {
          "Cache-Control": "no-cache",
        },
      }}
      style={style}
      resizeMode={resizeMode}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
});
