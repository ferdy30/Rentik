import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
	labels?: string[];
}

const STEP_ICONS = ['car-sport', 'list', 'camera', 'pricetag'];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
	currentStep,
	totalSteps,
	labels = [],
}) => {
	return (
		<View style={styles.container}>
			{Array.from({ length: totalSteps }).map((_, index) => {
				const stepNumber = index + 1;
				const isActive = stepNumber === currentStep;
				const isCompleted = stepNumber < currentStep;
				
				return (
					<React.Fragment key={stepNumber}>
						<View style={styles.stepWrapper}>
							<View
								style={[
									styles.dot,
									isActive && styles.dotActive,
									isCompleted && styles.dotCompleted,
								]}
							>
								{isCompleted ? (
									<Ionicons name="checkmark" size={18} color="#FFFFFF" />
								) : (
									<Ionicons 
										name={STEP_ICONS[index] as any || 'ellipse'} 
										size={18} 
										color={isActive ? '#FFFFFF' : '#6B7280'} 
									/>
								)}
							</View>
							{labels[index] && (
								<Text
									style={[
										styles.label,
										isActive && styles.labelActive,
									]}
								>
									{labels[index]}
								</Text>
							)}
						</View>
						{stepNumber < totalSteps && (
							<View
								style={[
									styles.line,
									isCompleted && styles.lineCompleted,
								]}
							/>
						)}
					</React.Fragment>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
		paddingHorizontal: 16,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	stepWrapper: {
		alignItems: 'center',
		gap: 6,
		width: 60,
	},
	dot: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#F9FAFB',
		borderWidth: 1.5,
		borderColor: '#E5E7EB',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	dotActive: {
		backgroundColor: '#0B729D',
		borderColor: '#0B729D',
		transform: [{ scale: 1.1 }],
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	dotCompleted: {
		backgroundColor: '#10B981',
		borderColor: '#10B981',
	},
	line: {
		flex: 1,
		height: 2,
		backgroundColor: '#E5E7EB',
		marginHorizontal: -10,
		zIndex: -1,
		top: -10,
	},
	lineCompleted: {
		backgroundColor: '#10B981',
	},
	label: {
		fontSize: 11,
		color: '#9CA3AF',
		fontWeight: '500',
		textAlign: 'center',
	},
	labelActive: {
		color: '#0B729D',
		fontWeight: '700',
	},
});
