import { useEffect, useState } from 'react';
import { Image } from 'react-native';

interface UseImageLoadingReturn {
	isLoading: boolean;
	isError: boolean;
	retry: () => void;
}

/**
 * Custom hook para pre-cargar imágenes con indicador de estado
 */
export const useImageLoading = (uri: string | null | undefined): UseImageLoadingReturn => {
	const [isLoading, setIsLoading] = useState(true);
	const [isError, setIsError] = useState(false);
	const [retryKey, setRetryKey] = useState(0);

	useEffect(() => {
		if (!uri) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setIsError(false);

		// Pre-cargar imagen
		Image.prefetch(uri)
			.then(() => {
				setIsLoading(false);
				setIsError(false);
			})
			.catch((error) => {
				console.error('Error loading image:', error);
				setIsLoading(false);
				setIsError(true);
			});
	}, [uri, retryKey]);

	const retry = () => {
		setRetryKey((prev) => prev + 1);
	};

	return { isLoading, isError, retry };
};

/**
 * Custom hook para cargar múltiples imágenes en paralelo
 */
export const useBatchImageLoading = (uris: (string | null)[]): UseImageLoadingReturn => {
	const [isLoading, setIsLoading] = useState(true);
	const [isError, setIsError] = useState(false);
	const [retryKey, setRetryKey] = useState(0);

	useEffect(() => {
		const validUris = uris.filter((uri): uri is string => Boolean(uri));

		if (validUris.length === 0) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setIsError(false);

		// Cargar todas las imágenes en paralelo
		Promise.all(validUris.map((uri) => Image.prefetch(uri)))
			.then(() => {
				setIsLoading(false);
				setIsError(false);
			})
			.catch((error) => {
				console.error('Error loading batch images:', error);
				setIsLoading(false);
				setIsError(true);
			});
	}, [JSON.stringify(uris), retryKey]);

	const retry = () => {
		setRetryKey((prev) => prev + 1);
	};

	return { isLoading, isError, retry };
};

/**
 * Custom hook para lazy loading con threshold de visibilidad
 */
export const useLazyImage = (
	uri: string | null | undefined,
	shouldLoad: boolean = true
): UseImageLoadingReturn => {
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [retryKey, setRetryKey] = useState(0);

	useEffect(() => {
		if (!uri || !shouldLoad) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setIsError(false);

		Image.prefetch(uri)
			.then(() => {
				setIsLoading(false);
				setIsError(false);
			})
			.catch((error) => {
				console.error('Error lazy loading image:', error);
				setIsLoading(false);
				setIsError(true);
			});
	}, [uri, shouldLoad, retryKey]);

	const retry = () => {
		setRetryKey((prev) => prev + 1);
	};

	return { isLoading, isError, retry };
};
