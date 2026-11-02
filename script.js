const STORAGE_KEY = "jf-fitness-daily";
const DAILY_GOALS = {
    steps: 8000,
    waterMl: 2000
};

const elements = {
    stepsCount: document.querySelector("#steps-count"),
    stepsProgress: document.querySelector("#steps-progress"),
    stepsProgressBar: document.querySelector("#steps-progress-bar"),
    waterCount: document.querySelector("#water-count"),
    waterProgress: document.querySelector("#water-progress"),
    waterProgressBar: document.querySelector("#water-progress-bar"),
    workoutCount: document.querySelector("#workout-count"),
    workoutForm: document.querySelector("#workout-form"),
    workoutType: document.querySelector("#workout-type"),
    workoutMinutes: document.querySelector("#workout-minutes"),
    activityList: document.querySelector("#activity-list"),
    activityEmpty: document.querySelector("#activity-empty"),
    status: document.querySelector("#daily-status")
};

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createDailyData() {
    return {
        date: getToday(),
        steps: 0,
        waterMl: 0,
        activities: []
    };
}

function loadDailyData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData === null) {
            return createDailyData();
        }

        const parsedData = JSON.parse(savedData);
        const validActivities = Array.isArray(parsedData.activities)
            ? parsedData.activities.filter(activity =>
                activity &&
                typeof activity.type === "string" &&
                Number.isInteger(activity.minutes) &&
                activity.minutes > 0
            )
            : [];

        if (
            !parsedData ||
            parsedData.date !== getToday() ||
            !Number.isFinite(parsedData.steps) ||
            !Number.isFinite(parsedData.waterMl)
        ) {
            return createDailyData();
        }

        return {
            date: parsedData.date,
            steps: Math.max(0, Math.floor(parsedData.steps)),
            waterMl: Math.max(0, Math.floor(parsedData.waterMl)),
            activities: validActivities
        };
    } catch (error) {
        console.error("Não foi possível ler os registros salvos do JF Fitness.", error);
        return createDailyData();
    }
}

let dailyData = loadDailyData();

function saveDailyData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyData));
        return true;
    } catch (error) {
        console.error("Não foi possível salvar os registros do JF Fitness.", error);
        elements.status.textContent = "Não foi possível salvar os dados neste navegador.";
        return false;
    }
}

function ensureCurrentDay() {
    if (dailyData.date !== getToday()) {
        dailyData = createDailyData();
    }
}

function updateProgress(value, goal, label, progressElement, barElement) {
    const percentage = Math.min((value / goal) * 100, 100);

    label.textContent = value.toLocaleString("pt-BR");
    progressElement.setAttribute("aria-valuenow", String(Math.min(value, goal)));
    barElement.style.width = `${percentage}%`;
}

function renderActivities() {
    elements.activityList.replaceChildren();
    elements.activityEmpty.hidden = dailyData.activities.length > 0;

    dailyData.activities.forEach(activity => {
        const item = document.createElement("li");
        const name = document.createElement("span");
        const duration = document.createElement("strong");

        name.textContent = activity.type;
        duration.textContent = `${activity.minutes} min`;
        item.append(name, duration);
        elements.activityList.append(item);
    });

    const totalMinutes = dailyData.activities.reduce(
        (total, activity) => total + activity.minutes,
        0
    );
    elements.workoutCount.textContent = totalMinutes.toLocaleString("pt-BR");
}

function renderDailyData() {
    updateProgress(
        dailyData.steps,
        DAILY_GOALS.steps,
        elements.stepsCount,
        elements.stepsProgress,
        elements.stepsProgressBar
    );
    updateProgress(
        dailyData.waterMl,
        DAILY_GOALS.waterMl,
        elements.waterCount,
        elements.waterProgress,
        elements.waterProgressBar
    );
    renderActivities();
}

document.querySelector("#add-steps").addEventListener("click", () => {
    ensureCurrentDay();
    dailyData.steps += 500;
    if (saveDailyData()) {
        elements.status.textContent = "500 passos adicionados à sua meta de hoje.";
    }
    renderDailyData();
});

document.querySelector("#add-water").addEventListener("click", () => {
    ensureCurrentDay();
    dailyData.waterMl += 250;
    if (saveDailyData()) {
        elements.status.textContent = "Um copo de água (250 ml) foi registrado.";
    }
    renderDailyData();
});

elements.workoutForm.addEventListener("submit", event => {
    event.preventDefault();

    const minutes = Number(elements.workoutMinutes.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
        elements.workoutMinutes.setCustomValidity("Informe um número inteiro entre 1 e 1440 minutos.");
        elements.workoutMinutes.reportValidity();
        return;
    }

    ensureCurrentDay();
    elements.workoutMinutes.setCustomValidity("");
    dailyData.activities.push({
        type: elements.workoutType.value,
        minutes
    });

    if (saveDailyData()) {
        elements.status.textContent = "Exercício registrado com sucesso.";
    }
    renderDailyData();
    elements.workoutForm.reset();
});

renderDailyData();
