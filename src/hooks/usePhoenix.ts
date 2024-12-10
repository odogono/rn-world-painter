import { useCallback, useEffect, useState } from 'react';

import { Channel, Socket } from 'phoenix';

import { createLogger } from '@helpers/log';

const log = createLogger('usePhoenix');

export const usePhoenix = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = 'wss://kid-large-rightly.ngrok-free.app/socket';

    log.debug('Connecting to', url);

    const socket = new Socket(url);

    socket.connect();

    const channel = socket.channel('room:lobby', {});

    channel
      .join()
      .receive('ok', (resp) => {
        log.debug('Joined successfully', resp);
        setIsConnected(true);

        setSocket(socket);
        setChannel(channel);
      })
      .receive('error', (resp) => {
        log.debug('Failed to join', resp);
        setIsConnected(false);
      });

    channel.on('new_message', (payload: any) => {
      log.debug('New message received', payload);
      setMessages((prevMessages) => [...prevMessages, payload]);
    });

    return () => {
      log.debug('Disconnecting from', url);
      channel.leave();
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (channel) {
        channel
          .push('new_message', { body: message })
          .receive('ok', (resp) => {
            log.debug('Message sent successfully', resp);
          })
          .receive('error', (resp) => {
            log.debug('Failed to send message', resp);
          });
      }
    },
    [channel]
  );

  const sendJSON = useCallback(
    (json: any) => {
      if (channel) {
        channel.push('new_message', { body: json });
      }
    },
    [channel]
  );

  return { isConnected, messages, sendMessage, sendJSON };
};
