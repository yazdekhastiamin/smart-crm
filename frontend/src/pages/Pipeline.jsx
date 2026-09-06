import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { LIGHT, DARK, varsToStyle } from "../components/salesDashboard/colorTokens";
import PipelineTab from "../components/salesDashboard/PipelineTab";
import "../components/salesDashboard/salesDashboard.css";

export default function Pipeline({ refreshToken, onChanged }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = theme === "dark" ? DARK : LIGHT;
  const dir = language === "en" ? "ltr" : "rtl";

  return (
    <div className="sd-content" dir={dir} style={varsToStyle(colors.vars)}>
      <PipelineTab language={language} refreshToken={refreshToken} onChanged={onChanged} />
    </div>
  );
}
