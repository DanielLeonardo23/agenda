"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFinancialHealthSuggestions } from "@/app/actions";
import type { FinancialData, Correction, SavingsSuggestion } from "@/lib/types";
import { Loader2, AlertTriangle, Lightbulb } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export function AiSuggestions({ data }: { data: FinancialData }) {
  const [isPending, startTransition] = useTransition();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [savings, setSavings] = useState<SavingsSuggestion[]>([]);
  const { toast } = useToast();

  const handleGetSuggestions = () => {
    startTransition(async () => {
      const result = await getFinancialHealthSuggestions(data);
      if (result.success) {
        setCorrections(result.corrections || []);
        setSavings(result.savingsSuggestions || []);
        toast({
          title: "Analysis Complete",
          description: "We've analyzed your finances and have some suggestions.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.error,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health AI</CardTitle>
        <CardDescription>
          Get AI-powered insights and suggestions for your finances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGetSuggestions} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze My Finances"
          )}
        </Button>

        {corrections.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Potential Issues Found</AlertTitle>
            <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    {corrections.map((c, i) => <li key={i}>{c.suggestion}</li>)}
                </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {savings.length > 0 && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Personalized Savings Tips</AlertTitle>
            <AlertDescription>
                 <ul className="list-disc list-inside mt-2 space-y-1">
                    {savings.map((s, i) => <li key={i}>{s.suggestion}</li>)}
                </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
