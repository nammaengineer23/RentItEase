import 'package:flutter/material.dart';

class MessageInput extends StatefulWidget {
  const MessageInput({
    super.key,
    required this.onSend,
    this.onCamera,
    this.onGallery,
    this.onTyping,
  });

  final ValueChanged<String> onSend;
  final VoidCallback? onCamera;
  final VoidCallback? onGallery;
  final ValueChanged<bool>? onTyping;

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> {
  final TextEditingController _controller = TextEditingController();

  final FocusNode _focusNode = FocusNode();

  void _sendMessage() {
    final text = _controller.text.trim();

    if (text.isEmpty) return;

    widget.onSend(text);

    _controller.clear();

    widget.onTyping?.call(false);

    setState(() {});
  }

  void _showAttachmentSheet() {
    showModalBottomSheet(
      context: context,
      builder: (_) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _attachmentButton(
                  icon: Icons.camera_alt,
                  label: 'Camera',
                  color: Colors.blue,
                  onTap: () {
                    Navigator.pop(context);
                    widget.onCamera?.call();
                  },
                ),

                _attachmentButton(
                  icon: Icons.photo,
                  label: 'Gallery',
                  color: Colors.green,
                  onTap: () {
                    Navigator.pop(context);
                    widget.onGallery?.call();
                  },
                ),

                _attachmentButton(
                  icon: Icons.insert_drive_file,
                  label: 'File',
                  color: Colors.orange,
                  onTap: () {
                    Navigator.pop(context);

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('File sharing coming soon.'),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _attachmentButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(50),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: color.withValues(alpha: 0.12),
            child: Icon(icon, color: color),
          ),

          const SizedBox(height: 8),

          Text(label),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasText = _controller.text.trim().isNotEmpty;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: const [BoxShadow(blurRadius: 4, color: Colors.black12)],
        ),
        child: Row(
          children: [
            IconButton(
              onPressed: () {
                // Emoji picker can be added later.
              },
              icon: const Icon(Icons.emoji_emotions_outlined),
            ),

            Expanded(
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                minLines: 1,
                maxLines: 5,
                textCapitalization: TextCapitalization.sentences,
                onChanged: (value) {
                  widget.onTyping?.call(value.trim().isNotEmpty);

                  setState(() {});
                },
                onSubmitted: (_) => _sendMessage(),
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                ),
              ),
            ),

            IconButton(
              onPressed: _showAttachmentSheet,
              icon: const Icon(Icons.attach_file),
            ),

            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: hasText
                  ? FloatingActionButton.small(
                      key: const ValueKey('send'),
                      elevation: 0,
                      onPressed: _sendMessage,
                      child: const Icon(Icons.send),
                    )
                  : IconButton(
                      key: const ValueKey('mic'),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Voice messages coming soon.'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.mic),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
