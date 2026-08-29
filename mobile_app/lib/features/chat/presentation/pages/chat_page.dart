import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../../../authentication/providers/authentication_provider.dart';
import '../../providers/chat_provider.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/message_input.dart';

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({
    super.key,
    this.conversationId,
    this.propertyId,
    this.userName = 'Owner',
    this.propertyTitle,
    this.propertyImage,
  });

  final String? conversationId;
  final String? propertyId;
  final String userName;
  final String? propertyTitle;
  final String? propertyImage;

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();
  final AudioRecorder _audioRecorder = AudioRecorder();
  bool _isRecording = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_openConversation);
  }

  Future<void> _openConversation() async {
    final notifier = ref.read(chatProvider.notifier);

    if (widget.conversationId != null) {
      await notifier.openConversation(widget.conversationId!);
    } else if (widget.propertyId != null) {
      await notifier.createAndOpenConversation(widget.propertyId!);
    }

    _scrollToBottom();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatProvider);
    final currentUserId = ref
            .watch(authenticationProvider)
            .authResponse
            ?.user
            .id ??
        '';

    ref.listen(chatProvider.select((value) => value.messages.length), (
      previous,
      next,
    ) {
      if (previous != next) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(
        elevation: 1,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.blue.shade100,
              backgroundImage: widget.propertyImage?.isNotEmpty == true
                  ? NetworkImage(widget.propertyImage!)
                  : null,
              child: widget.propertyImage?.isNotEmpty == true
                  ? null
                  : Text(
                      widget.userName.isEmpty
                          ? '?'
                          : widget.userName.substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.userName,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          if (widget.propertyTitle != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: Colors.orange.shade50,
              child: Row(
                children: [
                  const Icon(Icons.home, color: Colors.orange),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.propertyTitle!,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          if (state.error != null)
            MaterialBanner(
              content: Text(state.error!),
              actions: [
                TextButton(
                  onPressed: () {
                    ref.read(chatProvider.notifier).clearError();
                    _openConversation();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          Expanded(
            child: _buildMessages(state, currentUserId),
          ),
          MessageInput(
            onSend: (text) async {
              final sent = await ref
                  .read(chatProvider.notifier)
                  .sendMessage(text);
              if (sent) {
                _scrollToBottom();
              }
            },
            onTyping: (_) {},
            onCamera: () => _sendImage(ImageSource.camera),
            onGallery: () => _sendImage(ImageSource.gallery),
            onFile: _sendFile,
            onVoice: _toggleVoice,
          ),
          if (state.isSending)
            const LinearProgressIndicator(minHeight: 2),
        ],
      ),
    );
  }

  Future<void> _sendImage(ImageSource source) async {
    final image = await _imagePicker.pickImage(
      source: source,
      imageQuality: 82,
      maxWidth: 1920,
    );
    if (image == null) return;
    await ref.read(chatProvider.notifier).sendImage(File(image.path));
    _scrollToBottom();
  }

  Future<void> _sendFile() async {
    final files = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'doc', 'docx', 'txt'],
    );
    if (files.isEmpty) return;
    final path = files.single.path;
    if (path == null) return;
    await ref
        .read(chatProvider.notifier)
        .sendAttachment(File(path), 'DOCUMENT');
    _scrollToBottom();
  }

  Future<void> _toggleVoice() async {
    if (_isRecording) {
      final path = await _audioRecorder.stop();
      if (mounted) setState(() => _isRecording = false);
      if (path != null) {
        await ref
            .read(chatProvider.notifier)
            .sendAttachment(File(path), 'VOICE');
        _scrollToBottom();
      }
      return;
    }

    if (!await _audioRecorder.hasPermission()) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Microphone permission is required.')),
      );
      return;
    }
    final directory = await getTemporaryDirectory();
    final path = '${directory.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _audioRecorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: path,
    );
    if (!mounted) return;
    setState(() => _isRecording = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Recording… tap the microphone to send.')),
    );
  }

  Widget _buildMessages(ChatState state, String currentUserId) {
    if (state.isLoadingMessages) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.messages.isEmpty) {
      return const Center(
        child: Text('No messages yet. Start the conversation.'),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 12),
      itemCount: state.messages.length,
      itemBuilder: (context, index) {
        final message = state.messages[index];
        return ChatBubble(
          message: message,
          isMine: message.senderId == currentUserId,
        );
      },
    );
  }
}
