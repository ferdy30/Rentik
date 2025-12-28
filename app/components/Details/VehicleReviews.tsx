import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Review {
  id: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  date: string;
  comment: string;
  tripDuration: string;
}

interface VehicleReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingBreakdown?: {
    cleanliness: number;
    communication: number;
    accuracy: number;
    value: number;
  };
}

export default function VehicleReviews({
  reviews,
  averageRating,
  totalReviews,
  ratingBreakdown,
}: VehicleReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={14}
            color="#FBBF24"
          />
        ))}
      </View>
    );
  };

  const renderRatingBar = (label: string, value: number) => (
    <View style={styles.ratingBarContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text style={styles.ratingValue}>{value.toFixed(1)}</Text>
    </View>
  );

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Sin reseñas aún</Text>
        <Text style={styles.emptyText}>
          Sé el primero en rentar este vehículo y dejar una reseña
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="star" size={24} color="#FBBF24" />
        <Text style={styles.sectionTitle}>Reseñas</Text>
      </View>

      {/* Overall Rating */}
      <View style={styles.overallContainer}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsRow}>
            {renderStars(averageRating)}
          </View>
        </View>
        <Text style={styles.totalReviews}>{totalReviews} reseñas</Text>
      </View>

      {/* Rating Breakdown */}
      {ratingBreakdown && (
        <View style={styles.breakdownContainer}>
          {renderRatingBar('Limpieza', ratingBreakdown.cleanliness)}
          {renderRatingBar('Comunicación', ratingBreakdown.communication)}
          {renderRatingBar('Precisión', ratingBreakdown.accuracy)}
          {renderRatingBar('Relación calidad-precio', ratingBreakdown.value)}
        </View>
      )}

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {displayedReviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.userInfo}>
                {review.userPhoto ? (
                  <Image source={{ uri: review.userPhoto }} style={styles.userPhoto} />
                ) : (
                  <View style={styles.userPhotoPlaceholder}>
                    <Ionicons name="person" size={20} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{review.userName}</Text>
                  <Text style={styles.tripDuration}>{review.tripDuration}</Text>
                </View>
              </View>
              <View style={styles.reviewMeta}>
                {renderStars(review.rating)}
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
        ))}
      </View>

      {/* Show More Button */}
      {reviews.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreText}>
            {showAll ? 'Ver menos' : `Ver todas las reseñas (${reviews.length})`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#0B729D"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  overallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  ratingCircle: {
    alignItems: 'center',
    gap: 8,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  totalReviews: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  breakdownContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  barBackground: {
    flex: 2,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 4,
  },
  ratingValue: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  tripDuration: {
    fontSize: 13,
    color: '#6B7280',
  },
  reviewMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  showMoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B729D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
