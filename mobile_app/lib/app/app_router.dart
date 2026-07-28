// lib/app/router.dart

import 'package:go_router/go_router.dart';

import '../features/splash/presentation/pages/splash_page.dart';
import '../features/onboarding/presentation/pages/onboarding_page.dart';
import '../features/authentication/presentation/pages/authentication_page.dart';
import '../features/uploads/presentation/pages/upload_images_page.dart';
import '../features/home/presentation/pages/home_page.dart';
import '../features/property/presentation/pages/property_page.dart';
import '../features/search/presentation/pages/search_page.dart';

import '../features/chat/presentation/pages/chat_page.dart';
import '../features/booking/presentation/pages/booking_page.dart';
import '../features/payment/presentation/pages/payment_page.dart';

import '../features/profile/presentation/pages/profile_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';


// ❤️ Favorites
import '../features/favorites/presentation/pages/favorites_page.dart';


// 🔔 Notifications
import '../features/notifications/presentation/pages/notifications_page.dart';



class AppRouter {


  static final GoRouter router = GoRouter(


    initialLocation: '/splash',



    routes: [



      // =========================
      // Splash
      // =========================

      GoRoute(

        path: '/splash',

        builder: (context, state) =>
            const SplashPage(),

      ),






      // =========================
      // Onboarding
      // =========================

      GoRoute(

        path: '/onboarding',

        builder: (context, state) =>
            const OnboardingPage(),

      ),






      // =========================
      // Authentication
      // =========================

      GoRoute(

        path: '/sign-in',

        builder: (context, state) =>
            const SignInPage(),

      ),






      // =========================
      // Home
      // =========================

      GoRoute(

        path: '/home',

        builder: (context, state) =>
            const HomePage(),

      ),






      // =========================
      // Property
      // =========================

      GoRoute(

        path: '/property',

        builder: (context, state) =>
            const PropertyPage(),

      ),






      // =========================
      // Search
      // =========================

      GoRoute(

        path: '/search',

        builder: (context, state) =>
            const SearchPage(),

      ),






      // =========================
      // Chat
      // =========================

      GoRoute(

        path: '/chat',

        builder: (context, state) =>
            const ChatPage(),

      ),






      // =========================
      // Booking
      // =========================

      GoRoute(

        path: '/booking',

        builder: (context, state) =>
            const BookingPage(),

      ),






      // =========================
      // Payment
      // =========================

      GoRoute(

        path: '/payment',

        builder: (context, state) =>
            const PaymentPage(),

      ),






      // =========================
      // Profile
      // =========================

      GoRoute(

        path: '/profile',

        builder: (context, state) =>
            const ProfilePage(),

      ),






      // =========================
      // Settings
      // =========================

      GoRoute(

        path: '/settings',

        builder: (context, state) =>
            const SettingsPage(),

      ),






      // =========================
      // ❤️ Favorites
      // =========================

      GoRoute(

        path: '/favorites',

        builder: (context, state) =>
            const FavoritesPage(),

      ),

       // =========================
       // ❤️ Upload image
       // =========================

         GoRoute(
         path: '/upload-images',
         builder: (context, state) =>
          const UploadImagesPage(),
         ),





      // =========================
      // 🔔 Notifications
      // =========================

      GoRoute(

        path: '/notifications',

        builder: (context, state) =>
            const NotificationsPage(),

      ),



    ],


  );


}