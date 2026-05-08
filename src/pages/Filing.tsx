import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  FolderOpen,
  Lock,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AccessDenied, LimitedAccessBanner, ReadOnlyBanner } from '../components/RoleGuard'
import {
  ActionButton,
  DetailDialog,
  DetailRow,
  Pill,
  SectionPanel,
  StatCard,
  WorkspaceHero,
  surfaceSelectClassName,
  surfaceInputClassName,
} from '../components/recordWorkspace'
import api from '../api'
import { apiJson } from '../lib/apiClient'
import {
  documentTypeToFolder,
  formatDateOnly,
  inferDocumentTypeFromName,
} from '../lib/liveData'
import type { ApiProperty, ApiPropertyDocument } from '../lib/liveData'

type DocType = 'PDF' | 'Excel' | 'Image' | 'Word'
type FolderName = 'All Documents' | 'Tax Declarations' | 'Payment Receipts' | 'Property Documents' | 'Assessment Records' | 'Legal Documents' | 'Audit Files'
type UploadDocumentType = 'Title' | 'TaxDeclaration' | 'DeedOfSale' | 'SurveyPlan' | 'Other'

type DocFile = {
  id: string
  name: string
  type: DocType
  size: string
  date: string
  folder: FolderName
  propertyLabel: string
  raw: ApiPropertyDocument
}

type ToastState = { message: string; type: 'success' | 'error' }

const folders: FolderName[] = [
  'All Documents',
  'Tax Declarations',
  'Payment Receipts',
  'Property Documents',
  'Assessment Records',
  'Legal Documents',
  'Audit Files',
]

const uploadDocumentTypes: Array<{ value: UploadDocumentType; label: string }> = [
  { value: 'Title', label: 'Title' },
  { value: 'TaxDeclaration', label: 'Tax Declaration' },
  { value: 'DeedOfSale', label: 'Deed of Sale' },
  { value: 'SurveyPlan', label: 'Survey Plan' },
  { value: 'Other', label: 'Other' },
]

const typeConfig: Record<DocType, { color: string; bg: string }> = {
  PDF: { color: 'text-red-500', bg: 'bg-red-50' },
  Excel: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Image: { color: 'text-purple-500', bg: 'bg-purple-50' },
  Word: { color: 'text-blue-500', bg: 'bg-blue-50' },
}

const formatFileSize = (value?: number | null) => {
  if (!value) return '—'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const downloadMetadata = (doc: DocFile) => {
  const content = [
    `Document ID: ${doc.id}`,
    `Document Name: ${doc.name}`,
    `Property: ${doc.propertyLabel}`,
    `Document Type: ${doc.raw.documentType}`,
    `Stored Path: ${doc.raw.filePath}`,
    `Uploaded At: ${doc.date}`,
  ].join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${doc.id}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function Filing() {
  const navigate = useNavigate()
  const { can, user } = useAuth()

  if (!can('filing.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  const canUpload = can('filing.upload')
  const canDelete = can('filing.delete')
  const isAuditor = user?.role === 'Auditor'
  const isStaff = user?.role === 'Staff'

  const [docs, setDocs] = useState<DocFile[]>([])
  const [properties, setProperties] = useState<ApiProperty[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | ''>('')
  const [selectedDocumentType, setSelectedDocumentType] = useState<UploadDocumentType>('Title')
  const [activeFolder, setActiveFolder] = useState<FolderName>('All Documents')
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocFile | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const loadDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const [documentRecords, propertyRecords] = await Promise.all([
        apiJson<ApiPropertyDocument[]>('/PropertyDocuments'),
        apiJson<ApiProperty[]>('/Properties'),
      ])

      const propertyMap = new Map(propertyRecords.map((property) => [property.propertyId, property]))
      const mappedDocs = documentRecords
        .map((document) => {
          const property = propertyMap.get(document.propertyId)
          return {
            id: `DOC-${String(document.documentId).padStart(4, '0')}`,
            name: document.documentName,
            type: inferDocumentTypeFromName(document.documentName) as DocType,
            size: formatFileSize(document.fileSize),
            date: formatDateOnly(document.uploadedAt),
            folder: documentTypeToFolder(document.documentType) as FolderName,
            propertyLabel: property?.propertyNumber || `Property #${document.propertyId}`,
            raw: document,
          }
        })
        .sort((left, right) => {
          const leftTime = new Date(left.raw.uploadedAt ?? 0).getTime()
          const rightTime = new Date(right.raw.uploadedAt ?? 0).getTime()
          return rightTime - leftTime
        })

      setDocs(mappedDocs)
      setProperties(propertyRecords)
      if (propertyRecords.length > 0) {
        setSelectedPropertyId((current) => current || propertyRecords[0].propertyId)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load document metadata.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const matchFolder = activeFolder === 'All Documents' || doc.folder === activeFolder
      const query = search.trim().toLowerCase()
      const matchSearch =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        doc.folder.toLowerCase().includes(query) ||
        doc.propertyLabel.toLowerCase().includes(query)
      return matchFolder && matchSearch
    })
  }, [activeFolder, docs, search])

  const folderCounts = useMemo(() => {
    return folders.reduce(
      (accumulator, folder) => ({
        ...accumulator,
        [folder]: folder === 'All Documents' ? docs.length : docs.filter((doc) => doc.folder === folder).length,
      }),
      {} as Record<FolderName, number>,
    )
  }, [docs])

  const totalBytes = useMemo(() => {
    return docs.reduce((sum, doc) => sum + Number(doc.raw.fileSize || 0), 0)
  }, [docs])

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !canUpload) return
      if (!selectedPropertyId) {
        setToast({ message: 'Select a property before uploading metadata.', type: 'error' })
        return
      }

      setUploading(true)
      try {
        await Promise.all(
          Array.from(files).map((file) =>
            api.post('/PropertyDocuments', {
              propertyId: selectedPropertyId,
              documentType: selectedDocumentType,
              documentName: file.name,
              filePath: `uploads/${Date.now()}-${file.name}`,
              fileSize: file.size,
              uploadedBy: Number(user?.id ?? 0),
              uploadedAt: new Date().toISOString(),
            }),
          ),
        )
        await loadDocuments()
        setToast({ message: `${files.length} document metadata record(s) saved to the database.`, type: 'success' })
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : 'Unable to upload document metadata.'
        setToast({ message, type: 'error' })
      } finally {
        setUploading(false)
      }
    },
    [canUpload, selectedDocumentType, selectedPropertyId, user?.id],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(false)
      if (canUpload) {
        processFiles(event.dataTransfer.files)
      }
    },
    [canUpload, processFiles],
  )

  const handleDelete = async () => {
    if (!deleteTarget || !canDelete) return
    try {
      await api.delete(`/PropertyDocuments/${deleteTarget.raw.documentId}`)
      await loadDocuments()
      setToast({ message: 'Document metadata deleted.', type: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete document metadata.'
      setToast({ message, type: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-rose-500" />}
          {toast.message}
        </div>
      )}

      <WorkspaceHero
        eyebrow="Filing & Documentation"
        title="Secure property document metadata repository and filing system."
        description="Browse, upload, and manage property document records. Metadata is stored in the database; binary file storage is not yet configured."
        actions={
          <div className="flex flex-wrap gap-2">
            {canUpload && (
              <ActionButton icon={Plus} variant="secondary" onClick={() => navigate('/app/filing/manage')}>
                Manage Records
              </ActionButton>
            )}
            {canUpload ? (
              <ActionButton icon={UploadCloud} variant="primary" onClick={() => fileInputRef.current?.click()}>
                Upload Files
              </ActionButton>
            ) : (
              <ActionButton icon={Lock} variant="primary" disabled>
                Upload Files
              </ActionButton>
            )}
          </div>
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading' : `${docs.length} total documents`}</Pill>
            <Pill tone="slate">{loading ? '—' : `${formatFileSize(totalBytes)} tracked`}</Pill>
            <Pill tone={isAuditor ? 'amber' : 'emerald'}>{isAuditor ? 'Read-only' : canUpload ? 'Upload enabled' : 'View only'}</Pill>
          </div>
        }
      />

      <input ref={fileInputRef} type="file" multiple accept=".pdf,.xlsx,.xls,.docx,.jpg,.png" className="hidden" onChange={(event) => processFiles(event.target.files)} />

      {isAuditor && <ReadOnlyBanner message="Read-Only Mode — Auditors can browse and export document metadata but cannot upload or delete records." />}
      {isStaff && <LimitedAccessBanner message="Staff Mode — You can upload document metadata. Deleting files requires Accountant or Admin access." />}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load filing records</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Documents"
          value={loading ? '—' : docs.length}
          hint="Total document metadata records stored in the database."
          icon={FileText}
          tone="blue"
        />
        <StatCard
          label="Tax Declarations"
          value={loading ? '—' : folderCounts['Tax Declarations'] ?? 0}
          hint="Documents categorized under Tax Declarations."
          icon={Folder}
          tone="amber"
        />
        <StatCard
          label="Payment Receipts"
          value={loading ? '—' : folderCounts['Payment Receipts'] ?? 0}
          hint="Documents categorized under Payment Receipts."
          icon={Folder}
          tone="emerald"
        />
        <StatCard
          label="Legal Documents"
          value={loading ? '—' : folderCounts['Legal Documents'] ?? 0}
          hint="Documents categorized under Legal Documents."
          icon={Folder}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-1">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Folders</p>
          </div>
          <div className="space-y-0.5 p-3">
            {folders.map((folder) => {
              const isActive = activeFolder === folder
              return (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-2.5">
                    {isActive ? <FolderOpen className="h-4 w-4 flex-shrink-0" /> : <Folder className="h-4 w-4 flex-shrink-0 text-slate-400" />}
                    <span className="text-left text-sm">{folder}</span>
                  </div>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{folderCounts[folder]}</span>
                </button>
              )
            })}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs text-slate-500">Stored Metadata Volume</p>
            <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-slate-800" style={{ width: `${Math.min(100, docs.length > 0 ? (totalBytes / (50 * 1024 * 1024)) * 100 : 0)}%` }} />
            </div>
            <p className="text-xs text-slate-500">{formatFileSize(totalBytes)} tracked in database</p>
          </div>
        </div>

        <div className="space-y-6 md:col-span-3">
          {canUpload && (
            <SectionPanel
              title="Upload Document Metadata"
              description="Select a property and document type, then drag files or click to browse."
              icon={UploadCloud}
              bodyClassName="space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Property</span>
                  <select
                    value={selectedPropertyId}
                    onChange={(event) => setSelectedPropertyId(event.target.value ? Number(event.target.value) : '')}
                    className={surfaceSelectClassName}
                  >
                    {properties.length === 0 ? (
                      <option value="">No properties available</option>
                    ) : (
                      properties.map((property) => (
                        <option key={property.propertyId} value={property.propertyId}>
                          {property.propertyNumber || `Property #${property.propertyId}`}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Type</span>
                  <select
                    value={selectedDocumentType}
                    onChange={(event) => setSelectedDocumentType(event.target.value as UploadDocumentType)}
                    className={surfaceSelectClassName}
                  >
                    {uploadDocumentTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div
                onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragOver ? 'border-sky-400 bg-sky-50' : uploading ? 'cursor-not-allowed border-sky-300 bg-sky-50' : 'border-slate-300 hover:border-sky-300 hover:bg-slate-50'}`}
              >
                <div className={`mb-3 rounded-full p-4 ${dragOver || uploading ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                  <UploadCloud className={`h-7 w-7 ${uploading ? 'animate-bounce' : ''}`} />
                </div>
                {uploading ? (
                  <>
                    <p className="text-sm font-semibold text-slate-700">Uploading document metadata...</p>
                    <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-1.5 animate-pulse rounded-full bg-slate-800" style={{ width: '70%' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700">Drag & drop files here</p>
                    <p className="mt-1 text-xs text-slate-400">This stores file metadata in the database. Binary storage is not yet configured.</p>
                    <ActionButton variant="secondary" className="mt-4" fluidOnMobile={false}>
                      Browse Files
                    </ActionButton>
                  </>
                )}
              </div>
            </SectionPanel>
          )}

          <SectionPanel
            title={`${activeFolder}`}
            description="Search and manage document metadata records in the selected folder."
            icon={FileText}
            badge={<Pill tone="slate">{loading ? 'Loading' : `${filteredDocs.length} files`}</Pill>}
            bodyClassName="space-y-5"
          >
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search file name, property, folder..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`${surfaceInputClassName} pl-11`}
                />
              </div>
            </label>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">File Name</th>
                      <th className="px-5 py-3.5">Property</th>
                      <th className="px-5 py-3.5">Folder</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Size</th>
                      <th className="px-5 py-3.5">Uploaded</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading document records...</td></tr>
                    ) : filteredDocs.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No documents found in this folder.</td></tr>
                    ) : (
                      filteredDocs.map((doc) => {
                        const config = typeConfig[doc.type]
                        return (
                          <tr key={doc.id} className="align-top transition-colors hover:bg-slate-50/80">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 rounded-lg p-1.5 ${config.bg}`}>
                                  <File className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <span className="max-w-[200px] truncate font-medium text-slate-900" title={doc.name}>{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-700">{doc.propertyLabel}</td>
                            <td className="px-5 py-4">
                              <Pill tone="slate"><Folder className="h-3 w-3" /> {doc.folder}</Pill>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`rounded px-2 py-0.5 text-xs font-bold ${config.bg} ${config.color}`}>{doc.type}</span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500">{doc.size}</td>
                            <td className="px-5 py-4 text-sm text-slate-500">{doc.date}</td>
                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1.5">
                                <ActionButton
                                  icon={Eye}
                                  variant="secondary"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-sky-700 shadow-sm hover:border-sky-200 hover:bg-sky-50"
                                  onClick={() => setPreviewDoc(doc)}
                                  fluidOnMobile={false}
                                  title="Preview"
                                />
                                <ActionButton
                                  icon={Download}
                                  variant="secondary"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50"
                                  onClick={() => downloadMetadata(doc)}
                                  fluidOnMobile={false}
                                  title="Download Metadata"
                                />
                                {canDelete ? (
                                  <ActionButton
                                    icon={Trash2}
                                    variant="danger"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 shadow-sm hover:border-rose-200 hover:bg-rose-50"
                                    onClick={() => setDeleteTarget(doc)}
                                    fluidOnMobile={false}
                                    title="Delete"
                                  />
                                ) : (
                                  <div className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 text-slate-300" title="Delete restricted">
                                    <Lock className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {!canDelete && (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                  {isAuditor ? 'Auditors have view-only access. Upload and delete require higher permission.' : 'Deleting documents requires Accountant or Admin access.'}
                </div>
              )}
            </div>

            <div className="space-y-3 md:hidden">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading document records...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No documents found in this folder.</div>
              ) : (
                filteredDocs.map((doc) => {
                  const config = typeConfig[doc.type]
                  return (
                    <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`rounded-lg p-2 ${config.bg}`}><File className={`h-4 w-4 ${config.color}`} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.propertyLabel}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Pill tone="slate">{doc.folder}</Pill>
                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${config.bg} ${config.color}`}>{doc.type}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <ActionButton icon={Eye} onClick={() => setPreviewDoc(doc)} fluidOnMobile={false}>Preview</ActionButton>
                        <ActionButton icon={Download} variant="secondary" onClick={() => downloadMetadata(doc)} fluidOnMobile={false}>Download</ActionButton>
                        {canDelete && <ActionButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(doc)} fluidOnMobile={false}>Delete</ActionButton>}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </SectionPanel>
        </div>
      </div>

      {previewDoc && (
        <DetailDialog
          title="File Details"
          subtitle={previewDoc.propertyLabel}
          badge={<Pill tone="slate">{previewDoc.type}</Pill>}
          onClose={() => setPreviewDoc(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setPreviewDoc(null)}>Close</ActionButton>
              <ActionButton icon={Download} variant="primary" onClick={() => downloadMetadata(previewDoc)}>
                Download Metadata
              </ActionButton>
              {canDelete && (
                <ActionButton icon={Trash2} variant="danger" onClick={() => { setDeleteTarget(previewDoc); setPreviewDoc(null) }}>
                  Delete
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${typeConfig[previewDoc.type].bg}`}>
              <FileText className={`h-8 w-8 ${typeConfig[previewDoc.type].color}`} />
            </div>
            <p className="break-all text-center text-sm font-semibold text-slate-950">{previewDoc.name}</p>
            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Document ID" value={previewDoc.id} />
              <DetailRow label="Property" value={previewDoc.propertyLabel} />
              <DetailRow label="Stored Type" value={previewDoc.raw.documentType} />
              <DetailRow label="File Size" value={previewDoc.size} />
              <DetailRow label="Upload Date" value={previewDoc.date} />
              <DetailRow label="Folder" value={previewDoc.folder} />
              <DetailRow label="Stored Path" value={previewDoc.raw.filePath} />
            </div>
          </div>
        </DetailDialog>
      )}

      {deleteTarget && canDelete && (
        <DetailDialog
          title="Delete Document Metadata?"
          subtitle={deleteTarget.name}
          badge={<Pill tone="rose">Destructive action</Pill>}
          onClose={() => setDeleteTarget(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</ActionButton>
              <ActionButton icon={Trash2} variant="danger" onClick={handleDelete}>Delete Record</ActionButton>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <p className="break-all rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900">{deleteTarget.name}</p>
            <p className="text-center text-xs text-rose-600">This removes the database record. Any separately stored file will not be deleted automatically.</p>
          </div>
        </DetailDialog>
      )}
    </div>
  )
}