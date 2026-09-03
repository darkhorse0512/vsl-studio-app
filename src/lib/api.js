import { supabase } from './supabase'

/* ------------------------------------------------------------------ */
/* Edge function helper                                                */
/* ------------------------------------------------------------------ */

/**
 * supabase.functions.invoke() hides the response body on non-2xx replies.
 * Our functions always answer with { error, code }, so dig it out and throw
 * a real, readable Error.
 */
export async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    let message = error.message || 'Request failed'
    let code

    const response = error.context
    if (response && typeof response.json === 'function') {
      try {
        const payload = await response.json()
        if (payload?.error) message = payload.error
        if (payload?.code) code = payload.code
      } catch {
        /* body was not JSON - keep the generic message */
      }
    }

    const thrown = new Error(message)
    thrown.code = code
    throw thrown
  }

  return data
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, company, role, status, created_at, approved_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(userId, patch) {
  return unwrap(
    await supabase
      .from('profiles')
      .update({
        full_name: patch.full_name ?? null,
        company: patch.company ?? null,
      })
      .eq('id', userId)
      .select('id, email, full_name, company, role, status, created_at, approved_at')
      .single(),
  )
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const PROJECT_LIST_COLUMNS =
  'id, name, status, source_type, source_filename, analyzed_at, error_message, created_at, updated_at'

export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`${PROJECT_LIST_COLUMNS}, assets(id, type, version, created_at)`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, user_id, name, status, source_type, source_filename, storage_path, vsl_text, analysis, analysis_model, analyzed_at, error_message, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function createProject({
  userId,
  name,
  vslText,
  sourceType = 'paste',
  sourceFilename = null,
  storagePath = null,
}) {
  return unwrap(
    await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: name.trim(),
        vsl_text: vslText.trim(),
        source_type: sourceType,
        source_filename: sourceFilename,
        storage_path: storagePath,
        status: 'draft',
      })
      .select('id, name, status, created_at')
      .single(),
  )
}

export async function renameProject(id, name) {
  return unwrap(
    await supabase
      .from('projects')
      .update({ name: name.trim() })
      .eq('id', id)
      .select('id, name')
      .single(),
  )
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

export async function listAssets(projectId) {
  const { data, error } = await supabase
    .from('assets')
    .select('id, project_id, type, version, title, code, model, created_at')
    .eq('project_id', projectId)
    .order('version', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function deleteAsset(id) {
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ------------------------------------------------------------------ */
/* AI pipeline                                                         */
/* ------------------------------------------------------------------ */

/** Analyse the VSL. Returns the updated project row (with `analysis`). */
export async function analyzeProject(projectId) {
  const data = await callFunction('analyze-vsl', { projectId })
  return data.project
}

/** Generate one asset from the stored analysis. */
export async function generateAsset(projectId, type) {
  const data = await callFunction('generate-asset', { projectId, type })
  return data.asset
}

/* ------------------------------------------------------------------ */
/* Storage - the original uploaded file                                */
/* ------------------------------------------------------------------ */

export const UPLOAD_BUCKET = 'vsl-uploads'

export async function uploadSourceFile(userId, file) {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-80)
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(error.message)
  return path
}

export async function getSourceFileUrl(path) {
  const { data, error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .createSignedUrl(path, 60 * 10)

  if (error) throw new Error(error.message)
  return data.signedUrl
}
