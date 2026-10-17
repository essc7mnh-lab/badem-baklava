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
          backgroundColor: "#2A050A",
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
            border: "2px solid #C59B27",
            borderRadius: 24,
            display: "flex",
          }}
        />

        {/* الحاوية المركزية المحمية لأبعاد واتساب */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "520px",
          }}
        >
          {/* الإطار البيضاوي لحرف B */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "75px",
              height: "115px",
              border: "3.5px solid #E5C058",
              borderRadius: "50%",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "serif",
                fontSize: "56px",
                fontWeight: "bold",
                color: "#E5C058",
              }}
            >
              B
            </span>
          </div>

          {/* BADEM */}
          <div
            style={{
              fontFamily: "serif",
              fontSize: "62px",
              fontWeight: "bold",
              letterSpacing: "0.24em",
              color: "#E5C058",
              marginBottom: "4px",
            }}
          >
            BADEM
          </div>

          {/* BAKLAVA */}
          <div
            style={{
              fontFamily: "serif",
              fontSize: "20px",
              letterSpacing: "0.5em",
              color: "#FAF5ED",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            BAKLAVA
          </div>

          {/* تفاصيل الهوية بالإنجليزية لمنع أي خطأ خطوط */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#E5C058",
              fontSize: "13px",
              letterSpacing: "0.3em",
              fontWeight: "bold",
            }}
          >
            ROYAL TURKISH CONFECTIONERY
          </div>

          <div
            style={{
              color: "#C2A882",
              fontSize: "12px",
              letterSpacing: "0.25em",
              marginTop: "8px",
            }}
          >
            RIYADH • SAUDI ARABIA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}