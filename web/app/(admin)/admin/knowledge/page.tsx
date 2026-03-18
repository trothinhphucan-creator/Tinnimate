import { KnowledgeUploader } from "@/components/admin/KnowledgeUploader"
import { createServiceClient } from "@/lib/supabase/server"
import type { KnowledgeDoc } from "@/types"

async function getDocs(): Promise<KnowledgeDoc[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("knowledge_docs")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export default async function KnowledgePage() {
  const docs = await getDocs()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Knowledge Base</h1>
      <p className="text-slate-400 text-sm mb-8">
        Documents are embedded and used as RAG context when users ask related questions.
      </p>
      <KnowledgeUploader docs={docs} />
    </div>
  )
}
