/* =========================================================
   NT Monitor Network Operations Dashboard Create By James Phuthanet
   รองรับ Dropdown เลือกแสดงหลาย Monitor Public Map
   ========================================================= */

"use strict";

/**
 * รายการ Monitor Map
 *
 * เพิ่ม Map ใหม่ได้โดยเพิ่ม Object ใน Monitor_MAPS และเพิ่ม <option>
 * ใน index.html ให้ value ตรงกับ key ของ Object
 */
const Monitor_MAPS = {
  banglamung: {
    name: "CCTV อบจ-สภ.บางละมุง",
    description: "nt-cctv-banglamung-police-station",
    url: "https://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2447&mapid=D85564DB-3F1D-4D10-8E21-99B0CA9B2D98",
    width: 1024,
    height: 768
  },

  pao_center: {
    name: "CCTV อบจ.ชลบุรี-รวมศูนย์",
    description: "nt-cctv-chonburi-pao-center",
    url: "https://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2506&mapid=26815356-D3C7-4522-91C0-80DB58E8FF69",
    width: 1024,
    height: 768
  }
};

// Map ที่แสดงตอนเปิดหน้าเว็บครั้งแรก
let activeMapKey = "banglamung";

// URL ที่ iframe กำลังรอโหลด ใช้ป้องกัน Event จาก Map เก่า
let expectedMapUrl = "";

// หมายเลขลำดับการโหลด ป้องกันการสลับ Dropdown เร็วแล้วผลเก่าทับผลใหม่
let loadSequence = 0;

// เว้นพื้นที่รอบ Map เพื่อไม่ให้ภาพชนขอบ Panel
const MAP_PADDING = 24;

// รีเฟรช Map อัตโนมัติทุก 5 นาที
const AUTO_REFRESH_MS = 5 * 60 * 1000;

// อัปเดตตัวนับถอยหลังทุก 1 วินาที
const AUTO_REFRESH_TICK_MS = 1000;

// ถ้าโหลด iframe เกินเวลานี้ ให้แสดงคำแนะนำ
const LOAD_TIMEOUT_MS = 20 * 1000;

// เวลาสูงสุดสำหรับ Probe การเชื่อมต่อ
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
  mapSizeText: document.getElementById("mapSizeText"),
  autoRefreshCountdown: document.getElementById("autoRefreshCountdown"),
  currentMapName: document.getElementById("currentMapName"),
  currentMapDescription: document.getElementById("currentMapDescription"),
  mapSelect: document.getElementById("mapSelect"),
  refreshBtn: document.getElementById("refreshBtn"),
  retryBtn: document.getElementById("retryBtn"),
  certificateBtn: document.getElementById("certificateBtn"),
  openMapBtn: document.getElementById("openMapBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  toast: document.getElementById("toast")
};

let loadTimeoutId = null;
let toastTimeoutId = null;
let connectionProbePassed = false;

// เวลาที่จะรีเฟรช Map รอบถัดไป
let nextAutoRefreshAt = Date.now() + AUTO_REFRESH_MS;

// ป้องกันการสั่ง Auto Refresh ซ้ำระหว่างรอบเดียวกัน
let autoRefreshRunning = false;

/**
 * คืนค่า Config ของ Map ที่กำลังเลือก
 */
function getActiveMap() {
  return Monitor_MAPS[activeMapKey];
}

/**
 * คืนค่า Origin URL ของ Monitor Map สำหรับหน้า Certificate
 *
 * @param {string} mapUrl URL ของ Public Map
 */
function getMonitorOriginUrl(mapUrl) {
  return new URL("/index.htm", mapUrl).href;
}

/**   
 * แปลงเวลาที่เหลือเป็นรูปแบบ MM:SS
 *
 * @param {number} milliseconds เวลาที่เหลือหน่วยมิลลิวินาที
 * @returns {string} เวลาในรูปแบบ MM:SS
 */
function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * เริ่มนับรอบรีเฟรชอัตโนมัติใหม่
 */
function resetAutoRefreshCountdown() {
  nextAutoRefreshAt = Date.now() + AUTO_REFRESH_MS;
  updateAutoRefreshCountdown();
}

/**
 * อัปเดตตัวนับและสั่งรีเฟรชเมื่อเวลาครบ
 *
 * ใช้ Timestamp จริงแทนการลบทีละวินาที
 * จึงยังแม่นยำเมื่อ Browser ลดการทำงานของ Timer ในแท็บที่ไม่ได้เปิดอยู่
 */
function updateAutoRefreshCountdown() {
  const remainingMs = nextAutoRefreshAt - Date.now();
  const counterContainer = elements.autoRefreshCountdown.closest(
    ".auto-refresh-counter"
  );

  elements.autoRefreshCountdown.textContent = formatCountdown(remainingMs);

  if (remainingMs > 0) {
    counterContainer.classList.remove("is-due");
    return;
  }

  counterContainer.classList.add("is-due");

  if (autoRefreshRunning) {
    return;
  }

  // ตั้ง Deadline รอบใหม่ทันที เพื่อไม่ให้ Trigger ซ้ำ
  autoRefreshRunning = true;
  nextAutoRefreshAt = Date.now() + AUTO_REFRESH_MS;
  elements.autoRefreshCountdown.textContent = formatCountdown(AUTO_REFRESH_MS);

  loadMap(false).finally(() => {
    autoRefreshRunning = false;
  });
}

/**
 * แสดงวันที่และเวลาปัจจุบัน
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
    const mobileDateText = now.toLocaleDateString("th-TH-u-ca-buddhist", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    elements.datetime.textContent = `${mobileDateText} · ${timeText}`;
    return;
  }

  const desktopDateText = now.toLocaleDateString("th-TH-u-ca-buddhist", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  elements.datetime.textContent = `${desktopDateText} · ${timeText}`;
}

/**
 * แสดง Toast ชั่วคราว
 *
 * @param {string} message ข้อความแจ้งเตือน
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
 * เปลี่ยนสถานะ Badge และ Header
 *
 * @param {"loading"|"error"|"ready"} state สถานะ
 * @param {string} text ข้อความ
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
 * อัปเดตข้อความและ Link ตาม Map ที่เลือก
 */
function updateSelectedMapUi() {
  const activeMap = getActiveMap();

  elements.currentMapName.textContent = activeMap.name;
  elements.currentMapDescription.textContent = activeMap.description;
  // Element นี้ถูกถอดออกจาก Footer ในเวอร์ชัน Refresh Only
  if (elements.mapSizeText) {
    elements.mapSizeText.textContent =
      `Map Size: ${activeMap.width} × ${activeMap.height}`;
  }

  elements.openMapBtn.href = activeMap.url;
  elements.certificateBtn.href = getMonitorOriginUrl(activeMap.url);

  elements.prtgMap.title = activeMap.name;
  document.title = `${activeMap.name} · NT Network Operations Dashboard`;
}

/**
 * ขยาย Map ให้ใหญ่ที่สุด โดยรักษาสัดส่วนและไม่ล้นพื้นที่
 */
function fitMapToViewport() {
  const activeMap = getActiveMap();

  const availableWidth = Math.max(
    1,
    elements.mapStage.clientWidth - MAP_PADDING * 2
  );

  const availableHeight = Math.max(
    1,
    elements.mapStage.clientHeight - MAP_PADDING * 2
  );

  const scaleByWidth = availableWidth / activeMap.width;
  const scaleByHeight = availableHeight / activeMap.height;
  const scale = Math.min(scaleByWidth, scaleByHeight);

  const renderedWidth = activeMap.width * scale;
  const renderedHeight = activeMap.height * scale;

  document.documentElement.style.setProperty(
    "--map-scale",
    scale.toFixed(4)
  );

  document.documentElement.style.setProperty(
    "--map-render-width",
    `${renderedWidth.toFixed(2)}px`
  );

  document.documentElement.style.setProperty(
    "--map-render-height",
    `${renderedHeight.toFixed(2)}px`
  );

  // เปลี่ยนขนาดต้นฉบับ iframe ตาม Config ของ Map
  elements.prtgMap.style.width = `${activeMap.width}px`;
  elements.prtgMap.style.height = `${activeMap.height}px`;

  // Element นี้ถูกถอดออกจาก Footer ในเวอร์ชัน Refresh Only
  if (elements.scaleText) {
    if (elements.scaleText) {
    elements.scaleText.textContent =
      `Scale: ${Math.round(scale * 100)}% · ${Math.round(renderedWidth)} × ${Math.round(renderedHeight)}px`;
  }
  }
}

/**
 * ตรวจสอบการเข้าถึง URL ของ Monitor Map ก่อนโหลด iframe
 *
 * @param {string} mapUrl URL ที่ต้องการตรวจ
 * @returns {Promise<boolean>}
 */
async function probeMonitorConnection(mapUrl) {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, CONNECTION_PROBE_TIMEOUT_MS);

  try {
    await fetch(mapUrl, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal
    });

    return true;
  } catch (error) {
    console.warn("Monitor Map connection probe failed:", error);
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * แสดงหน้าจอแจ้งเตือนเมื่อ Monitor Map ติดต่อไม่ได้
 *
 * @param {string} title หัวข้อ
 * @param {string} message รายละเอียด
 */
function showConnectionFailure(title, message) {
  window.clearTimeout(loadTimeoutId);

  elements.loadingOverlay.classList.add("is-hidden");
  elements.helpOverlay.classList.remove("is-hidden");
  elements.helpTitle.textContent = title;
  elements.helpMessage.innerHTML = message;

  setMapState("error", "Monitor Connection Failed");
  showToast("ไม่สามารถเชื่อมต่อ Monitor Map — กรุณายืนยัน Certificate");
}

/**
 * โหลด Map ที่เลือกใน Dropdown
 *
 * @param {boolean} showMessage แสดง Toast หรือไม่
 */
async function loadMap(showMessage = false) {
  const requestSequence = ++loadSequence;
  const activeMap = getActiveMap();
  const requestedUrl = activeMap.url;
  const requestedName = activeMap.name;
  const requestedHost = new URL(requestedUrl).host;

  window.clearTimeout(loadTimeoutId);
  connectionProbePassed = false;
  expectedMapUrl = requestedUrl;

  elements.helpOverlay.classList.add("is-hidden");
  elements.loadingOverlay.classList.remove("is-hidden");
  setMapState("loading", `กำลังตรวจสอบ ${requestedName}`);

  // ล้างหน้าเก่าก่อนโหลด Map ใหม่
  elements.prtgMap.src = "about:blank";

  if (showMessage) {
    showToast(`กำลังโหลด ${requestedName}`);
  }

  const isReachable = await probeMonitorConnection(requestedUrl);

  // ถ้าระหว่างรอผู้ใช้เปลี่ยน Map แล้ว ให้ยกเลิกผลลัพธ์ชุดเก่า
  if (requestSequence !== loadSequence) {
    return;
  }

  if (!isReachable) {
    showConnectionFailure(
      `ไม่สามารถเชื่อมต่อ ${requestedName} ได้`,
      `Browser ติดต่อ <strong>${requestedHost}</strong> ไม่สำเร็จ
       อาจเกิดจาก SSL Certificate ยังไม่ได้รับการยืนยัน, VPN ไม่เชื่อมต่อ,
       Firewall บล็อก หรือ Monitor Server ไม่พร้อมใช้งาน`
    );
    return;
  }

  connectionProbePassed = true;
  setMapState("loading", `กำลังโหลด ${requestedName}`);

  elements.prtgMap.src = requestedUrl;
  fitMapToViewport();

  loadTimeoutId = window.setTimeout(() => {
    if (requestSequence !== loadSequence) {
      return;
    }

    showConnectionFailure(
      `${requestedName} ใช้เวลาโหลดนานกว่าปกติ`,
      `Browser ติดต่อ <strong>${requestedHost}</strong> ได้
       แต่หน้า Public Map ยังโหลดไม่เสร็จ กรุณาตรวจสอบ Monitor Service และ Public Map Access`
    );
  }, LOAD_TIMEOUT_MS);
}

/**
 * เปลี่ยน Map จาก Dropdown
 */
function changeSelectedMap() {
  const selectedKey = elements.mapSelect.value;

  if (!PRTG_MAPS[selectedKey]) {
    showToast("ไม่พบ Network Map ที่เลือก");
    return;
  }

  activeMapKey = selectedKey;
  updateSelectedMapUi();
  fitMapToViewport();

  // เริ่มนับ 5 นาทีใหม่สำหรับ Map ที่เพิ่งเลือก
  resetAutoRefreshCountdown();
  loadMap(true);
}

/**
 * เข้า/ออก Fullscreen เฉพาะ Map Panel
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

// iframe โหลดเสร็จ
elements.prtgMap.addEventListener("load", () => {
  if (
    elements.prtgMap.getAttribute("src") !== expectedMapUrl ||
    !connectionProbePassed
  ) {
    return;
  }

  window.clearTimeout(loadTimeoutId);

  elements.loadingOverlay.classList.add("is-hidden");
  elements.helpOverlay.classList.add("is-hidden");

  setMapState("ready", `${getActiveMap().name} Ready`);
  fitMapToViewport();
});

// Event ของ Dropdown และปุ่ม
elements.mapSelect.addEventListener("change", changeSelectedMap);

elements.refreshBtn.addEventListener("click", () => {
  resetAutoRefreshCountdown();
  loadMap(true);
});

elements.retryBtn.addEventListener("click", () => {
  resetAutoRefreshCountdown();
  loadMap(true);
});

elements.fullscreenBtn.addEventListener("click", toggleFullscreen);

elements.certificateBtn.addEventListener("click", () => {
  showToast("กำลังเปิดหน้า Monitor Map เพื่อยืนยัน Certificate");
});

// คำนวณใหม่เมื่อพื้นที่เปลี่ยน
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

// สถานะ Network ของ Browser
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
  resetAutoRefreshCountdown();
  loadMap();
});

// เริ่มต้นหน้า Dashboard
elements.mapSelect.value = activeMapKey;
updateSelectedMapUi();
updateDateTime();
fitMapToViewport();
resetAutoRefreshCountdown();
loadMap();

// อัปเดตนาฬิกาและตัวนับรีเฟรชทุก 1 วินาที
window.setInterval(updateDateTime, 1000);
window.setInterval(updateAutoRefreshCountdown, AUTO_REFRESH_TICK_MS);
