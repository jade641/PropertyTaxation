export type ApiUser = {
  userId: number
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  role: string
  status: string
  emailVerified?: boolean
  lastLogin?: string | null
}

export type ApiUsersResponse = {
  users: ApiUser[]
  total: number
  page: number
  pageSize: number
}

export type ApiRegion = {
  regionId: number
  regionCode: string
  regionName: string
  description?: string | null
}

export type ApiProvince = {
  provinceId: number
  regionId: number
  provinceCode: string
  provinceName: string
}

export type ApiCity = {
  cityId: number
  provinceId: number
  cityCode: string
  cityName: string
  cityType: string
}

export type ApiBarangay = {
  barangayId: number
  cityId: number
  barangayCode: string
  barangayName: string
}

export type ApiProperty = {
  propertyId: number
  ownerId: number
  propertyType: string
  propertyNumber?: string | null
  titleNumber?: string | null
  addressLine1: string
  addressLine2?: string | null
  regionId: number
  provinceId: number
  cityId: number
  barangayId: number
  postalCode?: string | null
  lotArea?: number | null
  floorArea?: number | null
  marketValue?: number | null
  assessedValue?: number | null
  yearAcquired?: number | null
  registrationDate?: string | null
  status: string
  createdAt?: string
  updatedAt?: string
}

export type ApiTaxRate = {
  rateId: number
  propertyType: string
  ratePercentage: number
  effectiveFrom: string
  effectiveTo?: string | null
  description?: string | null
  createdBy?: number | null
  createdAt?: string
}

export type ApiTaxAssessment = {
  assessmentId: number
  propertyId: number
  taxYear: number
  quarter?: number | null
  assessedValue: number
  taxRate: number
  basicTax: number
  sefTax: number
  penalties: number
  discounts: number
  totalAmount: number
  dueDate: string
  status: string
  assessedBy?: number | null
  approvedBy?: number | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ApiPayment = {
  paymentId: number
  assessmentId: number
  payerId: number
  paymentReference: string
  paymentMethod: string
  amountPaid: number
  paymentDate?: string | null
  transactionId?: string | null
  bankName?: string | null
  checkNumber?: string | null
  status: string
  receiptNumber?: string | null
  processedBy?: number | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ApiPropertyDocument = {
  documentId: number
  propertyId: number
  documentType: string
  documentName: string
  filePath: string
  fileSize?: number | null
  uploadedBy?: number | null
  uploadedAt?: string
}

export type ApiComplianceRecord = {
  complianceRecordId: number
  propertyId: number
  assessmentId?: number | null
  caseNumber: string
  status: string
  dueDate: string
  reviewedAt?: string | null
  reviewedBy?: number | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ApiReportRecord = {
  reportRecordId: number
  reportCode: string
  reportName: string
  reportType: string
  periodStart: string
  periodEnd: string
  status: string
  totalProperties: number
  totalAssessedValue: number
  totalTaxDue: number
  totalCollected: number
  filePath?: string | null
  generatedBy: number
  approvedBy?: number | null
  generatedAt?: string
  updatedAt?: string
}

export type ApiActivityLog = {
  logId: number
  userId?: number | null
  action: string
  module: string
  severity: string
  description?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt?: string
}

export const buildUserDisplayName = (user?: ApiUser | null) => {
  if (!user) return 'Unknown User'
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return fullName || user.username || user.email || 'Unknown User'
}

export const buildUserMap = (users: ApiUser[]) => {
  return new Map(users.map((user) => [user.userId, user]))
}

export const buildBarangayMap = (barangays: ApiBarangay[]) => {
  return new Map(barangays.map((barangay) => [barangay.barangayId, barangay]))
}

export const buildCityMap = (cities: ApiCity[]) => {
  return new Map(cities.map((city) => [city.cityId, city]))
}

export const buildProvinceMap = (provinces: ApiProvince[]) => {
  return new Map(provinces.map((province) => [province.provinceId, province]))
}

export const buildRegionMap = (regions: ApiRegion[]) => {
  return new Map(regions.map((region) => [region.regionId, region]))
}

export const formatDateOnly = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export const formatCurrency = (value: number) => {
  return `₱ ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export const toQuarterLabel = (quarter?: number | null) => {
  if (!quarter) return 'Annual'
  return `Q${quarter}`
}

export const startOfMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const buildMonthlyPaymentSeries = (payments: ApiPayment[]) => {
  const buckets = new Map(startOfMonthLabels.map((label) => [label, 0]))

  payments
    .filter((payment) => payment.status === 'Completed' && payment.paymentDate)
    .forEach((payment) => {
      const date = new Date(payment.paymentDate as string)
      if (Number.isNaN(date.getTime())) return
      const key = startOfMonthLabels[date.getMonth()]
      buckets.set(key, (buckets.get(key) ?? 0) + Number(payment.amountPaid || 0))
    })

  return startOfMonthLabels.map((label) => ({
    name: label,
    collected: buckets.get(label) ?? 0,
  }))
}

export const groupPaymentsByAssessment = (payments: ApiPayment[]) => {
  const totals = new Map<number, number>()

  payments
    .filter((payment) => payment.status === 'Completed')
    .forEach((payment) => {
      totals.set(payment.assessmentId, (totals.get(payment.assessmentId) ?? 0) + Number(payment.amountPaid || 0))
    })

  return totals
}

export const normalizeStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'compliant':
    case 'paid':
    case 'published':
    case 'approved':
    case 'completed':
      return 'success'
    case 'pending':
    case 'forreview':
    case 'for review':
    case 'underreview':
    case 'under review':
      return 'warning'
    case 'late':
    case 'unpaid':
    case 'overdue':
    case 'critical':
    case 'failed':
    case 'suspended':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const documentTypeToFolder = (documentType: string) => {
  switch (documentType) {
    case 'TaxDeclaration':
      return 'Tax Declarations'
    case 'Title':
      return 'Property Documents'
    case 'DeedOfSale':
      return 'Legal Documents'
    case 'SurveyPlan':
      return 'Assessment Records'
    default:
      return 'Property Documents'
  }
}

export const inferDocumentTypeFromName = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'PDF'
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'Excel'
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'Word'
  return 'Image'
}

export const reportTypeToTab = (reportType: string) => {
  switch (reportType) {
    case 'BarangaySummary':
      return 'barangay'
    case 'MonthlyCollection':
      return 'monthly'
    case 'AnnualSummary':
      return 'annual'
    case 'DelinquencyList':
      return 'delinquency'
    default:
      return 'annual'
  }
}

export const reportTypeLabel = (reportType: string) => {
  switch (reportType) {
    case 'BarangaySummary':
      return 'Barangay Summary'
    case 'MonthlyCollection':
      return 'Monthly Report'
    case 'AnnualSummary':
      return 'Annual Report'
    case 'DelinquencyList':
      return 'Delinquency List'
    default:
      return reportType
  }
}