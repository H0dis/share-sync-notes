export interface User {
  id: string;
  name: string;
  text: string;
}

export interface Session {
  code: string;
  users: Record<string, User>;
}

export interface SocketEvents {
  'join-session': (data: { code: string; name: string }) => void;
  'create-session': (name: string) => void;
  'update-text': (data: { text: string }) => void;
  'session-created': (data: { code: string }) => void;
  'session-joined': (data: { session: Session; userId: string }) => void;
  'session-updated': (session: Session) => void;
  'error': (message: string) => void;
}