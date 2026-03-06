import fetch from "node-fetch";
async function testHealth() {
  try {
    const res = await fetch("http://localhost:3000/api/health");
    console.log("STATUS:", res.status);
    console.log("BODY:", await res.text());
  } catch (e) {
    console.error("ERROR:", e);
  }
}
testHealth();
