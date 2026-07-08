"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { CanvasPreview } from "@/components/gosball/canvas-preview";
import { ControlSidebar } from "@/components/gosball/control-sidebar";
import {
  defaultLineupData,
  defaultRumorData,
} from "@/lib/gosball-fixtures";
import type {
  CanvasAspectRatio,
  FormationName,
  MatchdayLineupData,
  TeamLineup,
  ToolMode,
  TransferRumorData,
} from "@/types/gosball";

export function GosballMediaTools() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ToolMode>("lineup");
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("1:1");
  const [lineupData, setLineupData] =
    useState<MatchdayLineupData>(defaultLineupData);
  const [rumorData, setRumorData] =
    useState<TransferRumorData>(defaultRumorData);
  const [isExporting, setIsExporting] = useState(false);

  const handleModeChange = (nextMode: ToolMode) => {
    setMode(nextMode);
    setAspectRatio(nextMode === "lineup" ? "1:1" : "9:16");
  };

  const handleFormationChange = (
    teamKey: "homeTeam" | "awayTeam",
    formation: FormationName,
  ) => {
    setLineupData((current) => ({
      ...current,
      [teamKey]: {
        ...current[teamKey],
        formation,
      } satisfies TeamLineup,
    }));
  };

  const handleDownload = async () => {
    if (!canvasRef.current) {
      return;
    }

    try {
      setIsExporting(true);
      canvasRef.current.dataset.exporting = "true";
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#f6f9fc",
      });
      const link = document.createElement("a");
      link.download = `gosball-${mode}-${aspectRatio.replace(":", "x")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      if (canvasRef.current) {
        delete canvasRef.current.dataset.exporting;
      }
      setIsExporting(false);
    }
  };

  return (
    <main className="gosball-stripe min-h-dvh overflow-x-hidden bg-[#f6f9fc] text-[#061B31]">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(360px,34%)_1fr]">
        <ControlSidebar
          mode={mode}
          aspectRatio={aspectRatio}
          lineupData={lineupData}
          rumorData={rumorData}
          isExporting={isExporting}
          onModeChange={handleModeChange}
          onAspectRatioChange={setAspectRatio}
          onLineupChange={setLineupData}
          onRumorChange={setRumorData}
          onFormationChange={handleFormationChange}
          onDownload={handleDownload}
        />
        <section className="order-1 flex min-h-[540px] items-center justify-center bg-[radial-gradient(circle_at_24%_0%,rgba(83,58,253,0.12),transparent_28rem),radial-gradient(circle_at_88%_16%,rgba(255,97,24,0.10),transparent_22rem),#f6f9fc] p-3 sm:p-5 lg:order-2 lg:min-h-[720px] lg:p-8">
          <CanvasPreview
            ref={canvasRef}
            mode={mode}
            aspectRatio={aspectRatio}
            lineupData={lineupData}
            rumorData={rumorData}
          />
        </section>
      </div>
    </main>
  );
}
