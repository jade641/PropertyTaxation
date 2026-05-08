import ModuleTabsPage from '../../components/ModuleTabsPage'
import TaxAssessmentsPage from '../TaxAssessmentsPage'
import TaxRatesPage from '../TaxRatesPage'

const tabs = [
  { id: 'assessments', label: 'Assessments', component: TaxAssessmentsPage },
  { id: 'rates', label: 'Tax Rates', component: TaxRatesPage },
]

export default function TaxCalculationWorkspace() {
  return (
    <ModuleTabsPage
      title="Tax Calculation"
      description="Create tax assessments and maintain tax rates from a single database-backed workspace."
      tabs={tabs}
    />
  )
}