import { useState, useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const AmberAlert = ({ showAmber }) => {
  const [amberList, setAmberList] = useState([]);

  useEffect(() => {
    if (!showAmber) return;

    const fetchAmber = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/amber`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rptDscd: ["1", "2"],
            writngTrgetDscd: [],
            occrSidoCode: [],
            occrSggCode: [],
            pageIndex: "1",
            pageUnit: "100",
            pageSize: "10",
          }),
        });
        const data = await response.json();
        if (data.list) {
          setAmberList(data.list.filter(it => it.lat && it.lng));
        }
      } catch (error) {
        console.error("실종자 데이터 로드 실패:", error);
      }
    };

    fetchAmber();
  }, [showAmber]);

  if (!showAmber || amberList.length === 0) return null;

  return (
    <>
      {amberList.map((item, i) => {
        const photo = item.tknphotolength !== "0"
          ? `https://www.safe182.go.kr/api/lcm/imgView.do?msspsnIdntfccd=${item.msspsnIdntfccd}`
          : null;
        const dateStr = item.occrde ? `${item.occrde.slice(0,4)}-${item.occrde.slice(4,6)}-${item.occrde.slice(6,8)}` : "-";

        return (
          <Marker
            key={`amber-${i}-${item.msspsnIdntfccd}`}
            position={[parseFloat(item.lat), parseFloat(item.lng)]}
            icon={L.divIcon({
              html: `<div style="background: #ff9800; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px;">🚨</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
            zIndexOffset={700}
          >
            <Popup>
              <div style={{ width: 220 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {photo && <img src={photo} alt={item.nm} width={64} height={84} style={{ objectFit: "cover", borderRadius: 6 }} />}
                  <div>
                    <strong>{item.nm || "이름미상"}</strong><br/>
                    발생일: {dateStr}<br/>
                    {item.sexdstnDscd} / 당시 {item.age}세
                  </div>
                </div>
                <div style={{ fontSize: "0.9em" }}>
                  장소: {item.occrAdres || "-"}<br/>
                  {item.alldressingDscd && `착의: ${item.alldressingDscd}`}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default AmberAlert;
