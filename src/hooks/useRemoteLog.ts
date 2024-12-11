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

const parseRoomId = (url: string): { cleanUrl: string; roomId: string } => {
  try {
    const urlObj = new URL(url);
    const roomId = urlObj.searchParams.get('room') ?? 'lobby';
    urlObj.search = '';
    return { cleanUrl: urlObj.toString(), roomId };
  } catch (e) {
    log.debug('Failed to parse URL', e);
    return { cleanUrl: url, roomId: 'rn-world-painter' };
  }
};

export const useRemoteLog = (url: string) => {
  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    try {
      const { cleanUrl, roomId } = parseRoomId(url);
      log.debug('Connecting to', cleanUrl, 'room:', roomId);

      const socket = new Socket(cleanUrl);

      socket.connect();

      const channel = socket.channel(`room:${roomId}`, {});

      channel
        .join()
        .receive('ok', (resp) => {
          log.debug(`[join] Joined room:${roomId} successfully`, resp);
          socketRef.current = socket;
          channelRef.current = channel;
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
    } catch (e) {
      log.debug('Failed to connect to', url, e);
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (channelRef.current) {
      channelRef.current
        .push('new_message', { body: message })
        .receive('ok', (resp) => {
          // log.debug('Message sent successfully', resp);
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
    ({ name, path, bounds, ...props }: SendSVGPathParams) => {
      if (channelRef.current) {
        const { x, y, width, height } = bounds;

        channelRef.current.push('new_message', {
          body: {
            ...props,
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
