# Social-media publishing configuration

The admin Social Media page can generate property reels and publish them only
when the property owner has granted consent. Video generation requires FFmpeg;
the Railway Nixpacks configuration installs it automatically.

Configure only the platforms RentItEase will publish to:

```env
SOCIAL_AUTOMATION_MODE=GENERATE_ONLY

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=

FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=

YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_REDIRECT_URI=
YOUTUBE_DEFAULT_PRIVACY=private
```

Keep `SOCIAL_AUTOMATION_MODE=GENERATE_ONLY` until platform credentials are
verified. Owner consent is enforced by the backend for both generation and
manual publishing. Once consent exists, the administrator chooses which
configured platform receives each post; consent itself cannot be bypassed.
