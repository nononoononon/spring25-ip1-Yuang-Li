import MessageModel from '../models/messages.model';
import { Message, MessageResponse } from '../types/types';

// function to create a standardized error response object with the given message
const errorResp = (msg: string): MessageResponse => ({ error: msg });

/**
 * Saves a new message to the database.
 *
 * @param {Message} message - The message to save
 *
 * @returns {Promise<MessageResponse>} - The saved message or an error message
 */
export const saveMessage = async (message: Message): Promise<MessageResponse> => {
  try {
    const text = message?.msg?.toString().trim();
    const from = message?.msgFrom?.toString().trim();
    const when = message?.msgDateTime ? new Date(message.msgDateTime) : new Date();

    if (!text || !from) return errorResp('Invalid message body');

    const created = await MessageModel.create({
      msg: text,
      msgFrom: from,
      msgDateTime: when,
    });

    return created.toObject() as Message;
  } catch {
    return errorResp('Failed to save message');
  }
};

/**
 * Retrieves all messages from the database, sorted by date in ascending order.
 *
 * @returns {Promise<Message[]>} - An array of messages. If an error occurs, an empty array is returned.
 */
export const getMessages = async (): Promise<Message[]> => {
  try {
    const list = await MessageModel.find({}).sort({ msgDateTime: 1 }).lean<Message[]>().exec();
    return list.sort(
      (a, b) => new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime(),
    );
  } catch {
    return [];
  }
};
