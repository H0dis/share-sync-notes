import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServerSetup } from "@/components/ServerSetup";
import { socketManager } from "@/lib/socket";
import { Session, User } from "@/types/session";
import { Users, Plus, LogIn, Presentation, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showServerSetup, setShowServerSetup] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [hostName, setHostName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we already have a connection
    const socket = socketManager.getSocket();
    if (socket?.connected) {
      setShowServerSetup(false);
    }
  }, []);

  const handleServerReady = () => {
    setShowServerSetup(false);
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim() || !joinName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both session code and your name.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    const socket = socketManager.getSocket();
    
    if (!socket) {
      toast({
        title: "Not connected",
        description: "Please connect to the server first.",
        variant: "destructive",
      });
      setIsJoining(false);
      return;
    }

    const joinPromise = new Promise<{ session: Session; userId: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join timeout'));
      }, 10000);

      socket.once('session-joined', (data: { session: Session; userId: string }) => {
        clearTimeout(timeout);
        resolve(data);
      });

      socket.once('error', (message: string) => {
        clearTimeout(timeout);
        reject(new Error(message));
      });
    });

    try {
      socket.emit('join-session', { 
        code: joinCode.toUpperCase().trim(), 
        name: joinName.trim() 
      });
      
      const { session, userId } = await joinPromise;
      
      navigate('/session', { 
        state: { 
          session, 
          userId, 
          isHost: false 
        } 
      });
    } catch (error) {
      toast({
        title: "Failed to join session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateSession = async () => {
    if (!hostName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your name to host a session.",
        variant: "destructive",
      });
      return;
    }

    setIsHosting(true);
    const socket = socketManager.getSocket();
    
    if (!socket) {
      toast({
        title: "Not connected",
        description: "Please connect to the server first.",
        variant: "destructive",
      });
      setIsHosting(false);
      return;
    }

    const createPromise = new Promise<{ code: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Create timeout'));
      }, 10000);

      socket.once('session-created', (data: { code: string }) => {
        clearTimeout(timeout);
        resolve(data);
      });

      socket.once('error', (message: string) => {
        clearTimeout(timeout);
        reject(new Error(message));
      });
    });

    try {
      socket.emit('create-session', hostName.trim());
      const { code } = await createPromise;
      
      // Wait a moment for the session to be fully created, then join as host
      setTimeout(() => {
        const joinAsHostPromise = new Promise<{ session: Session; userId: string }>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Host join timeout'));
          }, 5000);

          socket.once('session-joined', (data: { session: Session; userId: string }) => {
            clearTimeout(timeout);
            resolve(data);
          });

          socket.once('error', (message: string) => {
            clearTimeout(timeout);
            reject(new Error(message));
          });
        });

        socket.emit('join-session', { code, name: hostName.trim() });
        
        joinAsHostPromise.then(({ session, userId }) => {
          navigate('/session', { 
            state: { 
              session, 
              userId, 
              isHost: true 
            } 
          });
        }).catch((error) => {
          toast({
            title: "Failed to join as host",
            description: error instanceof Error ? error.message : "Unknown error occurred",
            variant: "destructive",
          });
          setIsHosting(false);
        });
      }, 500);
      
    } catch (error) {
      toast({
        title: "Failed to create session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsHosting(false);
    }
  };

  if (showServerSetup) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <ServerSetup onServerReady={handleServerReady} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
              Collaborative Notepad
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Perfect for conference rooms and group meetings. 
              Share ideas in real-time on any device.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Presentation className="w-4 h-4" />
                <span>Large screen friendly</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>Mobile optimized</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Real-time collaboration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Host Session */}
          <Card className="p-8 border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-elegant">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Host a Session
                </h2>
                <p className="text-muted-foreground">
                  Create a new collaborative session and get a unique code to share with participants.
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-left">
                  <Label htmlFor="host-name">Your Name</Label>
                  <Input
                    id="host-name"
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                  />
                </div>

                <Button
                  onClick={handleCreateSession}
                  disabled={isHosting || !hostName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isHosting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Join Session */}
          <Card className="p-8 border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-elegant">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <LogIn className="w-8 h-8 text-accent" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Join Session
                </h2>
                <p className="text-muted-foreground">
                  Enter the session code provided by the host to join and start collaborating.
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-left">
                  <Label htmlFor="join-code">Session Code</Label>
                  <Input
                    id="join-code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 4-character code"
                    className="mt-1 font-mono text-center text-lg"
                    maxLength={4}
                  />
                </div>

                <div className="text-left">
                  <Label htmlFor="join-name">Your Name</Label>
                  <Input
                    id="join-name"
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
                  />
                </div>

                <Button
                  onClick={handleJoinSession}
                  disabled={isJoining || !joinCode.trim() || !joinName.trim()}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Joining Session...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Join Session
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">How it Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <h4 className="font-medium">Host Creates Session</h4>
              <p className="text-sm text-muted-foreground">
                One person hosts and gets a unique 4-character code
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">2</span>
              </div>
              <h4 className="font-medium">Others Join</h4>
              <p className="text-sm text-muted-foreground">
                Participants enter the code and their name to join
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">3</span>
              </div>
              <h4 className="font-medium">Collaborate</h4>
              <p className="text-sm text-muted-foreground">
                Everyone can add notes that update in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
