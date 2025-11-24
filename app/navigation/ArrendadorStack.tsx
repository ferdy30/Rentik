import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Step1Basic from '../Screens/Arrendador/AddVehicle/Step1Basic';
import Step2Specs from '../Screens/Arrendador/AddVehicle/Step2Specs';
import Step3Photos from '../Screens/Arrendador/AddVehicle/Step3Photos';
import Step4Price from '../Screens/Arrendador/AddVehicle/Step4Price';
import EditVehicle from '../Screens/Arrendador/EditVehicle';
import Details from '../Screens/Details';
import HomeArrendador from '../Screens/HomeArrendador';

export type ArrendadorStackParamList = {
	HomeArrendador: undefined;
	Details: { id: string };
	EditVehicle: { vehicle: any };
	AddVehicleStep1Basic: undefined;
	AddVehicleStep2Specs: { vehicleData: any };
	AddVehicleStep3Photos: { vehicleData: any };
	AddVehicleStep4Price: { vehicleData: any };
};

const Stack = createNativeStackNavigator<ArrendadorStackParamList>();

export default function ArrendadorStack() {
	return (
		<Stack.Navigator
			id={undefined}
			initialRouteName="HomeArrendador"
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<Stack.Screen name="HomeArrendador" component={HomeArrendador} />
			<Stack.Screen name="Details" component={Details} />
			<Stack.Screen name="EditVehicle" component={EditVehicle} />
			<Stack.Screen name="AddVehicleStep1Basic" component={Step1Basic} />
			<Stack.Screen name="AddVehicleStep2Specs" component={Step2Specs} />
			<Stack.Screen name="AddVehicleStep3Photos" component={Step3Photos} />
			<Stack.Screen name="AddVehicleStep4Price" component={Step4Price} />
		</Stack.Navigator>
	);
}
