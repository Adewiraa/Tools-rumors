export interface RumorCategory {
  label: string;
  description: string;
  range: string;
  tone: "quiet" | "watch" | "active" | "hot" | "done";
}

export function getRumorCategory(percentage: number): RumorCategory {
  const safePercentage = Math.max(0, Math.min(100, percentage));

  if (safePercentage <= 30) {
    return {
      label: "Rumor saja",
      description: "Masih sebatas bisik-bisik pasar transfer.",
      range: "1–30%",
      tone: "quiet",
    };
  }

  if (safePercentage <= 50) {
    return {
      label: "Sudah ada pembicaraan",
      description: "Kontak awal mulai terbuka antar pihak.",
      range: "31–50%",
      tone: "watch",
    };
  }

  if (safePercentage <= 70) {
    return {
      label: "Negosiasi serius",
      description: "Diskusi berjalan dan detail transfer mulai dibahas.",
      range: "51–70%",
      tone: "active",
    };
  }

  if (safePercentage <= 85) {
    return {
      label: "Advanced talks",
      description: "Kesepakatan semakin dekat, tinggal tahap penting.",
      range: "71–85%",
      tone: "hot",
    };
  }

  return {
    label: "Hampir resmi",
    description: "Transfer sangat kuat, menunggu konfirmasi akhir.",
    range: "86–100%",
    tone: "done",
  };
}
