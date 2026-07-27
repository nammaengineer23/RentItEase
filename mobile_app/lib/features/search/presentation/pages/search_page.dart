import 'package:flutter/material.dart';
import '../../../../shared/widgets/custom_text_field.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController cityController = TextEditingController();
  final TextEditingController localityController = TextEditingController();

  @override
  void dispose() {
    cityController.dispose();
    localityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Search Properties"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CustomTextField(
              controller: cityController,
              hintText: "Enter City",
              prefixIcon: Icons.location_city,
            ),

            const SizedBox(height: 16),

            CustomTextField(
              controller: localityController,
              hintText: "Enter Locality",
              prefixIcon: Icons.location_on,
            ),
          ],
        ),
      ),
    );
  }
}