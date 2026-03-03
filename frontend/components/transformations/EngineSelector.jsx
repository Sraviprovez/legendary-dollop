"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { transformationEngines } from "@/lib/mock-data/catalog";
import { Check, Cpu, Zap, Box, Database, Rocket, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

// Inline Engine Logos (Simple SVG Wrappers)
const EngineIcon = ({ id, className }) => {
    if (id === "pyspark") return <Terminal className={cn("text-[#E25A1C]", className)} />;
    if (id === "glue") return <Box className={cn("text-[#FF9900]", className)} />;
    if (id === "databricks") return <Rocket className={cn("text-[#FF3621]", className)} />;
    if (id === "dbt") return <Zap className={cn("text-[#FF694A]", className)} />;
    return <Cpu className={cn("text-primary", className)} />;
};

export function EngineSelector({ open, onOpenChange, onSelect, currentEngineId, currentConfig }) {
    const [selectedEngine, setSelectedEngine] = useState(
        transformationEngines.find(e => e.id === currentEngineId) || transformationEngines[0]
    );
    const [config, setConfig] = useState(currentConfig || {});

    const handleConfigChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSelect({
            engineId: selectedEngine.id,
            engineName: selectedEngine.name,
            config: { ...config }
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Transformation Engine</DialogTitle>
                    <DialogDescription>
                        Choose the compute engine that will execute this transformation node.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
                    {transformationEngines.map((engine) => (
                        <div
                            key={engine.id}
                            onClick={() => {
                                setSelectedEngine(engine);
                                // Initialize config if engine changed
                                if (engine.id !== selectedEngine.id) {
                                    const newConfig = {};
                                    engine.configFields.forEach(f => newConfig[f.key] = f.default);
                                    setConfig(newConfig);
                                }
                            }}
                            className={cn(
                                "relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50",
                                selectedEngine.id === engine.id
                                    ? "border-primary bg-primary/5 shadow-inner"
                                    : "border-border bg-background"
                            )}
                        >
                            {selectedEngine.id === engine.id && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                            <EngineIcon id={engine.id} className="w-8 h-8 mb-3" />
                            <span className="font-bold text-sm">{engine.name}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-6 mt-4 p-6 rounded-xl bg-secondary/20 border">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-background border shadow-sm">
                            <EngineIcon id={selectedEngine.id} className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">{selectedEngine.name} Configuration</h4>
                            <p className="text-sm text-muted-foreground">{selectedEngine.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedEngine.features.map(f => (
                                    <Badge key={f} variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                        {f}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {selectedEngine.configFields.map((field) => (
                            <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key} className="text-sm font-medium">
                                    {field.label}
                                </Label>
                                {field.type === "select" ? (
                                    <Select
                                        value={config[field.key] || field.default}
                                        onValueChange={(val) => handleConfigChange(field.key, val)}
                                    >
                                        <SelectTrigger id={field.key} className="bg-background">
                                            <SelectValue placeholder="Select option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id={field.key}
                                        type={field.type}
                                        className="bg-background"
                                        placeholder={field.placeholder}
                                        value={config[field.key] || ""}
                                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Configuration</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
