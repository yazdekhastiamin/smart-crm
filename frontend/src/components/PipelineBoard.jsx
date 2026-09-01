import { useEffect, useState } from "react";
import { api } from "../services/api";
import DealCard from "./DealCard";
import { formatToman } from "../utils/format";
import { STAGE_RAMP } from "../utils/theme";

export default function PipelineBoard({ refreshToken, onSelectDeal }) {
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stages.list(), api.deals.list()])
      .then(([stages, deals]) => {
        setStages(stages);
        setDeals(deals.filter((deal) => deal.status === "open"));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshToken]);

  if (loading) return <p>در حال بارگذاری قیف فروش...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  const openStages = stages.filter((stage) => !stage.isWon && !stage.isLost);

  return (
    <div className="pipeline-board">
      {openStages.map((stage, index) => {
        const stageDeals = deals.filter((deal) => deal.stageId === stage.id);
        const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

        return (
          <div className="pipeline-column" key={stage.id}>
            <div
              className="pipeline-column-header"
              style={{ borderTopColor: STAGE_RAMP[index % STAGE_RAMP.length] }}
            >
              <h3>{stage.name}</h3>
              <span className="pipeline-column-meta">
                {stageDeals.length} فرصت — {formatToman(stageTotal)}
              </span>
            </div>
            <div className="pipeline-column-body">
              {stageDeals.length === 0 && <p className="pipeline-empty">فرصتی در این مرحله نیست</p>}
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onClick={() => onSelectDeal(deal.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
