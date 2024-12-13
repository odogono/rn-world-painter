import { createContext, useContext, useEffect, useState } from 'react';

import mitt, { Emitter } from 'mitt';

export type EventEmitter = Emitter<any>;

const EventsContext = createContext<EventEmitter | null>(null);

type EventsProviderProps = React.PropsWithChildren<object>;

export const EventsProvider = ({ children }: EventsProviderProps) => {
  const [emitter, setEmitter] = useState<EventEmitter | null>(null);

  if (emitter === null) {
    const mittEvents = mitt();
    setEmitter(mittEvents);
  }

  useEffect(() => {
    return () => {
      emitter?.off('*');
    };
  }, []);

  return (
    <EventsContext.Provider value={emitter}>{children}</EventsContext.Provider>
  );
};

export const useEvents = () => {
  const events = useContext(EventsContext);
  if (!events) throw new Error('EventsProvider not found');
  return events;
};
