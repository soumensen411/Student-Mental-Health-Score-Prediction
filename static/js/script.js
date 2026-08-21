(() => {
  const form = document.getElementById("predict-form");
  const steps = Array.from(form.querySelectorAll(".fs-step"));
  const stepIndicator = document.getElementById("step-indicator");
  const btnBack = document.getElementById("btn-back");
  const btnNext = document.getElementById("btn-next");
  const btnSubmit = document.getElementById("btn-submit");
  const formError = document.getElementById("form-error");

  const resultCard = document.getElementById("result-card");
  const gaugeFill = document.getElementById("gauge-fill");
  const gaugeNeedle = document.getElementById("gauge-needle");
  const gaugeScore = document.getElementById("gauge-score");
  const resultLabel = document.getElementById("result-label");
  const resultDisclaimer = document.getElementById("result-disclaimer");
  const btnRestart = document.getElementById("btn-restart");

  const GAUGE_ARC_LENGTH = 298; // matches stroke-dasharray in CSS

  let currentStep = 0;

  // ---- slider fill visuals ----
  function updateSliderFill(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const val = parseFloat(input.value);
    const pct = ((val - min) / (max - min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);
  }
  form.querySelectorAll('input[type="range"]').forEach((input) => {
    updateSliderFill(input);
    input.addEventListener("input", () => updateSliderFill(input));
  });

  // ---- stress pill selection ----
  const stressInput = document.getElementById("Stress_Level");
  document.getElementById("stress-pills").addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document.querySelectorAll("#stress-pills .pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    stressInput.value = pill.dataset.value;
  });

  // ---- step navigation ----
  function showStep(index) {
    steps.forEach((s, i) => (s.hidden = i !== index));
    stepIndicator.textContent = `${index + 1} / ${steps.length}`;
    btnBack.hidden = index === 0;
    const isLast = index === steps.length - 1;
    btnNext.hidden = isLast;
    btnSubmit.hidden = !isLast;
    formError.textContent = "";
  }

  function currentStepValid() {
    const fields = steps[currentStep].querySelectorAll("input[required], select[required]");
    for (const field of fields) {
      if (!field.value) {
        formError.textContent = "Please fill in every field before continuing.";
        field.focus();
        return false;
      }
    }
    return true;
  }

  btnNext.addEventListener("click", () => {
    if (!currentStepValid()) return;
    currentStep = Math.min(currentStep + 1, steps.length - 1);
    showStep(currentStep);
  });

  btnBack.addEventListener("click", () => {
    currentStep = Math.max(currentStep - 1, 0);
    showStep(currentStep);
  });

  showStep(currentStep);

  // ---- submit ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentStepValid()) return;

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Scoring…";
    formError.textContent = "";

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Something went wrong.");
      }

      showResult(body);
    } catch (err) {
      formError.textContent = err.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Get my score";
    }
  });

  function showResult({ score, label, color, disclaimer }) {
    form.hidden = true;
    resultCard.hidden = false;

    const pct = Math.max(0, Math.min(1, score / 10));

    gaugeFill.style.stroke = color;
    gaugeNeedle.style.stroke = color;
    gaugeFill.style.strokeDashoffset = GAUGE_ARC_LENGTH * (1 - pct);
    gaugeNeedle.style.transform = `rotate(${pct * 180 - 90}deg)`;

    // animate the digit count-up
    animateNumber(gaugeScore, score);
    resultLabel.textContent = label;
    resultLabel.style.color = color;
    resultDisclaimer.textContent = disclaimer;
  }

  function animateNumber(el, target) {
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function resetResult() {
    gaugeFill.style.stroke = "";
    gaugeNeedle.style.stroke = "";
    gaugeFill.style.strokeDashoffset = GAUGE_ARC_LENGTH;
    gaugeNeedle.style.transform = "rotate(-90deg)";
    gaugeScore.textContent = "–";
    resultLabel.textContent = "—";
    resultLabel.style.color = "";
    resultDisclaimer.textContent = "";
  }

  btnRestart.addEventListener("click", () => {
    resetResult();
    resultCard.hidden = true;
    form.hidden = false;
    currentStep = 0;
    showStep(currentStep);
  });
})();