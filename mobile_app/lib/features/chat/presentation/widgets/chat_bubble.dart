import 'package:flutter/material.dart';

import '../../providers/chat_provider.dart';

class ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const ChatBubble({
    super.key,
    required this.message,
  });

  String _formatTime(DateTime time) {
    final hour = time.hour > 12
        ? time.hour - 12
        : (time.hour == 0 ? 12 : time.hour);

    final minute = time.minute
        .toString()
        .padLeft(2, '0');

    final period = time.hour >= 12 ? 'PM' : 'AM';

    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    final isMine = message.isMine;

    return Align(
      alignment:
          isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(
          maxWidth: 300,
        ),
        margin: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 6,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: isMine
              ? Theme.of(context).colorScheme.primary
              : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(
              isMine ? 18 : 4,
            ),
            bottomRight: Radius.circular(
              isMine ? 4 : 18,
            ),
          ),
        ),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.end,
          children: [

            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                message.message,
                style: TextStyle(
                  color: isMine
                      ? Colors.white
                      : Colors.black87,
                  fontSize: 15,
                ),
              ),
            ),

            const SizedBox(height: 8),

            Row(
              mainAxisSize: MainAxisSize.min,
              children: [

                Text(
                  _formatTime(message.timestamp),
                  style: TextStyle(
                    fontSize: 11,
                    color: isMine
                        ? Colors.white70
                        : Colors.grey.shade700,
                  ),
                ),

                if (isMine) ...[
                  const SizedBox(width: 4),

                  Icon(
                    message.isRead
                        ? Icons.done_all
                        : Icons.done,
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
    );
  }
}