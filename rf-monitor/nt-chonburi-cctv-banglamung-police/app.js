/* =========================================================
   NT PRTG Network Operations Dashboard Create By James Phuthanet
   ไฟล์นี้ควบคุม URL, เวลา, การรีเฟรช และการจัดขนาด Map
   ========================================================= */

"use strict";

// URL ของ PRTG Public Map
const PRTG_MAP_URL =
  "https://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2447&mapid=D85564DB-3F1D-4D10-8E21-99B0CA9B2D98";

// หน้า PRTG หลัก ใช้สำหรับเปิดไปยืนยัน SSL Certificate ใน Browser
const PRTG_ORIGIN_URL = new URL("/index.htm", PRTG_MAP_URL).href;

// ขนาดนี้ต้องตรงกับ PRTG > Map Settings
const PRTG_MAP_WIDTH = 1024;
const PRTG_MAP_HEIGHT = 768;

// เว้นพื้นที่รอบ Map เพื่อไม่ให้ภาพชนขอบ Panel
const MAP_PADDING = 24;

// รีเฟรช Map อัตโนมัติทุก 5 นาที
const AUTO_REFRESH_MS = 5 * 60 * 1000;

// ถ้าโหลดเกินเวลานี้ จะแสดงคำแนะนำเรื่อง Network และ Certificate
const LOAD_TIMEOUT_MS = 20 * 1000;

const elements = {
  prtgMap: document.getElementById("prtgMap"),
  mapStage: document.getElementById("mapStage"),
  mapFrame: document.getElementById("mapFrame"),
  mapPanel: document.getElementById("mapPanel"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  helpOverlay: document.getElementById("helpOverlay"),
  mapStatus: document.getElementById("mapStatus"),
  mapStatusText: document.getElementById("mapStatusText"),
  connectionText: document.getElementById("connectionText"),
  datetime: document.getElementById("datetime"),
  scaleText: document.getElementById("scaleText"),
  refreshBtn: document.getElementById("refreshBtn"),
  retryBtn: document.getElementById("retryBtn"),
  certificateBtn: document.getElementById("certificateBtn"),
  openMapBtn: document.getElementById("openMapBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  toast: document.getElementById("toast")
};

let loadTimeoutId = null;
let toastTimeoutId = null;

/**
 * แสดงวันที่และเวลาปัจจุบันเป็นภาษาไทยและปี พ.ศ.
 */
function updateDateTime() {
  const now = new Date();

  const dateText = now.toLocaleDateString("th-TH-u-ca-buddhist", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeText = now.toLocaleTimeString("th-TH", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  elements.datetime.textContent = `${dateText} · ${timeText}`;
}

/**
 * แสดงข้อความแจ้งเตือนแบบชั่วคราวที่มุมขวาล่าง
 * @param {string} message ข้อความที่ต้องการแสดง
 */
function showToast(message) {
  window.clearTimeout(toastTimeoutId);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");

  toastTimeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2800);
}

/**
 * เปลี่ยนสถานะ Badge และข้อความเชื่อมต่อใน Header
 * @param {"loading"|"error"|"ready"} state สถานะปัจจุบัน
 * @param {string} text ข้อความบน Badge
 */
function setMapState(state, text) {
  elements.mapStatus.className = "map-status";

  if (state === "loading") {
    elements.mapStatus.classList.add("is-loading");
    elements.connectionText.textContent = "กำลังเชื่อมต่อ";
  } else if (state === "error") {
    elements.mapStatus.classList.add("is-error");
    elements.connectionText.textContent = "ต้องตรวจสอบ";
  } else {
    elements.connectionText.textContent = "เชื่อมต่อแล้ว";
  }

  elements.mapStatusText.textContent = text;
}

/**
 * ขยาย PRTG Map ให้ใหญ่ที่สุดเท่าที่พื้นที่ Map Stage อนุญาต
 *
 * หลักการ:
 * - รักษาสัดส่วนเดิม 1024 × 768
 * - คำนวณ Scale จากทั้งความกว้างและความสูง
 * - เลือก Scale ที่น้อยกว่า เพื่อให้ Map ไม่ล้นพื้นที่
 * - ผลลัพธ์คือ Map กว้างที่สุดเท่าที่ทำได้ ภายใต้ข้อจำกัดเรื่องความสูง
 */
function fitMapToViewport() {
  // พื้นที่ใช้งานจริงหลังหัก Padding รอบ Map
  const availableWidth = Math.max(
    1,
    elements.mapStage.clientWidth - MAP_PADDING * 2
  );

  const availableHeight = Math.max(
    1,
    elements.mapStage.clientHeight - MAP_PADDING * 2
  );

  // Scale สูงสุดที่ความกว้างอนุญาต
  const scaleByWidth = availableWidth / PRTG_MAP_WIDTH;

  // Scale สูงสุดที่ความสูงอนุญาต
  const scaleByHeight = availableHeight / PRTG_MAP_HEIGHT;

  /*
   * เลือกค่าที่น้อยกว่า:
   * - ถ้าความสูงเป็นข้อจำกัด Map จะไม่สูงเกินพื้นที่
   * - ถ้าความกว้างเป็นข้อจำกัด Map จะไม่ล้นด้านข้าง
   * - ใช้ Scale เดียวทั้งสองแกน จึงไม่เกิดภาพบิดเบี้ยว
   */
  const scale = Math.min(
    scaleByWidth,
    scaleByHeight
  );

  // ขนาดที่แสดงจริงหลัง Scale
  const renderedWidth = PRTG_MAP_WIDTH * scale;
  const renderedHeight = PRTG_MAP_HEIGHT * scale;

  // ส่ง Scale เดียวให้ CSS
  document.documentElement.style.setProperty(
    "--map-scale",
    scale.toFixed(4)
  );

  // กำหนดขนาดกรอบภายนอกให้ตรงกับภาพหลัง Scale
  document.documentElement.style.setProperty(
    "--map-render-width",
    `${renderedWidth.toFixed(2)}px`
  );

  document.documentElement.style.setProperty(
    "--map-render-height",
    `${renderedHeight.toFixed(2)}px`
  );

  // แสดงรายละเอียดขนาดจริงที่มุมล่าง
  elements.scaleText.textContent =
    `Scale: ${Math.round(scale * 100)}% · ${Math.round(renderedWidth)} × ${Math.round(renderedHeight)}px`;
}

/**
 * โหลด PRTG Map ใหม่
 * ไม่เติม Timestamp ต่อท้าย URL เพราะ PRTG บางเวอร์ชันอ่าน mapid ผิด
 * @param {boolean} showMessage ให้แสดง Toast ระหว่างรีเฟรชหรือไม่
 */
function loadMap(showMessage = false) {
  window.clearTimeout(loadTimeoutId);

  elements.helpOverlay.classList.add("is-hidden");
  elements.loadingOverlay.classList.remove("is-hidden");
  setMapState("loading", "กำลังโหลด PRTG Map");

  // ใช้ about:blank คั่นก่อนโหลด URL เดิม เพื่อบังคับ iframe รีเฟรช
  elements.prtgMap.src = "about:blank";

  window.setTimeout(() => {
    elements.prtgMap.src = PRTG_MAP_URL;
    fitMapToViewport();
  }, 80);

  if (showMessage) {
    showToast("กำลังรีเฟรช Network Map");
  }

  loadTimeoutId = window.setTimeout(() => {
    elements.loadingOverlay.classList.add("is-hidden");
    elements.helpOverlay.classList.remove("is-hidden");
    setMapState("error", "โหลด Map นานกว่าปกติ");
  }, LOAD_TIMEOUT_MS);
}

/**
 * เข้า/ออก Fullscreen เฉพาะ Panel ของ Network Map
 */
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await elements.mapPanel.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    showToast("Browser ไม่อนุญาตให้เปิดโหมดเต็มหน้าจอ");
  }
}

// เมื่อ iframe โหลดเสร็จ ให้ซ่อน Loading และจัด Map กึ่งกลางใหม่
// หมายเหตุ: iframe คนละ Domain จึงตรวจ HTTP Status ภายในโดยตรงไม่ได้
// คำว่า Ready จึงหมายถึง iframe จบขั้นตอน Load ไม่ได้ยืนยันว่า Sensor ทุกตัว Up

elements.prtgMap.addEventListener("load", () => {
  if (elements.prtgMap.getAttribute("src") !== PRTG_MAP_URL) {
    return;
  }

  window.clearTimeout(loadTimeoutId);
  elements.loadingOverlay.classList.add("is-hidden");
  elements.helpOverlay.classList.add("is-hidden");
  setMapState("ready", "PRTG Map Ready");
  fitMapToViewport();
});

// ปุ่มและ Link ต่าง ๆ

elements.refreshBtn.addEventListener("click", () => loadMap(true));
elements.retryBtn.addEventListener("click", () => loadMap(true));
elements.fullscreenBtn.addEventListener("click", toggleFullscreen);
elements.openMapBtn.href = PRTG_MAP_URL;
elements.certificateBtn.href = PRTG_ORIGIN_URL;

// คำนวณ Scale ใหม่เมื่อ Browser, Mobile Rotation หรือ Fullscreen เปลี่ยน
const mapResizeObserver = new ResizeObserver(() => fitMapToViewport());
mapResizeObserver.observe(elements.mapStage);

window.addEventListener("resize", fitMapToViewport);

document.addEventListener("fullscreenchange", () => {
  elements.fullscreenBtn.title = document.fullscreenElement
    ? "ออกจากโหมดเต็มหน้าจอ"
    : "แสดงเต็มหน้าจอ";

  window.setTimeout(fitMapToViewport, 120);
});

// แสดงสถานะ Offline/Online ของ Browser
window.addEventListener("offline", () => {
  window.clearTimeout(loadTimeoutId);
  elements.loadingOverlay.classList.add("is-hidden");
  elements.helpOverlay.classList.remove("is-hidden");
  setMapState("error", "Browser Offline");
  elements.connectionText.textContent = "ไม่มี Internet";
  showToast("อุปกรณ์นี้ไม่มีการเชื่อมต่อ Network");
});

window.addEventListener("online", () => {
  showToast("Network กลับมาเชื่อมต่อแล้ว");
  loadMap();
});

// เริ่มต้นหน้า Dashboard
updateDateTime();
fitMapToViewport();
loadMap();

// อัปเดตเวลาทุก 1 วินาที และรีเฟรช Map อัตโนมัติตามรอบที่กำหนด
window.setInterval(updateDateTime, 1000);
window.setInterval(() => loadMap(), AUTO_REFRESH_MS);
