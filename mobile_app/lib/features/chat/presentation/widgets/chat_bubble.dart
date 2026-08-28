import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/message_entity.dart';

class ChatBubble extends StatelessWidget {
  const ChatBubble({
    super.key,
    required this.message,
    required this.isMine,
  });

  final MessageEntity message;
  final bool isMine;

  String _formatTime(DateTime time) {
    final local = time.toLocal();
    final hour = local.hour > 12
        ? local.hour - 12
        : (local.hour == 0 ? 12 : local.hour);
    final minute = local.minute.toString().padLeft(2, '0');
    final period = local.hour >= 12 ? 'PM' : 'AM';

    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      child: Align(
        alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 320),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isMine
                ? Theme.of(context).colorScheme.primary
                : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (message.deletedAt == null && message.messageType == 'IMAGE')
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    message.text,
                    width: 240,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const SizedBox(
                      width: 220,
                      height: 120,
                      child: Center(child: Icon(Icons.broken_image_outlined)),
                    ),
                  ),
                )
              else if (message.deletedAt == null &&
                  (message.messageType == 'DOCUMENT' ||
                      message.messageType == 'VOICE'))
                OutlinedButton.icon(
                  onPressed: () => launchUrl(
                    Uri.parse(message.text),
                    mode: LaunchMode.externalApplication,
                  ),
                  icon: Icon(
                    message.messageType == 'VOICE'
                        ? Icons.play_arrow
                        : Icons.description_outlined,
                  ),
                  label: Text(
                    message.messageType == 'VOICE'
                        ? 'Play voice message'
                        : 'Open document',
                  ),
                )
              else
                Text(
                  message.deletedAt == null ? message.text : 'Message deleted',
                  style: TextStyle(
                    color: isMine ? Colors.white : Colors.black87,
                    fontSize: 15,
                    height: 1.4,
                    fontStyle: message.deletedAt == null
                        ? FontStyle.normal
                        : FontStyle.italic,
                  ),
                ),
              const SizedBox(height: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _formatTime(message.createdAt),
                    style: TextStyle(
                      fontSize: 11,
                      color: isMine ? Colors.white70 : Colors.grey.shade700,
                    ),
                  ),
                  if (message.editedAt != null) ...[
                    const SizedBox(width: 4),
                    Text(
                      'edited',
                      style: TextStyle(
                        fontSize: 10,
                        color: isMine ? Colors.white70 : Colors.grey.shade600,
                      ),
                    ),
                  ],
                  if (isMine) ...[
                    const SizedBox(width: 5),
                    Icon(
                      message.isRead ? Icons.done_all : Icons.done,
                      size: 16,
                      color: message.isRead
                          ? Colors.lightBlueAccent
                          : Colors.white70,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
