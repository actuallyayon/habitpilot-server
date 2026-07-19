import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function callLLM<T>(messages: any[], schema: z.ZodSchema<T>): Promise<T> {
  const jsonSchema = zodToJsonSchema(schema, "responseSchema");
  const systemMessage = {
    role: "system",
    content: `You are an expert AI habit coach. You must strictly output valid JSON matching the following schema. Do not output anything other than JSON.\n\nSchema: ${JSON.stringify(jsonSchema)}`
  };

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [systemMessage, ...messages],
    temperature: 0.2,
  });

  const rawJson = completion.choices[0]?.message?.content || "{}";
  const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  
  // Use Zod to parse and validate it fits
  return schema.parse(parsed);
}

// Stage 1: Onboarding Analysis
export const onboardingPlanSchema = z.object({
  habits: z.array(z.object({
    name: z.string(),
    trigger: z.string(),
    minVersion: z.string(),
    reason: z.string()
  })).min(3).max(5)
});

export const draftHabitPlan = async (goals: string[], obstacles: string, availableMinutes: number) => {
  const messages = [
    {
      role: 'user',
      content: `Create a habit stack for a user. Goals: ${goals.join(", ")}. Obstacles: ${obstacles}. Available time per day: ${availableMinutes} minutes. Return a JSON object with a "habits" array containing 3-5 habits. Each habit object MUST exactly match these keys: "name", "trigger", "minVersion" (the minimum viable version), and "reason".`
    }
  ];
  return callLLM(messages, onboardingPlanSchema);
};

// Stage 2: Daily Check-in reaction
export const dailyReactionSchema = z.object({
  agentReaction: z.string().describe("A short, specific, non-generic reaction referencing what the user wrote.")
});

export const generateDailyReaction = async (checkInEntries: any[]) => {
  const messages = [
    {
      role: 'user',
      content: `The user just checked in their daily habits. Here is the log: ${JSON.stringify(checkInEntries)}. Provide a short, specific, non-generic reaction (1-2 sentences) referencing their notes and performance.`
    }
  ];
  return callLLM(messages, dailyReactionSchema);
};

// Stage 3: Weekly Adaptive Replanning
export const weeklyReplanSchema = z.object({
  agentReasoning: z.string().describe("Why it is changing what it is changing"),
  proposedChanges: z.array(z.object({
    habitName: z.string(),
    action: z.enum(['swap_trigger', 'shrink_scope', 'replace', 'promote', 'keep']),
    newValue: z.string(),
    reason: z.string()
  }))
});

export const draftWeeklyReplan = async (habitStats: any[], recurringFrictionNotes: string[]) => {
  const messages = [
    {
      role: 'user',
      content: `Review the user's weekly habit performance: ${JSON.stringify(habitStats)}. Recurring friction notes from the week: ${JSON.stringify(recurringFrictionNotes)}. Propose adjustments (swap trigger, shrink scope, replace, promote, or keep). Output agentReasoning and a proposedChanges array.`
    }
  ];
  return callLLM(messages, weeklyReplanSchema);
};

// Stage 4: Monthly Insight Report
export const monthlyReportSchema = z.object({
  bestHabits: z.array(z.string()),
  worstHabits: z.array(z.string()),
  patternsFound: z.array(z.string()),
  recommendation: z.string()
});

export const draftMonthlyReport = async (monthData: any) => {
  const messages = [
    {
      role: 'user',
      content: `Generate a monthly insight report for this user's data: ${JSON.stringify(monthData)}. Find patterns (e.g. morning vs evening) and provide a recommendation for next month.`
    }
  ];
  return callLLM(messages, monthlyReportSchema);
};
