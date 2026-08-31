import 'package:flutter/material.dart';

/// A web fallback for legal URLs. This is deliberately rendered by Flutter as
/// well as by the Cloudflare Worker so an already-installed web service worker
/// cannot turn a legal link into the onboarding flow.
class LegalDocumentPage extends StatelessWidget {
  const LegalDocumentPage({super.key, required this.path});

  final String path;

  @override
  Widget build(BuildContext context) {
    final document = _documentFor(path);
    return MaterialApp(
      title: '${document.title} | RentItEase',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff087a45)),
        scaffoldBackgroundColor: const Color(0xfff7faf8),
      ),
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Text('RentItEase ${document.title}',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: const Color(0xff087a45),
                            fontWeight: FontWeight.bold,
                          )),
                  const SizedBox(height: 12),
                  const Text('Effective date: August 31, 2026'),
                  const SizedBox(height: 24),
                  for (final section in document.sections) ...[
                    Text(section.$1,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            )),
                    const SizedBox(height: 8),
                    Text(section.$2),
                    const SizedBox(height: 24),
                  ],
                  const Divider(),
                  const SizedBox(height: 12),
                  const Text('Support: support@rentitease.com'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

_LegalDocument _documentFor(String path) {
  if (path == '/terms' || path == '/terms-of-service') {
    return const _LegalDocument('Terms of Service', [
      ('Using RentItEase', 'By using RentItEase, you agree to use the service lawfully, provide accurate information, and keep your account secure.'),
      ('Listings and rental decisions', 'Owners are responsible for listing accuracy and availability. Tenants must independently verify property details before entering an agreement.'),
      ('Payments and support', 'Prices and applicable terms are shown before confirmation. Contact support@rentitease.com for questions.'),
    ]);
  }
  if (path == '/delete-account') {
    return const _LegalDocument('Account and Data Deletion Policy', [
      ('Request account deletion', 'Email support@rentitease.com from your registered email address, including the email address or mobile number linked to your account.'),
      ('What we delete', 'After identity verification, we delete or anonymize account and profile data, saved preferences, and personal data where legally and technically appropriate.'),
      ('What may be retained', 'Limited records may be retained where required for legal, tax, fraud-prevention, security, or regulatory purposes.'),
    ]);
  }
  return const _LegalDocument('Privacy Policy', [
    ('Information we collect', 'We collect account, property, booking, message, review, and usage information needed to operate RentItEase.'),
    ('How we use information', 'We use information to secure accounts, verify users, manage listings and visits, process payments, provide support, and prevent fraud.'),
    ('Sharing and choices', 'We share information only as needed to provide the service. We do not sell personal information. You may request access to or deletion of your data.'),
  ]);
}

class _LegalDocument {
  const _LegalDocument(this.title, this.sections);
  final String title;
  final List<(String, String)> sections;
}
