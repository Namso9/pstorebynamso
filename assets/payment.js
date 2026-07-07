    (function () {
      const selectEl = document.getElementById("platform");
      const buttons = Array.from(document.querySelectorAll(".platform-btn"));

      const panels = {
        kpay: document.getElementById("panel-kpay"),
        wave: document.getElementById("panel-wave"),
        aya: document.getElementById("panel-aya"),
      };

      const sendProof = document.getElementById("send-proof");
      const selectedPlatformText = document.getElementById("selectedPlatformText");
      const proofOrderForm = document.getElementById("proof-order-form");
      if (proofOrderForm && location.search) proofOrderForm.href = "order.html" + location.search;

      const platformLabels = {
        kpay: "KBZPay",
        wave: "WavePay",
        aya: "AyaPay"
      };

      function hideAllPanels() {
        Object.values(panels).forEach(p => p.classList.remove("show"));
      }

      function setActiveButton(platform) {
        buttons.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.platform === platform);
        });
      }

      function showPlatform(platform) {
        if (!platform || !panels[platform]) return;

        hideAllPanels();
        panels[platform].classList.add("show");

        // sync UI
        setActiveButton(platform);
        if (selectEl.value !== platform) selectEl.value = platform;

        // ✅ Show screenshot send box only after platform selected
        selectedPlatformText.textContent = platformLabels[platform] || "Platform";
        sendProof.classList.add("show");

        // nice UX scroll
        panels[platform].scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Select change
      selectEl.addEventListener("change", (e) => {
        showPlatform(e.target.value);
      });

      // Buttons click
      buttons.forEach(btn => {
        btn.addEventListener("click", () => {
          showPlatform(btn.dataset.platform);
        });
      });
    })();
