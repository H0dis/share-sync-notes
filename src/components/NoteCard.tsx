import { User } from "@/types/session";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { User as UserIcon, Edit3 } from "lucide-react";

interface NoteCardProps {
  user: User;
  isOwnNote: boolean;
  onTextChange?: (text: string) => void;
}

export function NoteCard({ user, isOwnNote, onTextChange }: NoteCardProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isOwnNote && onTextChange) {
      onTextChange(e.target.value);
    }
  };

  return (
    <Card className={`note-card ${isOwnNote ? 'own-note' : 'other-note'} relative`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isOwnNote ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {user.name}
            </h4>
            {isOwnNote && (
              <Edit3 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          {isOwnNote ? (
            <Textarea
              value={user.text}
              onChange={handleTextChange}
              placeholder="Share your thoughts..."
              className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 text-sm"
              rows={3}
            />
          ) : (
            <div className="min-h-[80px] text-sm text-foreground whitespace-pre-wrap">
              {user.text || (
                <span className="text-muted-foreground italic">No notes yet...</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isOwnNote && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      )}
    </Card>
  );
}