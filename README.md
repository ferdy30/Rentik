# Rentik - Car Rental App

## Overview
Rentik is a comprehensive car rental application built with React Native and Expo, designed to connect car owners (arrendadores) with renters (arrendatarios) in El Salvador. The app features role-based navigation, secure authentication, and a professional black-themed design.

## Features

### For Renters (Arrendatarios)
- Browse available cars for rent
- View car details, pricing, and location
- Secure booking system
- User profile management

### For Car Owners (Arrendadores)
- Manage vehicle fleet
- Add new vehicles with detailed profiles
- Track earnings and reservations
- License verification process
- Vehicle status management

### Core Features
- **Authentication**: Firebase-based login and registration
- **Role-based Navigation**: Different flows for renters and owners
- **License Upload**: Secure document verification for owners
- **Vehicle Management**: Complete CRUD operations for car listings
- **Professional UI**: Modern black-themed design
- **Real-time Updates**: Live data synchronization

## Tech Stack
- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Styling**: StyleSheet with professional color palette

## Project Structure

```
rentik/
├── app/
│   ├── App.tsx                 # Main app component
│   ├── navigation/
│   │   └── index.tsx          # Navigation configuration
│   ├── Screens/
│   │   ├── Splash.tsx         # Multi-screen splash sequence
│   │   ├── Login.tsx          # Authentication screen
│   │   ├── Registro.tsx       # User registration
│   │   ├── LicenseUpload.tsx  # Document verification
│   │   ├── PerfilVehiculo.tsx # Vehicle profile creation
│   │   ├── Home.tsx           # Renter's car browsing
│   │   └── HomeArrendador.tsx # Owner's vehicle management
│   └── types/
│       └── navigation.ts      # TypeScript navigation types
├── context/
│   └── Auth.jsx               # Authentication context
├── FirebaseConfig.js          # Firebase configuration
├── assets/                    # Images and static assets
└── package.json               # Dependencies and scripts
```

## User Flows

### Renter Flow
1. **Splash Screens** → 3 sequential intro screens
2. **Login** → Authenticate existing account
3. **Home** → Browse available cars

### Owner Flow
1. **Splash Screens** → 3 sequential intro screens
2. **Login** → Authenticate existing account
3. **Registration** → Create new account with role selection
4. **License Upload** → Verify driving license
5. **Vehicle Profile** → Add first vehicle
6. **HomeArrendador** → Manage vehicle fleet

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Stripe account (test mode)
- Google Cloud Platform account (for Maps API)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ferdy30/Rentik.git
cd Rentik

# 2. Install dependencies
npm install

# 3. Install Cloud Functions dependencies
cd functions
npm install
cd ..

# 4. Configure environment variables (REQUIRED)
# See SETUP.md for detailed instructions
copy FirebaseConfig.example.js FirebaseConfig.js
# Edit FirebaseConfig.js with your Firebase credentials

cd functions
copy .env.example .env
# Edit .env with your Stripe and Google Maps keys
cd ..

# 5. Start the development server
npm start

# 6. Deploy Cloud Functions (optional, for Stripe & Places API)
cd functions
npm run deploy
```

### ⚙️ Configuration

**IMPORTANT**: Before running the app, you must configure your environment variables.

👉 **See [SETUP.md](./SETUP.md) for complete configuration instructions**

The app requires:
- Firebase credentials (`FirebaseConfig.js`)
- Stripe keys (`functions/.env`)
- Google Maps API keys (`app.json`)

### Installation (Legacy)
   - npm or yarn
   - Expo CLI
   - Android Studio (for Android development)
   - Xcode (for iOS development, macOS only)

2. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd rentik
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Configure Firebase config in `FirebaseConfig.js`
   - Update security rules in `firestore.rules` and `storage.rules`

4. **Environment Variables**
   - Copy `FirebaseConfig.example.js` to `FirebaseConfig.js`
   - Fill in your Firebase configuration values

5. **Run the App**
   ```bash
   npm start
   # or
   expo start
   ```

## Development

### Available Scripts
- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint for code quality

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Professional naming conventions

## Design System

### Color Palette
- **Primary**: `#FF5A5F` (Coral Red)
- **Background**: `#0f0f0f` (Deep Black)
- **Secondary Background**: `#1a1a1a` (Dark Gray)
- **Text**: `#e0e0e0` (Light Gray)
- **Accent**: `#b0b0b0` (Medium Gray)

### Typography
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Labels**: Medium, 12-14px

## Security Features
- Firebase Authentication with email/password
- Secure file upload for license verification
- Firestore security rules
- Input validation and sanitization
- Role-based access control

## Performance Optimizations
- Lazy loading of screens
- Optimized images and assets
- Efficient state management
- Minimal re-renders
- Compressed bundle size

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@rentik.com or join our Discord community.

## Roadmap

- [ ] Push notifications
- [ ] In-app messaging
- [ ] Payment integration
- [ ] GPS tracking
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Rating and review system
