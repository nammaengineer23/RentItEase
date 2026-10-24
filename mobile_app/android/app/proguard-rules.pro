# Razorpay documents these rules for its native checkout SDK.
# Preserve payment callbacks and reflective SDK entry points during R8.
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-keepclasseswithmembers class * {
    public void onPayment*(...);
}
