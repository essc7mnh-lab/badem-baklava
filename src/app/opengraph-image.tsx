import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BADEM BAKLAVA";
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
          backgroundColor: "#32060B", // عنابي ملكي داكن جداً ليعطي تبايناً حاداً للذهب
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
            border: "3px solid #C59B27",
            borderRadius: 28,
            display: "flex",
          }}
        />

        {/* الحاوية المركزية - تركيز كامل على الرمز واسم البراند فقط */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* الإطار البيضاوي الملكي (مكبر وسميك ليظهر في أصغر شاشة) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "130px",
              height: "190px",
              border: "7px solid #F3DC8B",
              borderRadius: "50%",
              marginBottom: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <span
              style={{
                fontFamily: "serif",
                fontSize: "105px",
                fontWeight: "900",
                color: "#F3DC8B",
                lineHeight: 1,
              }}
            >
              B
            </span>
          </div>

          {/* BADEM بحجم ضخم وخط عريض وحاد */}
          <div
            style={{
              fontFamily: "serif",
              fontSize: "82px",
              fontWeight: "900",
              letterSpacing: "0.22em",
              color: "#F3DC8B",
              marginBottom: "8px",
              textShadow: "0 4px 20px rgba(0,0,0,0.7)",
            }}
          >
            BADEM
          </div>

          {/* BAKLAVA واضحة وبارزة */}
          <div
            style={{
              fontFamily: "serif",
              fontSize: "26px",
              letterSpacing: "0.55em",
              color: "#FAF5ED",
              fontWeight: "700",
            }}
          >
            BAKLAVA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}