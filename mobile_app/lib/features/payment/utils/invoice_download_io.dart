import 'dart:io';

import 'package:path_provider/path_provider.dart';

Future<String> saveInvoiceFile({
  required String fileName,
  required String contents,
}) async {
  final directory =
      await getDownloadsDirectory() ?? await getApplicationDocumentsDirectory();
  final file = File('${directory.path}/$fileName');
  await file.writeAsString(contents, flush: true);
  return file.path;
}
