import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { matchService } from '../../../services/matchService';
import { stadiumService } from '../../../services/stadiumService';
import { leagueService } from '../../../services/leagueService';
import { clubService } from '../../../services/clubService';
import { uploadService } from '../../../services/uploadService';
import { unwrapData } from '../../../utils/apiData';
import { validateForm } from '../../../utils/validator';
import { getMatchBasicInfoSchema } from '../../../validations/match.validation';
import { redistributeStadiumSeats } from '../../../utils/seatDistribution';
import { notifySuccess, notifyError } from '../../../utils/toastUtils';
import { ArrowRight, CheckCircle, Rocket } from 'lucide-react';
import BasicInfoStep from './BasicInfoStep';
import StadiumConfigStep from './StadiumConfigStep';
import { STAND_RATIOS } from '../../../constants/standRatios';

const STADIUM_COLUMNS = [
  { id: 'A1', stand: 'A', tiers: ['T1', 'T2'] }, { id: 'A2', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'A3', stand: 'A', tiers: ['T1', 'T2'] }, { id: 'A4', stand: 'A', tiers: ['T1', 'T2'] },
  { id: 'A5', stand: 'A', tiers: ['T1', 'T2'] }, { id: 'B8', stand: 'B', tiers: ['T1'] },
  { id: 'B9', stand: 'B', tiers: ['T1'] }, { id: 'B10', stand: 'B', tiers: ['T1'] },
  { id: 'B12', stand: 'B', tiers: ['T1'] }, { id: 'B13', stand: 'B', tiers: ['T1'] },
  { id: 'B14', stand: 'B', tiers: ['T1'] }, { id: 'B15', stand: 'B', tiers: ['T1'] },
  { id: 'C', stand: 'C', tiers: ['T1'] }, { id: 'D', stand: 'D', tiers: ['T1'] },
];


export default function MatchFormPage() {
  const { matchId } = useParams();
  const isEditMode = Boolean(matchId);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const [form, setForm] = useState({
    leagueId: '', homeTeam: '', awayTeam: '', matchDate: '',
    ticketSaleOpenAt: '', stadiumId: '', description: '',
  });

  const [totalCapacity, setTotalCapacity] = useState('0');
  const [columnConfigs, setColumnConfigs] = useState(
    STADIUM_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: { price: '', activeTiers: [...col.tiers] } }), {})
  );

  const [stadiums, setStadiums] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState(null);

  const clubOptions = useMemo(() => clubs.filter(c => form.leagueId ? String(c.league_id) === String(form.leagueId) : false).map(c => ({ value: c.name, label: c.name })), [clubs, form.leagueId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [stadiumsRes, leaguesRes, clubsRes] = await Promise.all([
          stadiumService.getAll(), leagueService.getAll(), clubService.getAll({ limit: 200 })
        ]);
        setStadiums(unwrapData(stadiumsRes) || []);
        setLeagues(unwrapData(leaguesRes)?.data || unwrapData(leaguesRes) || []);
        setClubs(unwrapData(clubsRes)?.data || unwrapData(clubsRes) || []);

        if (isEditMode) {
          const matchRes = await matchService.getById(matchId);
          const match = unwrapData(matchRes);
          setForm({
            leagueId: match.league_id, homeTeam: match.home_team || '', awayTeam: match.away_team || '',
            matchDate: match.match_date ? String(match.match_date).slice(0, 16) : '',
            ticketSaleOpenAt: match.ticket_sale_open_at ? String(match.ticket_sale_open_at).slice(0, 16) : '',
            stadiumId: match.stadium_id || '', description: match.description || '',
          });
          if (match.thumbnail_url) setPreviewBannerUrl(match.thumbnail_url);
        }
      } catch {
        notifyError('Failed to load data');
      }
    };
    load();
  }, [matchId, isEditMode]);

  useEffect(() => {
    if (form.stadiumId && stadiums.length > 0) {
      const selected = stadiums.find(s => String(s.id) === String(form.stadiumId));
      setTotalCapacity(selected?.capacity ? selected.capacity.toString() : '0');
    } else {
      setTotalCapacity('0');
    }
  }, [form.stadiumId, stadiums]);

  const blockConfigs = useMemo(() => {
    const configs = {};
    const total = Number(totalCapacity) || 0;
    const activeBlocks = [];
    STADIUM_COLUMNS.forEach(col => col.tiers.forEach(tier => {
      if (columnConfigs[col.id].activeTiers.includes(tier)) activeBlocks.push({ colId: col.id, stand: col.stand, tier, blockId: `${col.id}-${tier}` });
    }));
    try {
      const standTotals = { A: Math.floor(total * STAND_RATIOS.A), B: Math.floor(total * STAND_RATIOS.B), C: Math.floor(total * STAND_RATIOS.C), D: Math.floor(total * STAND_RATIOS.D) };
      const seatDistribution = redistributeStadiumSeats(total, activeBlocks, standTotals);
      activeBlocks.forEach(block => {
        configs[block.blockId] = { price: Number(columnConfigs[block.colId].price) || 0, capacity: seatDistribution[block.blockId] || 0, active: true };
      });
    } catch (e) {}
    STADIUM_COLUMNS.forEach(col => col.tiers.forEach(tier => {
      const blockId = `${col.id}-${tier}`;
      if (!configs[blockId]) configs[blockId] = { price: Number(columnConfigs[col.id].price) || 0, capacity: 0, active: false };
    }));
    return configs;
  }, [columnConfigs, totalCapacity]);

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      const schema = getMatchBasicInfoSchema(form, isEditMode, previewBannerUrl);
      return validateForm(form, schema);
    }
    if (currentStep === 2) {
      if (!totalCapacity || Number(totalCapacity) <= 0) return notifyError('Invalid capacity'), false;
      for (const col of STADIUM_COLUMNS) if (!columnConfigs[col.id].price || Number(columnConfigs[col.id].price) < 0) return notifyError('Invalid price for Block ' + col.id), false;
      if (!Object.keys(blockConfigs).some(k => blockConfigs[k].active)) return notifyError('Enable at least one stand'), false;
      return true;
    }
    return true;
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      let uploadedBannerUrl = previewBannerUrl;
      if (selectedBannerFile) {
        try {
          const uploadRes = await uploadService.uploadFile(selectedBannerFile);
          uploadedBannerUrl = uploadRes.data?.url || uploadRes.url || null;
        } catch { notifyError("Banner upload failed, proceeding without new image."); }
      }

      const basicPayload = {
        homeTeam: form.homeTeam, awayTeam: form.awayTeam, matchDate: form.matchDate,
        stadiumId: Number(form.stadiumId), leagueId: Number(form.leagueId),
        description: form.description, thumbnailUrl: uploadedBannerUrl, ticketSaleOpenAt: form.ticketSaleOpenAt,
      };

      if (isEditMode) {
        await matchService.update(matchId, basicPayload);
        await matchService.submit(matchId);
        notifySuccess('Match updated and submitted!');
      } else {
        const matchRes = await matchService.create(basicPayload);
        const newMatchId = unwrapData(matchRes).id;
        try {
          await matchService.configureStands(newMatchId, { totalCapacity: Number(totalCapacity), blockConfigs });
          await matchService.submit(newMatchId);
        } catch (stepError) {
          try { await matchService.delete(newMatchId); } catch {}
          throw stepError;
        }
        notifySuccess('Match created and sent for approval!');
      }
      navigate('/manager');
    } catch (error) {
      notifyError(error.response?.data?.message || 'Workflow failed.');
    } finally {
      setIsSubmitting(false); setShowConfirmPopup(false);
    }
  };

  return (
    <section className="manager-create-page" style={{ padding: '60px 20px' }}>
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e1b4b', marginBottom: '12px' }}>{isEditMode ? 'Update Match' : 'Create New Match'}</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-slate-500)' }}>Configure your tournament event details {isEditMode ? '' : 'and stadium seating'}.</p>
        
        {!isEditMode && (
          <div className="mc-stepper" style={{ maxWidth: '800px', margin: '20px auto 0' }}>
            <div className={`mc-step ${step >= 1 ? 'active' : ''}`}><div className="mc-step-meta"><span className="mc-step-label">STEP 01</span><div className="mc-step-bar"></div></div><div className="mc-step-title">Basic Information</div></div>
            <div className={`mc-step ${step >= 2 ? 'active' : ''}`}><div className="mc-step-meta"><span className="mc-step-label">STEP 02</span><div className="mc-step-bar"></div></div><div className="mc-step-title">Configuration</div></div>
          </div>
        )}
      </div>

      <div className="mc-step-content" style={{ padding: '40px 0' }}>
        {step === 1 && (
          <BasicInfoStep form={form} setForm={setForm} leagues={leagues} stadiums={stadiums} clubOptions={clubOptions} previewBannerUrl={previewBannerUrl} setPreviewBannerUrl={setPreviewBannerUrl} setSelectedBannerFile={setSelectedBannerFile} />
        )}
        {step === 2 && !isEditMode && (
          <StadiumConfigStep totalCapacity={totalCapacity} columnConfigs={columnConfigs} setColumnConfigs={setColumnConfigs} STADIUM_COLUMNS={STADIUM_COLUMNS} />
        )}
      </div>

      <div className="mc-form-footer">
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="mc-btn mc-btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <div className="mc-footer-right">
            {step === 2 && !isEditMode && <button className="mc-btn mc-btn-secondary" onClick={() => setStep(1)}>Back</button>}
            {step === 1 && !isEditMode && <button className="mc-btn mc-btn-primary" onClick={() => validateStep(1) && setStep(2)}>Configure Stadium <ArrowRight size={18} /></button>}
            {step === 1 && isEditMode && <button className="mc-btn mc-btn-primary" onClick={() => validateStep(1) && handleSave()} disabled={isSubmitting}>Save Changes <CheckCircle size={18} /></button>}
            {step === 2 && !isEditMode && <button className="mc-btn mc-btn-primary" onClick={() => validateStep(2) && setShowConfirmPopup(true)}>Review & Publish <CheckCircle size={18} /></button>}
          </div>
        </div>
      </div>

      {showConfirmPopup && !isEditMode && (
        <div className="modal-overlay" onClick={() => setShowConfirmPopup(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}><Rocket size={40} color="var(--color-success)" /></div>
              <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Final Confirmation</h2>
              <p style={{ color: 'var(--color-slate-500)' }}>Please review the details before submission.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="mc-btn mc-btn-secondary" style={{ flex: 1, padding: '16px' }} onClick={() => setShowConfirmPopup(false)}>Go Back</button>
              <button className="mc-btn mc-btn-primary" style={{ flex: 2, padding: '16px' }} onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Confirm & Publish'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
