import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")

    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    // END: FlutterFire Configuration

    // The Flutter Gradle Plugin must be applied after the
    // Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// ============================================================
// Android signing properties
// android/key.properties
// ============================================================

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()

if (keystorePropertiesFile.exists()) {
    FileInputStream(keystorePropertiesFile).use(
        keystoreProperties::load,
    )
}

// ============================================================
// Local Android properties
// android/local.properties
//
// MAPS_API_KEY must remain outside Git.
// ============================================================

val localPropertiesFile = rootProject.file("local.properties")
val localProperties = Properties()

if (localPropertiesFile.exists()) {
    FileInputStream(localPropertiesFile).use(
        localProperties::load,
    )
}

val mapsApiKey =
    localProperties.getProperty("MAPS_API_KEY")
        ?: System.getenv("MAPS_API_KEY")
        ?: ""

android {
    namespace = "com.rentitease.app"

    compileSdk = 37
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.rentitease.app"

        minSdk = 24
        targetSdk = 36

        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // Google Maps API key is injected into AndroidManifest.xml.
        //
        // Local builds:
        // android/local.properties
        //
        // CI builds:
        // MAPS_API_KEY environment variable
        manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
    }

    // ============================================================
    // Release signing
    // ============================================================

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias =
                    keystoreProperties.getProperty("keyAlias")

                keyPassword =
                    keystoreProperties.getProperty("keyPassword")

                storeFile = file(
                    keystoreProperties.getProperty("storeFile"),
                )

                storePassword =
                    keystoreProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            if (keystorePropertiesFile.exists()) {
                signingConfig =
                    signingConfigs.getByName("release")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget =
            org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
