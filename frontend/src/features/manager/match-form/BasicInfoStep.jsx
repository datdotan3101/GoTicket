import React from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { UploadCloud } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

export default function BasicInfoStep({ 
  form, setForm, leagues, stadiums, clubOptions, 
  previewBannerUrl, setPreviewBannerUrl, setSelectedBannerFile 
}) {
  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', background: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
      <div className="mc-form-step" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '40px', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--color-slate-100)', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e1b4b' }}>Match Information</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>Enter the basic tournament and matchup details.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="mc-input-group">
              <label>LEAGUE NAME</label>
              <select className="mc-nice-input" value={form.leagueId} onChange={e => setForm(p => ({...p, leagueId: e.target.value}))}>
                <option value="" disabled>Select league</option>
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="mc-input-group">
              <label>STADIUM</label>
              <select className="mc-nice-input" value={form.stadiumId} onChange={e => setForm(p => ({...p, stadiumId: e.target.value}))}>
                <option value="" disabled>Select stadium</option>
                {stadiums.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="mc-input-group">
              <label>MATCH DATE & TIME</label>
              <DatePicker
                selected={form.matchDate ? new Date(form.matchDate) : null}
                onChange={(date) => setForm(p => ({...p, matchDate: date ? date.toISOString() : ''}))}
                minDate={new Date()}
                showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd/MM/yyyy HH:mm"
                className="mc-nice-input w-full" wrapperClassName="w-full !block" placeholderText="dd/mm/yyyy --:--"
              />
            </div>
            <div className="mc-input-group">
              <label>TICKET SALE OPEN AT</label>
              <DatePicker
                selected={form.ticketSaleOpenAt ? new Date(form.ticketSaleOpenAt) : null}
                onChange={(date) => setForm(p => ({...p, ticketSaleOpenAt: date ? date.toISOString() : ''}))}
                minDate={new Date()}
                maxDate={form.matchDate ? new Date(form.matchDate) : null}
                showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd/MM/yyyy HH:mm"
                className="mc-nice-input w-full" wrapperClassName="w-full !block" placeholderText="dd/mm/yyyy --:--"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="mc-input-group" style={{ minWidth: 0 }}>
              <label>HOME TEAM</label>
              <Select
                options={clubOptions} value={clubOptions.find(o => o.value === form.homeTeam) || null}
                onChange={(selected) => setForm(p => ({...p, homeTeam: selected ? selected.value : ''}))}
                placeholder="Select home team" isClearable isSearchable
              />
            </div>
            <div className="mc-input-group" style={{ minWidth: 0 }}>
              <label>AWAY TEAM</label>
              <Select
                options={clubOptions} value={clubOptions.find(o => o.value === form.awayTeam) || null}
                onChange={(selected) => setForm(p => ({...p, awayTeam: selected ? selected.value : ''}))}
                placeholder="Select away team" isClearable isSearchable
              />
            </div>
          </div>

          <div className="mc-input-group" style={{ marginTop: '24px' }}>
            <label>DESCRIPTION</label>
            <textarea className="mc-nice-input" rows={3} placeholder="Enter match description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e1b4b' }}>Featured Banner</h3>
          </div>
          <div style={{ border: '2px dashed var(--color-slate-300)', borderRadius: '16px', padding: '8px', textAlign: 'center', background: 'var(--color-slate-50)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
            {previewBannerUrl ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden' }}>
                <img src={previewBannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={(e) => { e.preventDefault(); setPreviewBannerUrl(null); setSelectedBannerFile(null); }}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'var(--color-white)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
                >×</button>
              </div>
            ) : (
              <div style={{ cursor: 'pointer', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => document.getElementById('banner-upload').click()}>
                <UploadCloud size={48} color="var(--color-slate-300)" style={{ marginBottom: '12px' }} />
                <div style={{ fontWeight: 800, color: 'var(--color-slate-600)', fontSize: '1rem' }}>Upload Banner</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)', marginTop: '4px' }}>Recommended: 1280x720 (16:9)</div>
              </div>
            )}
            <input id="banner-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files[0];
              if(file) { setPreviewBannerUrl(URL.createObjectURL(file)); setSelectedBannerFile(file); }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
