export class SocialProviderAmbiguousError extends Error {
  constructor(message = 'The provider response was ambiguous; reconciliation is required before retrying.') {
    super(message);
    this.name = 'SocialProviderAmbiguousError';
  }
}
