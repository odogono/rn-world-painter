import { useCallback, useEffect, useRef, useState } from 'react';

import { SkRect } from '@shopify/react-native-skia';
import { Channel, Socket } from 'phoenix';

import { createLogger } from '@helpers/log';

const log = createLogger('useRemoteLog');

export type SendSVGPathParams = {
  name: string;
  bounds: SkRect;
  path: string;
};

export const useRemoteLog = (url: string) => {
  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef<Channel | null>(null);

  // const [socket, setSocket] = useState<Socket | null>(null);
  // const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    log.debug('Connecting to', url);

    const socket = new Socket(url);

    socket.connect();

    const channel = socket.channel('room:lobby', {});

    channel
      .join()
      .receive('ok', (resp) => {
        log.debug('[join] Joined successfully', resp);

        socketRef.current = socket;
        channelRef.current = channel;
        log.debug('[join] Connected', channel);
      })
      .receive('error', (resp) => {
        log.debug('Failed to join', resp);
      });

    channel.on('new_message', (payload: any) => {
      log.debug('New message received', payload);
      setMessages((prevMessages) => [...prevMessages, payload]);
    });

    return () => {
      log.debug('Disconnecting from', url);
      channel.leave();
      socket.disconnect();
      channelRef.current = null;
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (channelRef.current) {
      channelRef.current
        .push('new_message', { body: message })
        .receive('ok', (resp) => {
          log.debug('Message sent successfully', resp);
        })
        .receive('error', (resp) => {
          log.debug('Failed to send message', resp);
        });
    }
  }, []);

  const sendJSON = useCallback((json: any) => {
    if (channelRef.current) {
      channelRef.current.push('new_message', { body: json });
    }
  }, []);

  const sendSVGPath = useCallback(
    ({ name, path, bounds }: SendSVGPathParams) => {
      if (channelRef.current) {
        const { x, y, width, height } = bounds;

        channelRef.current.push('new_message', {
          body: {
            type: 'svg_path',
            name,
            path,
            width: Number(width.toFixed(2)),
            height: Number(height.toFixed(2)),
            viewBox: `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`
          }
        });
      } else {
        log.debug('[sendSVGPath] No channel');
      }
    },
    []
  );

  return { messages, sendMessage, sendJSON, sendSVGPath };
};
