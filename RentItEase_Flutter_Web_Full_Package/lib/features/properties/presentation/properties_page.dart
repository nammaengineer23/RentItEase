import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/page_container.dart';

class PropertiesPage extends StatefulWidget {
  const PropertiesPage({super.key});

  @override
  State<PropertiesPage> createState() => _PropertiesPageState();
}

class _PropertiesPageState extends State<PropertiesPage> {
  bool loading = true;
  List<Map<String, dynamic>> properties = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final response = await ApiClient.instance.dio.get('/properties');
      final body = response.data;
      final list = body is List ? body : (body is Map ? body['data'] : null);
      if (list is List) {
        properties = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
    } catch (_) {
      properties = [];
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageContainer(
      title: 'Properties',
      action: IconButton(onPressed: load, icon: const Icon(Icons.refresh)),
      child: loading
          ? const Center(child: Padding(padding: EdgeInsets.all(60), child: CircularProgressIndicator()))
          : properties.isEmpty
              ? const EmptyState(
                  title: 'No properties found',
                  message: 'Properties from your RentItEase backend will appear here.',
                  icon: Icons.home_work_outlined,
                )
              : LayoutBuilder(
                  builder: (context, c) {
                    final columns = c.maxWidth >= 1100 ? 3 : c.maxWidth >= 650 ? 2 : 1;
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.25,
                      ),
                      itemCount: properties.length,
                      itemBuilder: (_, i) {
                        final p = properties[i];
                        final id = '${p['id'] ?? i}';
                        return Card(
                          clipBehavior: Clip.antiAlias,
                          child: InkWell(
                            onTap: () => context.go('/properties/$id'),
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.home, size: 42),
                                  const SizedBox(height: 12),
                                  Text('${p['title'] ?? 'Property'}', style: Theme.of(context).textTheme.titleLarge),
                                  const SizedBox(height: 8),
                                  Text('${p['city'] ?? p['location'] ?? 'Location'}'),
                                  const Spacer(),
                                  Text('₹${p['rent'] ?? p['monthlyRent'] ?? '-'} / month'),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
    );
  }
}
