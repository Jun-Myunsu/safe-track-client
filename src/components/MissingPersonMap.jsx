import { useEffect, useState, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// 안전드림 API 호출 (서버 프록시 사용)
async function fetchAmberList({
  rowSize = 50,
  page = 1,
  writngTrgetDscds = ["010", "060", "070"],
  occrAdres = "",
} = {}) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  const res = await fetch(`${serverUrl}/api/amber`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rowSize: String(rowSize),
      page: String(page),
      writngTrgetDscds,
      sexdstnDscd: "",
      nm: "",
      detailDate1: "",
      detailDate2: "",
      age1: "",
      age2: "",
      occrAdres,
      xmlUseYN: "",
    }),
  });

  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return await res.json();
}

// 지오코딩 (단계적 축약 재시도)
async function geocodeAddress(addr) {
  if (!addr) return null;
  
  const tryGeocode = async (address) => {
    const u = new URL("https://nominatim.openstreetmap.org/search");
    u.searchParams.set("format", "json");
    u.searchParams.set("q", address);
    u.searchParams.set("limit", "1");
    const res = await fetch(u.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const { lat, lon } = arr[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  };
  
  // 1차 시도: 전체 주소
  let result = await tryGeocode(addr);
  if (result) return result;
  
  // 2차 시도: 시/군/구까지만
  const parts = addr.split(' ');
  if (parts.length >= 3) {
    result = await tryGeocode(parts.slice(0, 3).join(' '));
    if (result) return result;
  }
  
  // 3차 시도: 시/도까지만
  if (parts.length >= 2) {
    result = await tryGeocode(parts.slice(0, 2).join(' '));
    if (result) return result;
  }
  
  return null;
}

// 역지오코딩 (좌표 -> 주소)
async function reverseGeocode(lat, lng) {
  const u = new URL("https://nominatim.openstreetmap.org/reverse");
  u.searchParams.set("format", "json");
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lng));
  const res = await fetch(u.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.address?.city || data.address?.county || data.address?.state || "";
}

// 실종자 마커 아이콘
const createMissingPersonIcon = () =>
  L.divIcon({
    html: `<div style="background: linear-gradient(135deg, #ffd700, #ffaa00); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(255, 215, 0, 0.6); display: flex; align-items: center; justify-content: center; animation: pulse-missing 2s infinite;">
      <span style="font-size: 12px;">🔍</span>
    </div>
    <style>@keyframes pulse-missing { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }</style>`,
    className: "missing-person-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

export default function MissingPersonMap({ showMissingPersons, onStatusChange, currentLocation }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const map = useMap();
  const [mapCenter, setMapCenter] = useState(null);

  const loadMissingPersons = useCallback(async () => {
    if (!showMissingPersons || !mapCenter) return;

    setLoading(true);
    setError(null);
    onStatusChange?.("🔄 현재 지도 영역의 실종자 정보 로딩 중...");

    try {
      const locationQuery = await reverseGeocode(mapCenter.lat, mapCenter.lng);
      onStatusChange?.(`📍 ${locationQuery || "현재 위치"} 지역 실종자 검색 중...`);

      const data = await fetchAmberList({
        rowSize: 30,
        page: 1,
        writngTrgetDscds: ["010", "060", "070"],
        occrAdres: locationQuery || "",
      });

      const list = Array.isArray(data?.list) ? data.list : [];
      onStatusChange?.(`📍 ${list.length}건의 실종자 정보를 찾았습니다. 위치 변환 중...`);

      const out = [];
      
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        const p = await geocodeAddress(it.occrAdres);
        if (p) {
          out.push({ ...p, item: it });
        } else {
          console.warn(`지오코딩 실패: ${it.nm} - ${it.occrAdres}`);
        }
        if ((i + 1) % 10 === 0) {
          onStatusChange?.(`📍 위치 변환 중... (${i + 1}/${list.length})`);
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      
      setPoints(out);
      
      if (out.length > 0 && map) {
        setTimeout(() => {
          const bounds = L.latLngBounds(out.map(p => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }, 100);
        onStatusChange?.(`✅ ${out.length}건의 실종자 정보를 지도에 표시했습니다`);
        setTimeout(() => onStatusChange?.(""), 3000);
      } else {
        onStatusChange?.("현재 지도 영역에 실종자 정보가 없습니다.");
        setTimeout(() => {
          onStatusChange?.("");
          window.dispatchEvent(new CustomEvent('resetMissingPersons'));
        }, 2000);
      }
    } catch (e) {
      console.error("실종자 정보 로드 실패:", e);
      setError(e.message);
      onStatusChange?.("❌ 실종자 정보 로드 실패: " + e.message);
      setTimeout(() => onStatusChange?.(""), 5000);
    } finally {
      setLoading(false);
    }
  }, [showMissingPersons, mapCenter, onStatusChange, map]);

  useEffect(() => {
    if (showMissingPersons && currentLocation) {
      setMapCenter(currentLocation);
      loadMissingPersons();
    } else {
      setPoints([]);
      setError(null);
    }
  }, [showMissingPersons]);

  useEffect(() => {
    if (!currentLocation) {
      setPoints([]);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation) {
      setMapCenter(currentLocation);
    }
  }, [currentLocation]);

  if (!currentLocation) return null;

  if (!showMissingPersons) return null;

  return (
    <>
      {points.map(({ lat, lng, item }, i) => {
        const photo =
          item?.tknphotolength !== "0"
            ? `https://www.safe182.go.kr/api/lcm/imgView.do?msspsnIdntfccd=${item.msspsnIdntfccd}`
            : null;
        const yyyy = String(item.occrde || "").slice(0, 4);
        const mm = String(item.occrde || "").slice(4, 6);
        const dd = String(item.occrde || "").slice(6, 8);
        const dateStr = yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : item.occrde || "-";

        return (
          <Marker key={i} position={[lat, lng]} icon={createMissingPersonIcon()} zIndexOffset={700}>
            <Popup autoPan={false} closeButton={true} closeOnClick={true}>
              <div style={{ width: 200, fontFamily: "'아리따 돋움', sans-serif" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {photo && (
                    <img
                      src={photo}
                      alt={item.nm || "사진"}
                      width={60}
                      height={80}
                      style={{ objectFit: "cover", borderRadius: 4, border: "2px solid #333" }}
                    />
                  )}
                  <div>
                    {item.msspsnIdntfccd ? (
                      <a
                        href={`https://www.safe182.go.kr/home/lcm/lcmMssGet.do?gnbMenuCd=014000000000&lnbMenuCd=014001000000&rptDscd=2&msspsnIdntfccd=${item.msspsnIdntfccd}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          color: "#3b82f6", 
                          fontSize: "1rem", 
                          fontWeight: "600", 
                          textDecoration: "none", 
                          cursor: "pointer",
                          transition: "color 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.target.style.color = "#1e40af"}
                        onMouseLeave={(e) => e.target.style.color = "#3b82f6"}
                      >
                        {item.nm || "이름미상"}
                      </a>
                    ) : (
                      <strong style={{ color: "#000", fontSize: "1rem", fontWeight: "600" }}>
                        {item.nm || "이름미상"}
                      </strong>
                    )}
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#555" }}>발생일: {dateStr}</span>
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#555" }}>
                      {item.sexdstnDscd || ""} / 당시 {item.age || "-"}세
                    </span>
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#555" }}>
                      현재 {item.ageNow || "-"}세
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#333", marginTop: 6 }}>
                  <div>📍 {item.occrAdres || "-"}</div>
                  {item.height && <div>키: {item.height}cm</div>}
                  {item.bdwgh && <div>몸무게: {item.bdwgh}kg</div>}
                  {item.alldressingDscd && item.alldressingDscd !== "불상" && (
                    <div style={{ marginTop: 4, fontSize: "0.75rem", color: "#666" }}>
                      착의: {item.alldressingDscd}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #ddd", textAlign: "center", fontSize: "0.7rem", color: "#888" }}>
                  자료 출처: 경찰청
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
