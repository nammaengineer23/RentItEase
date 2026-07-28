import 'package:flutter/material.dart';

import '../widgets/property_map.dart';

class MapPage extends StatelessWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Property Map'),
        centerTitle: true,
      ),
      body: const SafeArea(
        child: PropertyMap(),
      ),
    );
  }
}