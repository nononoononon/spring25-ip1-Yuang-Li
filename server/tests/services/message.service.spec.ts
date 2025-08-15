import MessageModel from '../../models/messages.model';
import { getMessages, saveMessage } from '../../services/message.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

const message1 = {
  msg: 'Hello',
  msgFrom: 'User1',
  msgDateTime: new Date('2024-06-04'),
};

const message2 = {
  msg: 'Hi',
  msgFrom: 'User2',
  msgDateTime: new Date('2024-06-05'),
};

describe('Message model', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('saveMessage', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should return the saved message', async () => {
      mockingoose(MessageModel).toReturn(message1, 'create');

      const savedMessage = await saveMessage(message1);

      expect(savedMessage).toMatchObject(message1);
    });
    // test case for saveMessage when an error occurs
    it('should return errorResp when msg or msgFrom is missing', async () => {
      const result = await saveMessage({ msg: '', msgFrom: 'User1' } as never);
      expect(result).toEqual({ error: 'Invalid message body' });
    });
  });

  describe('getMessages', () => {
    it('should return all messages, sorted by date', async () => {
      mockingoose(MessageModel).toReturn([message2, message1], 'find');

      const messages = await getMessages();

      expect(messages).toMatchObject([message1, message2]);
    });
    //  test case for getMessages when an error occurs
    it('should return empty array on error', async () => {
      mockingoose(MessageModel).toReturn(new Error('DB error'), 'find');

      const result = await getMessages();
      expect(result).toEqual([]);
    });

    it('should return an empty array when no messages exist', async () => {
      mockingoose(MessageModel).toReturn([], 'find');

      const result = await getMessages();
      expect(result).toEqual([]);
    });
  });
});
