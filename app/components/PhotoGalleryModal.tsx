import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PhotoGalleryModalProps {
	visible: boolean;
	photos: (string | null)[];
	currentIndex?: number;
	onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
	visible,
	photos,
	currentIndex = 0,
	onClose,
}) => {
	const [selectedIndex, setSelectedIndex] = useState(currentIndex);
	const validPhotos = photos.filter((p): p is string => p !== null);

	if (validPhotos.length === 0) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Text style={styles.photoCount}>
							{selectedIndex + 1} / {validPhotos.length}
						</Text>
					</View>
					<TouchableOpacity style={styles.closeButton} onPress={onClose}>
						<Ionicons name="close" size={28} color="white" />
					</TouchableOpacity>
				</View>

				{/* Main Image */}
				<View style={styles.mainImageContainer}>
					<Image
						source={{ uri: validPhotos[selectedIndex] }}
						style={styles.mainImage}
						resizeMode="contain"
					/>
				</View>

				{/* Navigation Arrows */}
				{validPhotos.length > 1 && (
					<>
						{selectedIndex > 0 && (
							<TouchableOpacity
								style={[styles.navButton, styles.navButtonLeft]}
								onPress={() => setSelectedIndex(selectedIndex - 1)}
							>
								<Ionicons name="chevron-back" size={32} color="white" />
							</TouchableOpacity>
						)}
						{selectedIndex < validPhotos.length - 1 && (
							<TouchableOpacity
								style={[styles.navButton, styles.navButtonRight]}
								onPress={() => setSelectedIndex(selectedIndex + 1)}
							>
								<Ionicons name="chevron-forward" size={32} color="white" />
							</TouchableOpacity>
						)}
					</>
				)}

				{/* Thumbnails */}
				{validPhotos.length > 1 && (
					<View style={styles.thumbnailsContainer}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.thumbnailsContent}
						>
							{validPhotos.map((photo, index) => (
								<TouchableOpacity
									key={index}
									style={[
										styles.thumbnail,
										selectedIndex === index && styles.thumbnailSelected,
									]}
									onPress={() => setSelectedIndex(index)}
								>
									<Image
										source={{ uri: photo }}
										style={styles.thumbnailImage}
									/>
									{selectedIndex === index && (
										<View style={styles.thumbnailOverlay}>
											<View style={styles.thumbnailBorder} />
										</View>
									)}
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				)}
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.95)',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 50,
		paddingBottom: 20,
	},
	headerLeft: {
		flex: 1,
	},
	photoCount: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	closeButton: {
		padding: 8,
	},
	mainImageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	mainImage: {
		width: SCREEN_WIDTH - 40,
		height: SCREEN_HEIGHT * 0.6,
	},
	navButton: {
		position: 'absolute',
		top: '50%',
		transform: [{ translateY: -25 }],
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 25,
		width: 50,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	navButtonLeft: {
		left: 20,
	},
	navButtonRight: {
		right: 20,
	},
	thumbnailsContainer: {
		paddingVertical: 20,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	thumbnailsContent: {
		paddingHorizontal: 20,
		gap: 12,
	},
	thumbnail: {
		width: 80,
		height: 80,
		borderRadius: 8,
		overflow: 'hidden',
		position: 'relative',
	},
	thumbnailSelected: {
		borderWidth: 0,
	},
	thumbnailImage: {
		width: '100%',
		height: '100%',
	},
	thumbnailOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	thumbnailBorder: {
		...StyleSheet.absoluteFillObject,
		borderWidth: 3,
		borderColor: '#0B729D',
		borderRadius: 8,
	},
});
