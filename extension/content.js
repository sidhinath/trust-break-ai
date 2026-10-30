/**
 * GhostNet AI — Content Script Overlay
 * Displays an isolated warning banner at the top of high-risk pages without breaking page layout.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GHOSTNET_SHOW_OVERLAY" && request.threat) {
    showThreatBanner(request.threat);
    sendResponse({ ok: true });
  }
});

function showThreatBanner(threat) {
  if (document.getElementById("ghostnet-threat-host")) return;

  const host = document.createElement("div");
  host.id = "ghostnet-threat-host";
  host.style.cssText = "all: initial; position: fixed; top: 0; left: 0; width: 100%; z-index: 2147483647;";

  const shadow = host.attachShadow({ mode: "closed" });

  const score = threat.fraud_score || 85;
  const reasons = (threat.reasons || ["Phishing & social engineering cues detected"]).slice(0, 2);

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .banner {
        box-sizing: border-box;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 27, 75, 0.96) 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: #f8fafc;
        border-bottom: 2px solid #ef4444;
        box-shadow: 0 10px 30px -5px rgba(239, 68, 68, 0.35);
        padding: 14px 20px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .shield {
        width: 36px;
        height: 36px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.4);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        font-weight: 900;
        font-size: 18px;
        flex-shrink: 0;
      }
      .info h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .badge {
        font-size: 10px;
        font-weight: 800;
        background: #ef4444;
        color: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info p {
        margin: 2px 0 0 0;
        font-size: 12px;
        color: #94a3b8;
      }
      .right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .score-box {
        font-family: monospace;
        font-size: 13px;
        font-weight: 700;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        padding: 4px 10px;
        border-radius: 6px;
      }
      .dismiss-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .dismiss-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    </style>
    <div class="banner">
      <div class="left">
        <div class="shield">!</div>
        <div class="info">
          <h4>
            GhostNet AI Warning
            <span class="badge">Potential Scam / Phishing</span>
          </h4>
          <p>${reasons.join(" • ")}</p>
        </div>
      </div>
      <div class="right">
        <div class="score-box">Risk: ${score}/100</div>
        <button class="dismiss-btn" id="dismiss">Dismiss Warning</button>
      </div>
    </div>
  `;

  shadow.getElementById("dismiss").addEventListener("click", () => {
    host.remove();
  });

  document.body.prepend(host);
}
