import React from "react";
import { ProgressSteps } from "../components/ProgressSteps";

export const Analysis = () => {
  return (
    <div className="app-container" style={{ padding: "40px 20px" }}>
      <ProgressSteps currentStageIndex={3} />
    </div>
  );
};
