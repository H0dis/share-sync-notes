import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Server, Wifi, Globe, Info } from "lucide-react";
import { socketManager } from "@/lib/socket";

interface ServerSetupProps {
  onServerReady: () => void;
}

export function ServerSetup({ onServerReady }: ServerSetupProps) {
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'failed'>('idle');
  const [localIp, setLocalIp] = useState<string>("");

  useEffect(() => {
    // Try to detect local IP for convenience
    const detectLocalIp = async () => {
      try {
        // This is a simple heuristic - in production, you'd want a more robust method
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        // This gives external IP, but we show it as a hint
        console.log('External IP detected:', data.ip);
      } catch (error) {
        console.log('Could not detect IP');
      }
      
      // Show common local IP pattern as hint
      setLocalIp("192.168.1.x");
    };

    detectLocalIp();
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('idle');
    
    try {
      socketManager.setServerUrl(serverUrl);
      const socket = socketManager.connect();
      
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      await connectionPromise;
      setConnectionStatus('connected');
      setTimeout(() => onServerReady(), 1000);
      
    } catch (error) {
      setConnectionStatus('failed');
      socketManager.disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQuickConnect = (url: string) => {
    setServerUrl(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Server className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Connect to Server
          </h1>
          <p className="text-muted-foreground">
            Connect to your local Socket.IO server to start collaborating
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Make sure you have the Node.js server running locally. 
          The server should be accessible at the URL below. 
          For network collaboration, use your laptop's local IP address (e.g., {localIp}:3000).
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">Server URL</Label>
            <Input
              id="server-url"
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.100:3000"
              className="font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickConnect("http://localhost:3000")}
            >
              <Globe className="w-4 h-4 mr-2" />
              Localhost
            </Button>
            {localIp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickConnect(`http://${localIp.replace('x', '100')}:3000`)}
              >
                <Wifi className="w-4 h-4 mr-2" />
                Network ({localIp})
              </Button>
            )}
          </div>

          <Button
            onClick={testConnection}
            disabled={isConnecting || !serverUrl}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Connected! Redirecting...
              </>
            ) : (
              <>
                <Server className="w-4 h-4 mr-2" />
                Connect to Server
              </>
            )}
          </Button>

          {connectionStatus === 'failed' && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to connect to the server. Make sure the Socket.IO server is running at the specified URL.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-muted/30">
        <h3 className="font-medium mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Need to set up the server?
        </h3>
        <p className="text-sm text-muted-foreground">
          You'll need to run a separate Node.js + Socket.IO server. 
          The server code will be provided separately and should be run on your laptop or a local machine 
          that all participants can connect to via the local network.
        </p>
      </Card>
    </div>
  );
}