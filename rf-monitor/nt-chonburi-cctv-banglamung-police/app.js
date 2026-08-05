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

// ถ้าโหลด iframe เกินเวลานี้ จะแสดงคำแนะนำเรื่อง Network และ Certificate
const LOAD_TIMEOUT_MS = 20 * 1000;

// เวลาสูงสุดสำหรับตรวจสอบว่า PRTG Origin ติดต่อได้หรือไม่
const CONNECTION_PROBE_TIMEOUT_MS = 8 * 1000;

const elements = {
  prtgMap: document.getElementById("prtgMap"),
  mapStage: document.getElementById("mapStage"),
  mapFrame: document.getElementById("mapFrame"),
  mapPanel: document.getElementById("mapPanel"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  helpOverlay: document.getElementById("helpOverlay"),
  helpTitle: document.getElementById("helpTitle"),
  helpMessage: document.getElementById("helpMessage"),
  redirectNotice: document.getElementById("redirectNotice"),
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

// ป้องกัน iframe load event รายงาน Ready ก่อนผ่านการตรวจสอบปลายทาง
let connectionProbePassed = false;

/**
 * แสดงวันที่และเวลาปัจจุบันเป็นภาษาไทยและปี พ.ศ.
 */
function updateDateTime() {
  const now = new Date();

  const timeText = now.toLocaleTimeString("th-TH", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const isMobile = window.matchMedia("(max-width: 620px)").matches;

  if (isMobile) {
    // มือถือ: วันที่แบบย่อ + เวลา เพื่อประหยัดพื้นที่ Header
    const mobileDateText = now.toLocaleDateString("th-TH-u-ca-buddhist", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    elements.datetime.textContent = `${mobileDateText} · ${timeText}`;
    return;
  }

  // Desktop: วันที่แบบเต็ม + เวลา
  const desktopDateText = now.toLocaleDateString("th-TH-u-ca-buddhist", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  elements.datetime.textContent = `${desktopDateText} · ${timeText}`;
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
 * ตรวจสอบการเข้าถึง PRTG ก่อนโหลด iframe
 *
 * ใช้ mode: "no-cors" เพราะ PRTG อยู่คนละ Origin
 * หาก TLS/Certificate, VPN, Firewall หรือ Network มีปัญหา Promise จะ reject
 *
 * หมายเหตุ:
 * - ผลลัพธ์สำเร็จหมายถึง Browser ติดต่อปลายทางได้
 * - ไม่ได้อ่าน HTTP Status หรือข้อมูลภายใน PRTG เพราะเป็น Cross-Origin
 *
 * @returns {Promise<boolean>} true เมื่อ Browser ติดต่อ PRTG ได้
 */
async function probePrtgConnection() {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, CONNECTION_PROBE_TIMEOUT_MS);

  try {
    await fetch(PRTG_MAP_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal
    });

    return true;
  } catch (error) {
    console.warn("PRTG connection probe failed:", error);
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * แสดงหน้าจอแจ้งเตือนและปุ่ม Redirect เมื่อ PRTG ติดต่อไม่ได้
 * @param {string} title หัวข้อแจ้งเตือน
 * @param {string} message รายละเอียดปัญหา
 */
function showConnectionFailure(title, message) {
  window.clearTimeout(loadTimeoutId);

  elements.loadingOverlay.classList.add("is-hidden");
  elements.helpOverlay.classList.remove("is-hidden");
  elements.helpTitle.textContent = title;
  elements.helpMessage.innerHTML = message;

  setMapState("error", "PRTG Connection Failed");
  showToast("ไม่สามารถเชื่อมต่อ PRTG — กรุณา Redirect ไปยืนยัน Certificate");
}

/**
 * ตรวจสอบปลายทางและโหลด PRTG Map ใหม่
 *
 * ไม่ใช้ iframe load event อย่างเดียว เพราะ Chrome จะยิง load
 * แม้ภายใน iframe จะแสดงหน้า ERR_CERT_AUTHORITY_INVALID หรือ Network Error
 *
 * @param {boolean} showMessage ให้แสดง Toast ระหว่างรีเฟรชหรือไม่
 */
async function loadMap(showMessage = false) {
  window.clearTimeout(loadTimeoutId);

  connectionProbePassed = false;

  elements.helpOverlay.classList.add("is-hidden");
  elements.loadingOverlay.classList.remove("is-hidden");
  setMapState("loading", "กำลังตรวจสอบ PRTG");

  // ล้าง iframe เดิมก่อน เพื่อไม่ให้ค้างหน้า Error เก่า
  elements.prtgMap.src = "about:blank";

  if (showMessage) {
    showToast("กำลังตรวจสอบการเชื่อมต่อ PRTG");
  }

  // ตรวจ TLS/Certificate, VPN, Firewall และการเข้าถึง Server ก่อน
  const isReachable = await probePrtgConnection();

  if (!isReachable) {
    showConnectionFailure(
      "ไม่สามารถเชื่อมต่อ PRTG Map ได้",
      `Browser ติดต่อ <strong>rfcctv.fortiddns.com:8443</strong> ไม่สำเร็จ
       อาจเกิดจาก SSL Certificate ยังไม่ได้รับการยืนยัน, VPN ไม่เชื่อมต่อ,
       Firewall บล็อก หรือ PRTG Server ไม่พร้อมใช้งาน`
    );
    return;
  }

  connectionProbePassed = true;
  setMapState("loading", "กำลังโหลด PRTG Map");

  // เมื่อ Probe ผ่านแล้วจึงโหลด Public Map เข้า iframe
  elements.prtgMap.src = PRTG_MAP_URL;
  fitMapToViewport();

  loadTimeoutId = window.setTimeout(() => {
    showConnectionFailure(
      "PRTG Map ใช้เวลาโหลดนานกว่าปกติ",
      `Browser ติดต่อ <strong>rfcctv.fortiddns.com:8443</strong> ได้
       แต่หน้า Public Map ยังโหลดไม่เสร็จ กรุณาตรวจสอบ PRTG Service และ Public Map Access`
    );
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
  // about:blank หรือ iframe ที่ยังไม่ผ่าน Connection Probe ห้ามรายงาน Ready
  if (
    elements.prtgMap.getAttribute("src") !== PRTG_MAP_URL ||
    !connectionProbePassed
  ) {
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

elements.certificateBtn.addEventListener("click", () => {
  showToast("กำลัง Redirect ไปหน้า PRTG เพื่อยืนยัน Certificate");
});

// คำนวณ Scale ใหม่เมื่อ Browser, Mobile Rotation หรือ Fullscreen เปลี่ยน
const mapResizeObserver = new ResizeObserver(() => fitMapToViewport());
mapResizeObserver.observe(elements.mapStage);

window.addEventListener("resize", () => {
  fitMapToViewport();
  updateDateTime();
});

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
