import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';

interface IterationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onIterate: (prompt: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
}

const MAX_PROMPT_LENGTH = 100; // Maximum recommended prompt length

export function IterationDialog({ isOpen, onClose, onIterate, prompt, setPrompt }: IterationDialogProps) {
  const [charCount, setCharCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);

  useEffect(() => {
    setCharCount(prompt.length);
    setIsOverLimit(prompt.length > MAX_PROMPT_LENGTH);
  }, [prompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
  };

  const handleIterate = () => {
    onIterate(prompt);
  };

  // Calculate percentage for progress bar
  const progressPercentage = Math.min((charCount / MAX_PROMPT_LENGTH) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Improve Design</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="prompt">Custom Prompt (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="Add specific instructions for this iteration (e.g., 'Make it more minimalist', 'Use a blue color scheme', etc.)"
              value={prompt}
              onChange={handlePromptChange}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className={isOverLimit ? "text-red-500 font-medium" : ""}>
                  {charCount}/{MAX_PROMPT_LENGTH}
                </span>
                {isOverLimit && (
                  <span className="text-red-500">
                    Prompt is too long and may be truncated
                  </span>
                )}
              </div>
            </div>
            <Progress value={progressPercentage} className={isOverLimit ? "bg-red-200" : ""} />
            <p className="text-sm text-gray-500 mt-2">
              Keep your prompt concise for best results. Long prompts will be automatically truncated.
              The AI will maintain the original layout while applying your requested improvements.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleIterate}>Generate Improved Design</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 