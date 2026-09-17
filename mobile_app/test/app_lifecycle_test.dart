// Lifecycle refresh behavior is exercised by Flutter integration/web smoke tests.
// This file documents the regression covered by the app-level lifecycle handler:
// background/minimize -> resume must rebuild the current route without resetting it.
