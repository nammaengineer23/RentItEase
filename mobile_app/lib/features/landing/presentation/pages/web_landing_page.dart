import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

class WebLandingPage extends StatelessWidget {
  const WebLandingPage({super.key});

  static const _ink = Color(0xFF10251B);
  static const _deepGreen = Color(0xFF123B2A);
  static const _green = Color(0xFF0D8A55);
  static const _mint = Color(0xFFD9F7E7);
  static const _line = Color(0xFFD9E4DD);
  static const _androidReleaseUrl =
      'https://github.com/nammaengineer23/RentItEase/actions/runs/34664262512';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFDFB),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            surfaceTintColor: Colors.transparent,
            backgroundColor: const Color(0xFFFBFDFB),
            toolbarHeight: 76,
            titleSpacing: 0,
            title: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: _ContentWidth(
                child: Row(
                  children: [
                    SvgPicture.asset(
                      'assets/images/branding/rentitease_logo_512x512.svg',
                      width: 42,
                      height: 42,
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'RentItEase',
                      style: TextStyle(
                        color: _ink,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => context.go('/about'),
                      child: const Text('About'),
                    ),
                    TextButton(
                      onPressed: () => context.go('/contact'),
                      child: const Text('Contact'),
                    ),
                    TextButton(
                      onPressed: () => context.go('/privacy'),
                      child: const Text('Privacy'),
                    ),
                    TextButton(
                      onPressed: () => context.go('/delete-account'),
                      child: const Text('Delete account'),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: _openAndroidDownload,
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: const Text('Download Android App'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _deepGreen,
                        side: const BorderSide(color: Color(0xFF8FB8A0)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () => context.go('/auth'),
                      style: FilledButton.styleFrom(
                        backgroundColor: _deepGreen,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Open app'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFFF5FFF8),
                        Color(0xFFE2F8EB),
                        Color(0xFFD4F4E2),
                      ],
                    ),
                  ),
                  child: _ContentWidth(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 76, 24, 64),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final compact = constraints.maxWidth < 760;
                          final heroCopy = _HeroCopy(
                            onOpenApp: () => context.go('/auth'),
                            onLearnMore: () => Scrollable.ensureVisible(
                              _howItWorksKey.currentContext!,
                              duration: const Duration(milliseconds: 380),
                              curve: Curves.easeOut,
                            ),
                          );
                          return compact
                              ? Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    heroCopy,
                                    const SizedBox(height: 36),
                                    const _HomePreview(),
                                  ],
                                )
                              : Row(
                                  children: [
                                    const Expanded(flex: 11, child: SizedBox()),
                                    Expanded(flex: 44, child: heroCopy),
                                    const SizedBox(width: 56),
                                    const Expanded(
                                      flex: 33,
                                      child: _HomePreview(),
                                    ),
                                    const Expanded(flex: 12, child: SizedBox()),
                                  ],
                                );
                        },
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  key: _howItWorksKey,
                  width: double.infinity,
                  child: const _ContentWidth(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(24, 80, 24, 80),
                      child: _HowItWorks(),
                    ),
                  ),
                ),
                Container(
                  width: double.infinity,
                  color: _deepGreen,
                  child: _ContentWidth(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 64, 24, 64),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final compact = constraints.maxWidth < 670;
                          final copy = const _ReleaseCopy();
                          final action = OutlinedButton(
                            onPressed: () => _showEarlyAccessDialog(context),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Color(0xFFB9D6C5)),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 18,
                              ),
                            ),
                            child: const Text('Request early access'),
                          );
                          return compact
                              ? Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [copy, const SizedBox(height: 24), action],
                                )
                              : Row(
                                  children: [
                                    const Expanded(child: _ReleaseCopy()),
                                    const SizedBox(width: 32),
                                    action,
                                  ],
                                );
                        },
                      ),
                    ),
                  ),
                ),
                const _ContentWidth(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                    child: _Footer(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static final _howItWorksKey = GlobalKey();

  Future<void> _openAndroidDownload() => launchUrl(
        Uri.parse(_androidReleaseUrl),
        webOnlyWindowName: '_blank',
      );

  void _showEarlyAccessDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Early access'),
        content: const Text(
          'The Android release download is being prepared. For early access, email support@rentitease.com.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}

class _ContentWidth extends StatelessWidget {
  const _ContentWidth({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1120),
          child: child,
        ),
      );
}

class _HeroCopy extends StatelessWidget {
  const _HeroCopy({required this.onOpenApp, required this.onLearnMore});
  final VoidCallback onOpenApp;
  final VoidCallback onLearnMore;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'RENTAL HOMES, MADE SIMPLE',
            style: TextStyle(
              color: Color(0xFF16724B),
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Find a place\nthat feels right.',
            style: TextStyle(
              color: WebLandingPage._ink,
              fontSize: 64,
              height: .98,
              fontWeight: FontWeight.w800,
              letterSpacing: -3.4,
            ),
          ),
          const SizedBox(height: 22),
          const Text(
            'Browse rental homes, book a visit, and take the next step with clarity. RentItEase keeps your rental journey in one place.',
            style: TextStyle(
              color: Color(0xFF395548),
              fontSize: 18,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 30),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(
                onPressed: onOpenApp,
                style: FilledButton.styleFrom(
                  backgroundColor: WebLandingPage._deepGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                ),
                child: const Text('Explore RentItEase'),
              ),
              OutlinedButton(
                onPressed: onLearnMore,
                style: OutlinedButton.styleFrom(
                  foregroundColor: WebLandingPage._deepGreen,
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFFB9D6C5)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                ),
                child: const Text('See how it works'),
              ),
            ],
          ),
        ],
      );
}

class _HomePreview extends StatelessWidget {
  const _HomePreview();

  @override
  Widget build(BuildContext context) => Transform.rotate(
        angle: .035,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: WebLandingPage._deepGreen,
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x38123B2A),
                blurRadius: 42,
                offset: Offset(0, 22),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.circle, size: 10, color: Color(0xFF66E29D)),
                  SizedBox(width: 8),
                  Text(
                    'Available homes near you',
                    style: TextStyle(color: Color(0xFFD3FAE2), fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Text(
                'Your next home could be closer than you think.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  height: 1.15,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -.8,
                ),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(17),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Comfortable homes, clear details',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Compare locations, rent and property details before you visit.',
                      style: TextStyle(color: Color(0xFF587064), height: 1.4),
                    ),
                    SizedBox(height: 13),
                    Text(
                      'Made for simpler renting',
                      style: TextStyle(
                        color: WebLandingPage._green,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}

class _HowItWorks extends StatelessWidget {
  const _HowItWorks();

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 650),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Move from search to home in three clear steps.',
                  style: TextStyle(
                    color: WebLandingPage._ink,
                    fontSize: 40,
                    height: 1.08,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -1.8,
                  ),
                ),
                SizedBox(height: 14),
                Text(
                  'RentItEase is designed for tenants looking for a better way to explore and manage rental options.',
                  style: TextStyle(color: Color(0xFF587064), fontSize: 17, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 700;
              final cards = const [
                _StepCard(number: '1', title: 'Explore homes', text: 'Search available properties and review the details that matter to you.'),
                _StepCard(number: '2', title: 'Book a visit', text: 'Request a property visit and stay updated as the owner responds.'),
                _StepCard(number: '3', title: 'Manage your rental', text: 'Keep bookings, chats and rental activity together in one app.'),
              ];
              return compact
                  ? Column(children: cards.map((card) => Padding(padding: const EdgeInsets.only(bottom: 12), child: card)).toList())
                  : Row(children: cards.map((card) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 12), child: card))).toList());
            },
          ),
        ],
      );
}

class _StepCard extends StatelessWidget {
  const _StepCard({required this.number, required this.title, required this.text});
  final String number;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
        height: 205,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: WebLandingPage._line),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(backgroundColor: WebLandingPage._mint, foregroundColor: WebLandingPage._deepGreen, child: Text(number, style: const TextStyle(fontWeight: FontWeight.w800))),
            const SizedBox(height: 17),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(text, style: const TextStyle(color: Color(0xFF587064), height: 1.42)),
          ],
        ),
      );
}

class _ReleaseCopy extends StatelessWidget {
  const _ReleaseCopy();

  @override
  Widget build(BuildContext context) => const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('RENTITEASE FOR ANDROID', style: TextStyle(color: Color(0xFF8CE3B0), fontWeight: FontWeight.w800, letterSpacing: 1.1)),
          SizedBox(height: 12),
          Text('The app is almost ready for you.', style: TextStyle(color: Colors.white, fontSize: 38, height: 1.08, fontWeight: FontWeight.w800, letterSpacing: -1.5)),
          SizedBox(height: 12),
          Text('We are preparing the signed Android release for direct download. Contact us for early access.', style: TextStyle(color: Color(0xFFC5DFCF), fontSize: 16, height: 1.5)),
        ],
      );
}

class _Footer extends StatelessWidget {
  const _Footer();

  @override
  Widget build(BuildContext context) => const Wrap(
        alignment: WrapAlignment.spaceBetween,
        runSpacing: 12,
        children: [
          Text('© 2026 RentItEase', style: TextStyle(color: Color(0xFF587064))),
          Text('support@rentitease.com', style: TextStyle(color: Color(0xFF587064))),
        ],
      );
}

enum WebInfoPageKind { about, contact, privacy, deleteAccount }

class WebInfoPage extends StatelessWidget {
  const WebInfoPage({required this.kind, super.key});

  final WebInfoPageKind kind;

  String get _title => switch (kind) {
        WebInfoPageKind.about => 'Rentals, made simpler.',
        WebInfoPageKind.contact => 'Contact us',
        WebInfoPageKind.privacy => 'Privacy Policy',
        WebInfoPageKind.deleteAccount => 'Delete your RentItEase account',
      };

  String get _intro => switch (kind) {
        WebInfoPageKind.about =>
          'RentItEase helps tenants discover rental homes, arrange visits, and manage their rental journey in one place.',
        WebInfoPageKind.contact =>
          'We are here to help with RentItEase account, property, or app questions.',
        WebInfoPageKind.privacy =>
          'Last updated: 12 September 2026. This draft should be reviewed before public publication.',
        WebInfoPageKind.deleteAccount =>
          'You can request deletion of your account and associated personal data.',
      };

  List<_InfoSection> get _sections => switch (kind) {
        WebInfoPageKind.about => const [
            _InfoSection(
              title: 'Our purpose',
              body:
                  'We want rental decisions to feel clearer through useful property details, a straightforward visit process, and one place to keep rental activity organised.',
            ),
            _InfoSection(
              title: 'For tenants and owners',
              body:
                  'Tenants can explore homes and request visits. Property owners can manage listings, respond to requests, and follow property activity.',
            ),
          ],
        WebInfoPageKind.contact => const [
            _InfoSection(
              title: 'Email support',
              body:
                  'For support, email support@rentitease.com. For general enquiries, email contact@rentitease.com.',
            ),
            _InfoSection(
              title: 'Before you write',
              body:
                  'Please include the email address associated with your account and a short description of the issue. Never send your password or OTP.',
            ),
          ],
        WebInfoPageKind.privacy => const [
            _InfoSection(
              title: 'Information we collect',
              body:
                  'RentItEase may collect account details, profile information, property and visit information, messages, and device or usage data needed to provide the service.',
            ),
            _InfoSection(
              title: 'How we use information',
              body:
                  'We use information to operate the app, manage accounts and listings, support bookings and visits, provide customer support, improve the service, and meet legal obligations.',
            ),
            _InfoSection(
              title: 'Your choices',
              body:
                  'You can request account deletion or privacy assistance by emailing support@rentitease.com.',
            ),
          ],
        WebInfoPageKind.deleteAccount => const [
            _InfoSection(
              title: 'How to request deletion',
              body:
                  'Email support@rentitease.com from the email address on your account. Use the subject “RentItEase Account Deletion Request” and include your registered email address and mobile number, if available.',
            ),
            _InfoSection(
              title: 'What happens next',
              body:
                  'For security, we may ask you to verify account ownership. We will then confirm the request and explain any information that must be retained for legal or operational reasons.',
            ),
          ],
      };

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFFBFDFB),
        appBar: AppBar(
          backgroundColor: const Color(0xFFFBFDFB),
          surfaceTintColor: Colors.transparent,
          title: TextButton(
            onPressed: () => context.go('/'),
            child: const Text(
              'RentItEase',
              style: TextStyle(
                color: WebLandingPage._ink,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => context.go('/about'), child: const Text('About')),
            TextButton(onPressed: () => context.go('/contact'), child: const Text('Contact')),
            TextButton(onPressed: () => context.go('/privacy'), child: const Text('Privacy')),
            TextButton(onPressed: () => context.go('/delete-account'), child: const Text('Delete account')),
            const SizedBox(width: 12),
          ],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 72, 24, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _title,
                    style: const TextStyle(
                      color: WebLandingPage._ink,
                      fontSize: 44,
                      height: 1.1,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _intro,
                    style: const TextStyle(
                      color: Color(0xFF395548),
                      fontSize: 17,
                      height: 1.55,
                    ),
                  ),
                  const SizedBox(height: 28),
                  ..._sections.map((section) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _InfoCard(section: section),
                      )),
                  const Divider(height: 48),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: [
                      TextButton(onPressed: () => context.go('/'), child: const Text('Home')),
                      TextButton(onPressed: () => context.go('/about'), child: const Text('About')),
                      TextButton(onPressed: () => context.go('/contact'), child: const Text('Contact')),
                      TextButton(onPressed: () => context.go('/privacy'), child: const Text('Privacy Policy')),
                      TextButton(onPressed: () => context.go('/delete-account'), child: const Text('Delete Account')),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}

class _InfoSection {
  const _InfoSection({required this.title, required this.body});
  final String title;
  final String body;
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.section});
  final _InfoSection section;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: WebLandingPage._line),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(section.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(section.body, style: const TextStyle(color: Color(0xFF395548), height: 1.55)),
          ],
        ),
      );
}
