import express, { Response, Request } from 'express';
import { FakeSOSocket } from '../types/socket';
import { AddMessageRequest, Message } from '../types/types';
import { saveMessage, getMessages } from '../services/message.service';

const messageController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Checks if the provided message request contains the required fields.
   *
   * @param req The request object containing the message data.
   *
   * @returns `true` if the request is valid, otherwise `false`.
   */
  const isRequestValid = (req: AddMessageRequest): boolean => {
    const m = req?.body?.messageToAdd;
    const hasValidMsg = typeof m?.msg === 'string' && m.msg.trim().length > 0;
    const hasValidMsgFrom = typeof m?.msgFrom === 'string' && m.msgFrom.trim().length > 0;
    return hasValidMsg && hasValidMsgFrom;
  };

  /**
   * Validates the Message object to ensure it contains the required fields.
   *
   * @param message The message to validate.
   *
   * @returns `true` if the message is valid, otherwise `false`.
   */
  const isMessageValid = (message: Message): boolean => {
    const hasMsg = typeof message?.msg === 'string' && message.msg.trim().length > 0;
    const hasFrom = typeof message?.msgFrom === 'string' && message.msgFrom.trim().length > 0;
    return hasMsg && hasFrom;
  };

  /**
   * Handles adding a new message. The message is first validated and then saved.
   * If the message is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddMessageRequest object containing the message and chat data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addMessageRoute = async (req: AddMessageRequest, res: Response): Promise<void> => {
    try {
      if (!req?.body?.messageToAdd) {
        res.status(400).send('Invalid request');
        return;
      }
      const incoming = req.body.messageToAdd;

      const normalized: Message = {
        msg: incoming.msg?.toString().trim(),
        msgFrom: incoming.msgFrom?.toString().trim(),
        msgDateTime: incoming.msgDateTime ? new Date(incoming.msgDateTime) : new Date(),
        _id: incoming._id,
      };

      if (!isMessageValid(normalized)) {
        res.status(400).send('Invalid message body');
        return;
      }

      const resp = await saveMessage(normalized);
      if ('error' in resp) {
        res.status(500).json(resp);
        return;
      }

      // send to client
      socket.emit('messageUpdate', { msg: resp });

      res.status(200).json(resp);
    } catch {
      res.status(500).send('Error when adding message');
    }
  };

  /**
   * Fetch all messages in descending order of their date and time.
   * @param req The request object.
   * @param res The HTTP response object used to send back the messages.
   * @returns A Promise that resolves to void.
   */
  const getMessagesRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await getMessages();
      res.status(200).json(list);
    } catch {
      res.status(500).send('Error when fetching messages');
    }
  };

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addMessageRoute);
  router.get('/getMessages', getMessagesRoute);

  return router;
};

export default messageController;
