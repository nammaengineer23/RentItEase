# Social media production rollout

RentItEase social publishing is consent-gated and administrator controlled.

- An owner grants or revokes one general promotion consent for a property.
- An administrator selects Instagram, Facebook, or YouTube for each post.
- Property approval never publishes automatically.
- Scheduled posts and bounded retry attempts are persisted in PostgreSQL.

## Safe rollout

1. Deploy the migration `20260830040000_harden_social_marketing_workflow`.
2. Set `SOCIAL_AUTOMATION_MODE=GENERATE_ONLY` and leave `SOCIAL_SCHEDULER_ENABLED=false`.
3. Configure and test R2/Firebase video storage plus Railway FFmpeg.
4. Configure one platform's credentials, create a test property with owner consent, then publish manually from the admin panel.
5. Verify the public video URL and the platform post. Record its metrics through the admin analytics endpoint.
6. Enable the scheduler only after manual publishing works: `SOCIAL_SCHEDULER_ENABLED=true`.

## Platform credentials

- Instagram: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`
- Facebook: `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`
- YouTube: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, optional `YOUTUBE_REDIRECT_URI`

Never store these credentials in source control. Configure them in Railway only.
