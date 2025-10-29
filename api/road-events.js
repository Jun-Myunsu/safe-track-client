export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { minX, maxX, minY, maxY } = req.query;
  const apiKey = process.env.VITE_ITS_API_KEY;

  try {
    const url = `https://openapi.its.go.kr:9443/eventInfo?apiKey=${apiKey}&type=all&minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}&getType=json`;

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("ITS API 에러:", error);
    return res.status(500).json({ error: "Failed to fetch road events" });
  }
}
