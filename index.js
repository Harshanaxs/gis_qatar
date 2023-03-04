import express from "express";
import axios from "axios";
import proj4 from "proj4";
import plusCodes from "pluscodes";

const app = express();
const port = 3000;

function findPlusCodeFromXY(x, y) {
  proj4.defs(
    "EPSG:2932",
    "+proj=tmerc +lat_0=24.45 +lon_0=51.2166666666667 +k=0.99999 +x_0=200000 +y_0=300000 +ellps=intl +towgs84=-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065 +units=m +no_defs +type=crs"
  );
  proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

  const data = proj4("EPSG:2932", "EPSG:4326", [x, y, 10]);

  const [longitude, latitude] = data;

  const plusCode = plusCodes.encode(
    { latitude: latitude, longitude: longitude },
    10
  ); // '9FFW84J9+XG'

  return plusCode;
}

app.get("/coordinates/:zoneNo/:streetNo/:buildingNo", async (req, res) => {
  const { zoneNo, streetNo, buildingNo } = req.params;
  const url = `https://services.gisqatar.org.qa/server/rest/services/Vector/QARS_Search/MapServer/0/query?f=json&where=ZONE_NO%20%3D${zoneNo}%20and%20STREET_NO%3D${streetNo}%20and%20BUILDING_NO%3D${buildingNo}&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=ZONE_NO%2CSTREET_NO%2CBUILDING_NO%2CQARS%2CELECTRICITY_NO%2CWATER_NO%2CQTEL_ID`;

  try {
    const response = await axios.get(url);
    const { x, y } = response.data.features[0].geometry;
    const plusCode = findPlusCodeFromXY(x, y);
    res.json({ plusCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to get coordinates" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
