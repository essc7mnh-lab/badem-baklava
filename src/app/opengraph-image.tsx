import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BADEM BAKLAVA | متجر بادَم للبقلاوة الفاخرة";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at center, #4A0E17 0%, #2A060B 60%, #150204 100%)",
          position: "relative",
        }}
      >
        {/* إطار ذهبي خارجي فخم */}
        <div
          style={{
            position: "absolute",
            top: 24,
            bottom: 24,
            left: 24,
            right: 24,
            border: "1.5px solid rgba(197, 155, 39, 0.35)",
            borderRadius: 24,
          }}
        />

        {/* حاوية الشعار والمحتوى في المنتصف (Safe Zone للمربع والمستطيل) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "580px", // لضمان بقائه كاملاً عند قص واتساب المربع
          }}
        >
          {/* 1. رمز الشعار البيضاوي Vector SVG */}
          <svg
            width="90"
            height="135"
            viewBox="0 0 100 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="ogGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5E29D" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA7C11" />
              </linearGradient>
            </defs>

            <rect
              x="12"
              y="6"
              width="76"
              height="138"
              rx="38"
              stroke="url(#ogGold)"
              strokeWidth="5"
            />

            <g stroke="url(#ogGold)" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M44 98 C39 75, 43 48, 52 36 C63 46, 68 63, 58 75 C54 79, 48 80, 44 80"
                strokeWidth="4"
              />
              <path d="M51 42 C51 55, 49 68, 46 78" strokeWidth="3" />
              <path
                d="M48 79 C67 79, 70 106, 51 108 C43 109, 36 105, 33 101"
                strokeWidth="4.2"
              />
              <path d="M44 88 C44 96, 45 103, 47 108" strokeWidth="3.5" />
            </g>
          </svg>

          {/* 2. اسم البراند الرئيسي */}
          <div
            style={{
              fontFamily: "serif",
              fontSize: "56px",
              fontWeight: "bold",
              letterSpacing: "0.22em",
              color: "#F3DC8B",
              marginTop: "16px",
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            BADEM
          </div>

          <div
            style={{
              fontFamily: "serif",
              fontSize: "18px",
              letterSpacing: "0.45em",
              color: "rgba(229, 192, 88, 0.9)",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            BAKLAVA
          </div>

          {/* 3. شريط التميز */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "20px",
              color: "#E5C058",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            <span>✦</span>
            <span>أصالة الضيافة التركية</span>
            <span>✦</span>
          </div>

          <div
            style={{
              color: "#FAF5ED",
              fontSize: "16px",
              marginTop: "10px",
              opacity: 0.85,
            }}
          >
            بقلاوة تركية فاخرة بالفستق العنتابي والسمن البلدي النقي
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}