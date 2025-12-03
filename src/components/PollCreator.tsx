import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PollCreatorProps {
  onPollChange: (poll: { question: string; options: string[] } | null) => void;
}

export function PollCreator({ onPollChange }: PollCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setQuestion("");
      setOptions(["", ""]);
      onPollChange(null);
    } else {
      setIsOpen(true);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      updatePoll(question, newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    updatePoll(question, newOptions);
  };

  const updatePoll = (q: string, opts: string[]) => {
    const validOptions = opts.filter(o => o.trim());
    if (q.trim() && validOptions.length >= 2) {
      onPollChange({ question: q, options: validOptions });
    } else {
      onPollChange(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={isOpen ? "secondary" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
      >
        <BarChart3 className="w-4 h-4" />
        {isOpen ? "Remove Poll" : "Add Poll"}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
              <div>
                <Label htmlFor="poll-question" className="text-sm font-medium">
                  Poll Question
                </Label>
                <Input
                  id="poll-question"
                  placeholder="Ask your community..."
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    updatePoll(e.target.value, options);
                  }}
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Options</Label>
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}

                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addOption}
                    className="gap-1 text-muted-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
