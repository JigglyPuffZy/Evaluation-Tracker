import { supabase } from './supabase'

export type ImportBatchRecord = {
  id: string
  source: string
  fileName: string
  rowCount: number
  importedBy: string | null
  notes: string | null
  createdAt: string
}

type DbImportBatch = {
  id: string
  source: string
  file_name: string
  row_count: number
  imported_by: string | null
  notes: string | null
  created_at: string
}

function mapBatch(row: DbImportBatch): ImportBatchRecord {
  return {
    id: row.id,
    source: row.source,
    fileName: row.file_name,
    rowCount: row.row_count,
    importedBy: row.imported_by,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export async function fetchImportBatches(limit = 30): Promise<ImportBatchRecord[]> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('id, source, file_name, row_count, imported_by, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data as DbImportBatch[]).map(mapBatch)
}

export async function deleteImportBatch(batchId: string): Promise<number> {
  const { count, error: countError } = await supabase
    .from('evaluations')
    .select('id', { count: 'exact', head: true })
    .eq('import_batch_id', batchId)

  if (countError) {
    throw new Error(countError.message)
  }

  const { error: deleteEvaluationsError } = await supabase
    .from('evaluations')
    .delete()
    .eq('import_batch_id', batchId)

  if (deleteEvaluationsError) {
    throw new Error(deleteEvaluationsError.message)
  }

  const { error: deleteBatchError } = await supabase.from('import_batches').delete().eq('id', batchId)

  if (deleteBatchError) {
    throw new Error(deleteBatchError.message)
  }

  return count ?? 0
}
