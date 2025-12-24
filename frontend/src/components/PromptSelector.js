import { useState, useEffect } from "react";
import axios from "axios";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const PromptSelector = ({ apiUrl, onSelectPrompt }) => {
    const [prompts, setPrompts] = useState([]);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const res = await axios.get(`${apiUrl}/prompts`);
                setPrompts(res.data.prompts || []);
            } catch (err) {
                console.warn("Failed to fetch prompts, using defaults", err);
                setPrompts([
                    { name: "Chat (Default)", content: "" },
                    { name: "Smart Summary", content: "Summarize the following text..." },
                    { name: "MoM", content: "Generate Minutes of Meeting..." },
                    { name: "Action Table", content: "Create an action items table..." },
                    { name: "Decision Support Matrix", content: "Create a decision matrix..." }
                ]);
            }
        };
        fetchPrompts();
    }, [apiUrl]);

    if (prompts.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Insert Template">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Prompt Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {prompts.map((p) => (
                    <DropdownMenuItem
                        key={p.filename}
                        onClick={() => onSelectPrompt(p.content)}
                        className="cursor-pointer"
                    >
                        {p.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default PromptSelector;
