import 'package:flutter/material.dart';

class MessageInput extends StatefulWidget {
  final ValueChanged<String> onSend;

  const MessageInput({
    super.key,
    required this.onSend,
  });

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> {
  final TextEditingController _controller =
      TextEditingController();

  void _sendMessage() {
    final text = _controller.text.trim();

    if (text.isEmpty) return;

    widget.onSend(text);

    _controller.clear();
    setState(() {});
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            IconButton(
              onPressed: () {
                // TODO
                // Attach image/document
              },
              icon: const Icon(Icons.attach_file),
            ),

            Expanded(
              child: TextField(
                controller: _controller,
                minLines: 1,
                maxLines: 5,
                textCapitalization:
                    TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  contentPadding:
                      const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(30),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (_) {
                  setState(() {});
                },
                onSubmitted: (_) => _sendMessage(),
              ),
            ),

            const SizedBox(width: 8),

            AnimatedSwitcher(
              duration:
                  const Duration(milliseconds: 200),
              child: _controller.text.trim().isEmpty
                  ? IconButton(
                      key: const ValueKey("mic"),
                      onPressed: () {
                        // TODO
                        // Voice message
                      },
                      icon: const Icon(Icons.mic),
                    )
                  : FloatingActionButton.small(
                      key: const ValueKey("send"),
                      elevation: 0,
                      onPressed: _sendMessage,
                      child: const Icon(Icons.send),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}