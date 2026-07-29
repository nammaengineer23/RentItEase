import 'package:flutter/material.dart';

class ConversationTile extends StatelessWidget {
  const ConversationTile({
    super.key,
    required this.name,
    required this.propertyTitle,
    required this.lastMessage,
    required this.time,
    this.imageUrl,
    this.unreadCount = 0,
    this.isOnline = false,
    this.isTyping = false,
    this.onTap,
  });

  final String name;
  final String propertyTitle;
  final String lastMessage;
  final String time;

  final String? imageUrl;

  final int unreadCount;

  final bool isOnline;

  final bool isTyping;

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),

      //---------------------------------------
      // Avatar
      //---------------------------------------
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.grey.shade300,
            backgroundImage: imageUrl != null ? NetworkImage(imageUrl!) : null,
            child: imageUrl == null
                ? Text(
                    name.isNotEmpty ? name[0].toUpperCase() : "?",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  )
                : null,
          ),

          if (isOnline)
            Positioned(
              right: 2,
              bottom: 2,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
        ],
      ),

      //---------------------------------------
      // Name & Message
      //---------------------------------------
      title: Row(
        children: [
          Expanded(
            child: Text(
              name,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              overflow: TextOverflow.ellipsis,
            ),
          ),

          if (isTyping)
            const Text(
              "Typing...",
              style: TextStyle(
                color: Colors.green,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
        ],
      ),

      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 3),

          Row(
            children: [
              const Icon(Icons.home, size: 14, color: Colors.orange),

              const SizedBox(width: 4),

              Expanded(
                child: Text(
                  propertyTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 5),

          Text(
            isTyping ? "Typing..." : lastMessage,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: isTyping ? Colors.green : Colors.grey.shade700,
            ),
          ),
        ],
      ),

      //---------------------------------------
      // Time & Badge
      //---------------------------------------
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            time,
            style: TextStyle(
              fontSize: 12,
              color: unreadCount > 0
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey,
              fontWeight: unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
            ),
          ),

          const SizedBox(height: 6),

          if (unreadCount > 0)
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                shape: BoxShape.circle,
              ),
              child: Text(
                unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
