export const dynamic = "force-dynamic"
import { ExamplesTable } from "@/components/admin/ExamplesTable"
import { createServiceClient } from "@/lib/supabase/server"
import type { FewShotExample } from "@/types"

async function getExamples(): Promise<FewShotExample[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("few_shot_examples")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export default async function ExamplesPage() {
  const examples = await getExamples()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Few-shot Examples</h1>
      <p className="text-slate-400 text-sm mb-8">
        Q&amp;A examples injected into the AI context to guide Tinni&apos;s response style.
      </p>
      <ExamplesTable examples={examples} />
    </div>
  )
}
