import '../../domain/entities/chat_entity.dart';
import '../../domain/repositories/chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  @override
  Future<List<ChatEntity>> load() async {
    return [
      const ChatEntity('Track progress', 'Built for RentEase workflows.'),
    ];
  }
}
