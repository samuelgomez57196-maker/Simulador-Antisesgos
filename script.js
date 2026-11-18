const numberFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 2 });
    const wholeFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 0 });
    const formatAmount = value => `${numberFormat.format(value)} u.m.`;
    const byId = id => document.getElementById(id);
    const readNumber = id => Number(byId(id).value);

    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(item => item.setAttribute("aria-selected", String(item === tab)));
        document.querySelectorAll(".panel").forEach(panel => {
          const active = panel.id === tab.dataset.panel;
          panel.classList.toggle("active", active);
          panel.hidden = !active;
        });
      });
    });

    const mathInputs = ["scenario", "stake", "odds", "gain", "loss", "probability"];
    mathInputs.forEach(id => byId(id).addEventListener("input", updateMath));
    byId("scenario").addEventListener("change", updateMath);

    function updateMath() {
      const investment = byId("scenario").value === "investment";
      document.querySelectorAll(".investment-field").forEach(field => { field.hidden = !investment; });
      byId("bet-odds-field").hidden = investment;
      byId("probability-label").textContent = investment
        ? "Tu probabilidad estimada de obtener la ganancia (%)"
        : "Tu probabilidad estimada de ganar (%)";
      byId("probability-help").textContent = investment
        ? "Estima la probabilidad usando información verificable; no una rentabilidad prometida."
        : "Usa una estimación basada en datos, no solo en intuición o en una racha.";

      const stake = readNumber("stake");
      const probability = readNumber("probability") / 100;
      if (!Number.isFinite(stake) || stake <= 0 || !Number.isFinite(probability) || probability < 0 || probability > 1) {
        byId("expected-value").textContent = "Revisa los datos";
        byId("expected-value").className = "result-value";
        byId("expected-summary").textContent = "Ingresa un monto positivo y una probabilidad entre 0 y 100%.";
        byId("breakeven").textContent = "—";
        byId("upside").textContent = "—";
        byId("downside").textContent = "—";
        byId("formula-note").textContent = "Completa valores válidos para calcular.";
        return;
      }

      let expected, breakeven, upside, downside, formula;
      if (investment) {
        const gain = readNumber("gain") / 100;
        const loss = readNumber("loss") / 100;
        if (!Number.isFinite(gain) || gain < 0 || !Number.isFinite(loss) || loss < 0 || gain + loss === 0) {
          byId("expected-value").textContent = "Revisa los datos";
          byId("expected-value").className = "result-value";
          byId("expected-summary").textContent = "Ingresa rendimientos no negativos y al menos un posible movimiento.";
          byId("breakeven").textContent = "—";
          byId("upside").textContent = "—";
          byId("downside").textContent = "—";
          byId("formula-note").textContent = "Completa valores válidos para calcular.";
          return;
        }
        expected = stake * (probability * gain - (1 - probability) * loss);
        breakeven = loss / (gain + loss);
        upside = formatAmount(stake * gain);
        downside = `−${formatAmount(stake * loss)}`;
        formula = `Esperanza neta = monto × [p × ganancia − (1 − p) × pérdida]. Con tus datos: ${formatAmount(stake)} × [${numberFormat.format(probability * 100)}% × ${numberFormat.format(gain * 100)}% − ${numberFormat.format((1 - probability) * 100)}% × ${numberFormat.format(loss * 100)}%].`;
      } else {
        const odds = readNumber("odds");
        if (!Number.isFinite(odds) || odds <= 1) {
          byId("expected-value").textContent = "Revisa la cuota";
          byId("expected-value").className = "result-value";
          byId("expected-summary").textContent = "La cuota decimal debe ser mayor que 1.";
          byId("breakeven").textContent = "—";
          byId("upside").textContent = "—";
          byId("downside").textContent = "—";
          byId("formula-note").textContent = "Completa valores válidos para calcular.";
          return;
        }
        expected = stake * (probability * odds - 1);
        breakeven = 1 / odds;
        upside = formatAmount(stake * (odds - 1));
        downside = `−${formatAmount(stake)}`;
        formula = `Esperanza neta = monto × (p × cuota − 1). Con tus datos: ${formatAmount(stake)} × (${numberFormat.format(probability * 100)}% × ${numberFormat.format(odds)} − 1).`;
      }

      const result = byId("expected-value");
      result.textContent = `${expected > 0 ? "+" : expected < 0 ? "−" : ""}${formatAmount(Math.abs(expected))}`;
      result.className = `result-value ${expected >= 0 ? "positive" : "negative"}`;
      byId("expected-summary").textContent = expected > 0
        ? "Promedio teórico positivo si tus probabilidades y supuestos fueran correctos."
        : expected < 0
          ? "Promedio teórico negativo: repetir la decisión bajo estos supuestos reduce el valor esperado."
          : "En equilibrio teórico: no hay ventaja matemática antes de otros costos.";
      byId("breakeven").textContent = `${numberFormat.format(breakeven * 100)}%`;
      byId("upside").textContent = upside;
      byId("downside").textContent = downside;
      byId("formula-note").innerHTML = `<b>La cuenta:</b> ${formula} No incluye impuestos, comisiones, incertidumbre en tu estimación ni la distinta valoración subjetiva de ganancias y pérdidas.`;
    }

    ["streak-probability", "streak-length"].forEach(id => byId(id).addEventListener("input", updateStreak));
    function updateStreak() {
      const probability = readNumber("streak-probability");
      const length = Math.floor(readNumber("streak-length"));
      if (!Number.isFinite(probability) || probability <= 0 || probability >= 100 || !Number.isFinite(length) || length < 2 || length > 20) {
        byId("streak-result").textContent = "Usa una probabilidad entre 1% y 99% y una racha de 2 a 20 resultados.";
        byId("coin-row").replaceChildren();
        return;
      }
      const p = probability / 100;
      const chance = Math.pow(p, length) * 100;
      const coins = document.createDocumentFragment();
      for (let i = 0; i < length; i++) {
        const coin = document.createElement("span");
        coin.className = "coin hit";
        coin.textContent = "GANA";
        coins.append(coin);
      }
      byId("coin-row").replaceChildren(coins);
      byId("streak-result").innerHTML = `Una secuencia específica de <strong>${length} victorias seguidas</strong> tiene probabilidad ${numberFormat.format(chance)}% (${numberFormat.format(p)}<sup>${length}</sup>). Si cada intento es independiente, después de la racha la probabilidad de ganar el siguiente sigue siendo <strong>${numberFormat.format(probability)}%</strong>, no aumenta.`;
    }

    const scamFlags = Array.from(document.querySelectorAll(".scam-flag"));
    scamFlags.forEach(flag => flag.addEventListener("change", updateScam));
    function updateScam() {
      const count = scamFlags.filter(flag => flag.checked).length;
      const status = byId("risk-status");
      status.className = "risk-status";
      if (count === 0) {
        status.textContent = "Sin señales marcadas";
        byId("risk-advice").textContent = "Marca lo que describa la propuesta. Después verifica la empresa, el producto y las reglas de pago por fuera de sus propios canales.";
      } else if (count <= 1) {
        status.textContent = "Precaución";
        status.classList.add("warning");
        byId("risk-advice").textContent = "Una señal merece preguntas y verificación independiente antes de entregar dinero o datos.";
      } else if (count <= 3) {
        status.textContent = "Riesgo elevado";
        status.classList.add("warning");
        byId("risk-advice").textContent = "Varias señales coinciden. No pagues ni reclutes hasta entender y verificar la fuente de ingresos y las condiciones.";
      } else {
        status.textContent = "Riesgo muy alto";
        status.classList.add("danger");
        byId("risk-advice").textContent = "La propuesta acumula alertas importantes. Detén el pago, conserva los mensajes y busca orientación en una entidad de protección al consumidor.";
      }
      byId("risk-count").textContent = `${count} de 5 señales`;
    }

    ["recruits", "levels"].forEach(id => byId(id).addEventListener("input", updatePyramid));
    function updatePyramid() {
      const recruits = Math.floor(readNumber("recruits"));
      const levels = Math.floor(readNumber("levels"));
      if (!Number.isFinite(recruits) || recruits < 2 || recruits > 10 || !Number.isFinite(levels) || levels < 1 || levels > 10) {
        byId("pyramid-total").textContent = "Revisa los datos";
        byId("pyramid-description").textContent = "Ingresa de 2 a 10 reclutas y de 1 a 10 niveles.";
        byId("pyramid-formula").textContent = "Los valores permitidos evitan resultados engañosos o fuera de escala.";
        return;
      }
      const total = (Math.pow(recruits, levels + 1) - 1) / (recruits - 1);
      const lastLevel = Math.pow(recruits, levels);
      byId("pyramid-total").textContent = `${wholeFormat.format(total)} personas`;
      byId("pyramid-description").textContent = `en total; ${wholeFormat.format(lastLevel)} solo en el nivel ${levels}.`;
      byId("pyramid-formula").innerHTML = `<b>El crecimiento:</b> 1 + ${recruits} + ${recruits}<sup>2</sup> + … + ${recruits}<sup>${levels}</sup>. Es una ilustración de la aritmética del reclutamiento, no una predicción de participantes reales.`;
    }

    const impulseFlags = Array.from(document.querySelectorAll(".impulse-flag"));
    impulseFlags.forEach(flag => flag.addEventListener("change", updateImpulse));
    ["price", "budget"].forEach(id => byId(id).addEventListener("input", updateImpulse));
    function updateImpulse() {
      const price = readNumber("price");
      const budget = readNumber("budget");
      const count = impulseFlags.filter(flag => flag.checked).length;
      const outsideBudget = Number.isFinite(price) && Number.isFinite(budget) && price > budget;
      const status = byId("impulse-status");
      status.className = "risk-status";
      byId("impulse-count").textContent = `${count} de 3`;
      if (outsideBudget || count >= 2) {
        status.textContent = "Alto";
        status.classList.add("danger");
        byId("impulse-advice").textContent = "No compres ahora. Espera al menos 24 horas y revisa qué gasto tendrías que recortar para pagarlo.";
      } else if (count === 1) {
        status.textContent = "En observación";
        status.classList.add("warning");
        byId("impulse-advice").textContent = "Hay una señal para revisar. Compara alternativas y vuelve a decidir cuando no haya presión.";
      } else {
        status.textContent = "Bajo";
        byId("impulse-advice").textContent = "No aparecen señales en este ejercicio. Confirma igualmente que el producto y el precio encajan con tus planes.";
      }
      if (!Number.isFinite(price) || price < 0 || !Number.isFinite(budget) || budget < 0) {
        byId("budget-advice").innerHTML = "<strong>Revisa los montos:</strong> usa valores iguales o mayores que cero.";
      } else if (outsideBudget) {
        byId("budget-advice").innerHTML = `<strong>Fuera de tu presupuesto:</strong> faltan ${formatAmount(price - budget)} del dinero disponible.`;
      } else {
        byId("budget-advice").innerHTML = `<strong>Cabe en el monto disponible:</strong> quedarían ${formatAmount(budget - price)}.`;
      }
    }

    updateMath();
    updateStreak();
    updateScam();
    updatePyramid();
    updateImpulse();
