import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socketManager } from "@/lib/socket";
import { Session as SessionType, User } from "@/types/session";
import { SessionCodeDisplay } from "@/components/SessionCodeDisplay";
import { NoteCard } from "@/components/NoteCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Session() {
  const [session, setSession] = useState<SessionType | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const socket = socketManager.connect();
    
    // Get session data from location state
    const sessionData = location.state as {
      session?: SessionType;
      userId?: string;
      isHost?: boolean;
    };

    if (!sessionData?.session) {
      navigate("/");
      return;
    }

    setSession(sessionData.session);
    setCurrentUserId(sessionData.userId || "");
    setIsHost(sessionData.isHost || false);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('session-updated', (updatedSession: SessionType) => {
      setSession(updatedSession);
    });

    socket.on('error', (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('session-updated');
      socket.off('error');
    };
  }, [location.state, navigate, toast]);

  const handleTextUpdate = (text: string) => {
    const socket = socketManager.getSocket();
    if (socket && currentUserId) {
      socket.emit('update-text', { text });
    }
  };

  const handleLeaveSession = () => {
    socketManager.disconnect();
    navigate("/");
  };

  const users = session ? Object.values(session.users) : [];
  const participantCount = users.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveSession}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Leave</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isHost ? "Host View" : "Participant"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-6">
              <SessionCodeDisplay code={session?.code || ""} />
              
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Participants ({participantCount})
                </h3>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-2 p-2 rounded-md ${
                        user.id === currentUserId
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        user.id === currentUserId ? 'bg-primary' : 'bg-muted-foreground'
                      }`} />
                      <span className="text-sm">
                        {user.name}
                        {user.id === currentUserId && " (You)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Collaborative Notes
              </h1>
              <p className="text-muted-foreground">
                {isHost 
                  ? "Welcome to your session! Share the code with participants to get started."
                  : "Add your thoughts and ideas. Only you can edit your own notes."
                }
              </p>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No participants yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Share the session code to invite others to collaborate
                    </p>
                  </div>
                ) : (
                  users.map((user) => (
                    <NoteCard
                      key={user.id}
                      user={user}
                      isOwnNote={user.id === currentUserId}
                      onTextChange={handleTextUpdate}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}