import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SessionCodeDisplayProps {
  code: string;
  className?: string;
}

export function SessionCodeDisplay({ code, className = "" }: SessionCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Session code copied!",
        description: "Share this code with participants to join the session.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please manually share the session code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-muted-foreground mb-2">
          Session Code
        </h2>
        <div className="session-code-display select-all">
          {code}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Share this code with participants
        </p>
      </div>
      
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy Code</span>
          </>
        )}
      </Button>
    </div>
  );
}