import { useEffect, useState } from "react";
import { api } from "../services/api";
import KpiRow from "../components/KpiRow";
import WinLossDonutChart from "../components/WinLossDonutChart";
import ForecastTrendCard from "../components/ForecastTrendCard";
import FollowUpAlerts from "../components/FollowUpAlerts";
import StageDistributionChart from "../components/StageDistributionChart";
import PipelineBoard from "../components/PipelineBoard";
import NewDealModal from "../components/NewDealModal";
import DealDetailModal from "../components/DealDetailModal";

export default function Dashboard() {
  const [refreshToken, setRefreshToken] = useState(0);
  const bump = () => setRefreshToken((n) => n + 1);

  const [stages, setStages] = useState([]);
  useEffect(() => {
    api.stages.list().then(setStages);
  }, []);

  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(null);

  return (
    <div>
      <KpiRow refreshToken={refreshToken} />

      <div className="analytics-grid">
        <WinLossDonutChart refreshToken={refreshToken} />
        <ForecastTrendCard refreshToken={refreshToken} />
        <StageDistributionChart refreshToken={refreshToken} />
        <FollowUpAlerts refreshToken={refreshToken} />
      </div>

      <div className="page-header">
        <h2>قیف فروش</h2>
        <button onClick={() => setShowNewDeal(true)}>+ فرصت جدید</button>
      </div>
      <PipelineBoard refreshToken={refreshToken} onSelectDeal={setSelectedDealId} />

      {showNewDeal && (
        <NewDealModal stages={stages} onClose={() => setShowNewDeal(false)} onCreated={() => bump()} />
      )}

      {selectedDealId && (
        <DealDetailModal dealId={selectedDealId} onClose={() => setSelectedDealId(null)} onChanged={bump} />
      )}
    </div>
  );
}
