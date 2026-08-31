import ForecastBanner from "../components/ForecastBanner";
import FollowUpAlerts from "../components/FollowUpAlerts";
import PipelineBoard from "../components/PipelineBoard";

export default function Dashboard() {
  return (
    <div>
      <ForecastBanner />
      <FollowUpAlerts />
      <h2>قیف فروش</h2>
      <PipelineBoard />
    </div>
  );
}
