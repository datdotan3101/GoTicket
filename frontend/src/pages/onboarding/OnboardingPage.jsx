import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { sportService } from '../../services/sportService'
import { authService } from '../../services/authService'

export default function OnboardingPage() {
  const [sports, setSports] = useState([])
  const [selected, setSelected] = useState({ primary_sport_id: '', secondary_sport_id: '' })

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await sportService.getAll()
        setSports(response.data?.data ?? response.data ?? [])
      } catch {
        setSports([])
      }
    }

    fetchSports()
  }, [])

  const savePreferences = async () => {
    try {
      await authService.onboarding(selected)
      toast.success('Preferences saved.')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Cannot save preferences.')
    }
  }

  return (
    <section className="container page">
      <h1>Onboarding</h1>
      <p>Select your primary and secondary sports.</p>
      <div className="form">
        <select value={selected.primary_sport_id} onChange={(event) => setSelected((prev) => ({ ...prev, primary_sport_id: Number(event.target.value) || '' }))}>
          <option value="">Primary sport</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        <select value={selected.secondary_sport_id} onChange={(event) => setSelected((prev) => ({ ...prev, secondary_sport_id: Number(event.target.value) || '' }))}>
          <option value="">Secondary sport</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        <button type="button" onClick={savePreferences}>Save</button>
      </div>
    </section>
  )
}
