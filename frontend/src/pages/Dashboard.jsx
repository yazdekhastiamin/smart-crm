import { useEffect, useState } from "react";
import { api } from "../services/api";
import ForecastBanner from "../components/ForecastBanner";
import FollowUpAlerts from "../components/FollowUpAlerts";
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
      <ForecastBanner refreshToken={refreshToken} />
      <FollowUpAlerts refreshToken={refreshToken} />

      <div className="page-header">
        <h2>قیف فروش</h2>
        <button onClick={() => setShowNewDeal(true)}>+ فرصت جدید</button>
      </div>
      <PipelineBoard refreshToken={refreshToken} onSelectDeal={setSelectedDealId} />

      {showNewDeal && (
        <NewDealModal
          stages={stages}
          onClose={() => setShowNewDeal(false)}
          onCreated={() => bump()}
        />
      )}

      {selectedDealId && (
        <DealDetailModal
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
          onChanged={bump}
        />
      )}
    </div>
  );
}
