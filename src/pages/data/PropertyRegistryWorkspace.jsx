import ModuleTabsPage from '../../components/ModuleTabsPage'
import BarangaysPage from '../BarangaysPage'
import CitiesPage from '../CitiesPage'
import PropertiesPage from '../PropertiesPage'
import ProvincesPage from '../ProvincesPage'
import RegionsPage from '../RegionsPage'

const tabs = [
  { id: 'properties', label: 'Properties', component: PropertiesPage },
  { id: 'regions', label: 'Regions', component: RegionsPage },
  { id: 'provinces', label: 'Provinces', component: ProvincesPage },
  { id: 'cities', label: 'Cities', component: CitiesPage },
  { id: 'barangays', label: 'Barangays', component: BarangaysPage },
]

export default function PropertyRegistryWorkspace() {
  return (
    <ModuleTabsPage
      title="Property Registry"
      description="Manage property records and the geographic reference data they depend on. All changes in these tabs are stored in the database."
      tabs={tabs}
    />
  )
}