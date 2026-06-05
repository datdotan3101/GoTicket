import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { downloadExcel } from '../../../utils/excelUtils';
import * as XLSX from 'xlsx';
import { notifySuccess, notifyError } from '../../../utils/toastUtils';

export default function StadiumConfigStep({ 
  totalCapacity, columnConfigs, setColumnConfigs, STADIUM_COLUMNS 
}) {
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const data = STADIUM_COLUMNS.map(col => ({
      "Block": col.id,
      "Price (VND)": ""
    }));
    downloadExcel(data, "Template", "stand_pricing_template.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const newConfigs = { ...columnConfigs };
        let updatedCount = 0;

        rows.forEach(row => {
          const blockId = (row['Block'] || row['Block ID'])?.toString().trim();
          const priceStr = row['Price (VND)']?.toString().trim();
          if (blockId && priceStr && !isNaN(priceStr) && newConfigs[blockId]) {
            newConfigs[blockId].price = String(Math.floor(Number(priceStr)));
            updatedCount++;
          }
        });

        setColumnConfigs(newConfigs);
        notifySuccess(`Successfully updated ${updatedCount} blocks`);
      } catch (error) {
        notifyError("Failed to parse Excel file");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleTier = (colId, tier) => {
    setColumnConfigs(prev => {
      const activeTiers = prev[colId].activeTiers.includes(tier)
        ? prev[colId].activeTiers.filter(t => t !== tier)
        : [...prev[colId].activeTiers, tier];
      return { ...prev, [colId]: { ...prev[colId], activeTiers } };
    });
  };

  return (
    <div className="mc-form-step">
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: '24px', padding: '40px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--color-slate-100)', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#1e1b4b' }}>Stadium Configuration</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
              <button className="mc-btn mc-btn-ghost" onClick={downloadTemplate} style={{ border: '1px solid var(--color-slate-300)', padding: '0 12px' }}>
                <Download size={18} style={{ marginRight: '6px' }} /> Template
              </button>
              <button className="mc-btn mc-btn-ghost" onClick={() => fileInputRef.current?.click()} style={{ border: '1px solid var(--color-slate-300)', padding: '0 12px' }}>
                <Upload size={18} style={{ marginRight: '6px' }} /> Import
              </button>
            </div>
          </div>

          <div className="mc-input-group" style={{ maxWidth: '400px', marginBottom: '40px' }}>
            <label style={{ fontSize: '0.9rem', color: '#1e1b4b', fontWeight: 800 }}>TOTAL STADIUM CAPACITY</label>
            <input type="number" className="mc-nice-input" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-orange)', background: 'var(--color-slate-100)', cursor: 'not-allowed' }} value={totalCapacity} readOnly />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {['A', 'B', 'C', 'D'].map(standName => {
              const columns = STADIUM_COLUMNS.filter(c => c.stand === standName);
              if (columns.length === 0) return null;
              return (
                <div key={standName} style={{ background: 'var(--color-slate-50)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-slate-200)', gridColumn: '1 / -1' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-800)' }}>Stand {standName}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {columns.map(col => {
                      const isActive = col.tiers.some(t => columnConfigs[col.id]?.activeTiers.includes(t));
                      return (
                        <div key={col.id} style={{ background: 'var(--color-white)', padding: '16px', borderRadius: '8px', border: `1px solid ${isActive ? 'var(--color-slate-300)' : 'var(--color-slate-200)'}` }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-slate-900)', fontSize: '1.1rem', marginBottom: '12px', display: 'block' }}>Block {col.id}</span>
                          <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <input 
                              type="number" className="mc-nice-input" placeholder="Ticket Price" style={{ width: '100%', paddingLeft: '45px' }} 
                              value={columnConfigs[col.id]?.price} min="0"
                              onChange={(e) => {
                                const val = e.target.value;
                                setColumnConfigs(p => ({ ...p, [col.id]: { ...p[col.id], price: val } }));
                                if (Number(val) < 0) notifyError('Ticket price cannot be negative');
                              }} 
                            />
                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-500)', fontSize: '0.75rem', fontWeight: 800 }}>VND</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {col.tiers.map(tier => (
                              <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-600)', background: 'var(--color-slate-50)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-200)' }}>
                                <input 
                                  type="checkbox" checked={columnConfigs[col.id]?.activeTiers.includes(tier)} 
                                  onChange={() => toggleTier(col.id, tier)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-600)' }}
                                /> Enable Floor {tier.replace('T', '')}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
