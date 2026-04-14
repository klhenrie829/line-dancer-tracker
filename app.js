const storageKey = "line-dance-tracker-v1";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      setMessage("Offline mode will start after the app is served from a local or hosted site.");
    });
  });
}

const starterDances = [
  {
    id: "starter-electric-slide",
    name: "Electric Slide",
    songs: ["Electric Boogie - Marcia Griffiths"],
    counts: 18,
    difficulty: "Beginner",
    tags: "No",
    restarts: "No",
    status: "know",
    notes: "Classic social floor dance."
  },
  {
    id: "starter-cupid-shuffle",
    name: "Cupid Shuffle",
    songs: ["Cupid Shuffle - Cupid"],
    counts: 32,
    difficulty: "Beginner",
    tags: "No",
    restarts: "No",
    status: "learning",
    notes: "Watch the repeated quarter turns."
  },
  {
    id: "starter-copperhead-road",
    name: "Copperhead Road",
    songs: ["Copperhead Road - Steve Earle"],
    counts: 24,
    difficulty: "Beginner",
    tags: "No",
    restarts: "No",
    status: "want",
    notes: "Country bar favorite."
  },
  {
    id: "starter-boot-scootin-boogie",
    name: "Boot Scootin' Boogie",
    songs: ["Boot Scootin' Boogie - Brooks & Dunn"],
    counts: 32,
    difficulty: "Beginner",
    tags: "No",
    restarts: "No",
    status: "none",
    notes: "Good practice for vines and heel switches."
  }
];

const labels = {
  know: "Know",
  learning: "Currently learning",
  want: "Want to learn",
  none: "Not started"
};

let dances = loadDances();

const elements = {
  list: document.querySelector("#dance-list"),
  template: document.querySelector("#dance-card-template"),
  search: document.querySelector("#search"),
  statusFilter: document.querySelector("#status-filter"),
  difficultyFilter: document.querySelector("#difficulty-filter"),
  showCueDances: document.querySelector("#show-cue-dances"),
  form: document.querySelector("#dance-form"),
  formTitle: document.querySelector("#form-title"),
  id: document.querySelector("#dance-id"),
  name: document.querySelector("#dance-name"),
  songs: document.querySelector("#dance-songs"),
  counts: document.querySelector("#dance-counts"),
  difficulty: document.querySelector("#dance-difficulty"),
  tags: document.querySelector("#dance-tags"),
  restarts: document.querySelector("#dance-restarts"),
  status: document.querySelector("#dance-status"),
  notes: document.querySelector("#dance-notes"),
  cancelEdit: document.querySelector("#cancel-edit"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  resetSamples: document.querySelector("#reset-samples"),
  dataMessage: document.querySelector("#data-message"),
  stats: {
    know: document.querySelector("#stat-known"),
    learning: document.querySelector("#stat-learning"),
    want: document.querySelector("#stat-want"),
    total: document.querySelector("#stat-total")
  }
};

render();

elements.search.addEventListener("input", render);
elements.statusFilter.addEventListener("change", render);
elements.difficultyFilter.addEventListener("change", render);
elements.showCueDances.addEventListener("change", render);

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const dance = {
    id: elements.id.value || createId(),
    name: elements.name.value.trim(),
    songs: parseSongs(elements.songs.value),
    counts: Number(elements.counts.value) || "",
    difficulty: elements.difficulty.value,
    tags: elements.tags.value,
    restarts: elements.restarts.value,
    status: elements.status.value,
    notes: elements.notes.value.trim()
  };

  if (!dance.name || dance.songs.length === 0) return;

  const existingIndex = dances.findIndex((item) => item.id === dance.id);
  if (existingIndex >= 0) {
    dances[existingIndex] = dance;
    setMessage(`Updated ${dance.name}.`);
  } else {
    dances.unshift(dance);
    setMessage(`Added ${dance.name}.`);
  }

  saveDances();
  resetForm();
  render();
});

elements.cancelEdit.addEventListener("click", resetForm);

elements.resetSamples.addEventListener("click", () => {
  const existingNames = new Set(dances.map((dance) => dance.name.toLowerCase()));
  const freshSamples = starterDances
    .filter((dance) => !existingNames.has(dance.name.toLowerCase()))
    .map((dance) => ({ ...dance, id: createId() }));

  dances = [...freshSamples, ...dances];
  saveDances();
  render();
  setMessage(freshSamples.length ? "Starter dances restored." : "Starter dances are already in your library.");
});

elements.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(dances, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "line-dance-tracker.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setMessage("Export ready.");
});

elements.importData.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) {
      throw new Error("The file must contain a list of dances.");
    }

    dances = imported.map(normalizeDance);
    saveDances();
    render();
    setMessage("Import complete.");
  } catch (error) {
    setMessage(error.message || "That file could not be imported.");
  } finally {
    elements.importData.value = "";
  }
});

function loadDances() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return starterDances.map((dance) => ({ ...dance, id: createId() }));
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeDance) : [];
  } catch {
    return starterDances.map((dance) => ({ ...dance, id: createId() }));
  }
}

function normalizeDance(dance) {
  return {
    id: dance.id || createId(),
    name: dance.name || "Untitled dance",
    songs: Array.isArray(dance.songs) ? dance.songs : parseSongs(dance.songs || ""),
    counts: dance.counts || "",
    difficulty: dance.difficulty || "Beginner",
    tags: dance.tags || "No",
    restarts: dance.restarts || "No",
    status: dance.status || "none",
    notes: dance.notes || ""
  };
}

function saveDances() {
  localStorage.setItem(storageKey, JSON.stringify(dances));
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `dance-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  renderStats();
  elements.list.replaceChildren();

  const filteredDances = dances.filter(matchesFilters);

  if (filteredDances.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No dances match those filters yet.";
    elements.list.append(empty);
    return;
  }

  filteredDances.forEach((dance) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = dance.name;
    card.querySelector(".status-pill").textContent = labels[dance.status] || labels.none;
    card.querySelector(".songs").textContent = dance.songs.join(", ");
    card.querySelector(".notes").textContent = dance.notes || "No notes yet.";

    const statusSelect = card.querySelector(".status-select");
    statusSelect.value = dance.status;
    statusSelect.addEventListener("change", () => updateStatus(dance.id, statusSelect.value));

    const details = card.querySelector(".details");
    [
      ["Counts", dance.counts || "Unknown"],
      ["Difficulty", dance.difficulty],
      ["Tags", dance.tags],
      ["Restarts", dance.restarts]
    ].forEach(([term, description]) => {
      const group = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = description;
      group.append(dt, dd);
      details.append(group);
    });

    card.querySelector(".edit").addEventListener("click", () => editDance(dance.id));
    card.querySelector(".delete").addEventListener("click", () => deleteDance(dance.id));
    elements.list.append(card);
  });
}

function renderStats() {
  elements.stats.know.textContent = dances.filter((dance) => dance.status === "know").length;
  elements.stats.learning.textContent = dances.filter((dance) => dance.status === "learning").length;
  elements.stats.want.textContent = dances.filter((dance) => dance.status === "want").length;
  elements.stats.total.textContent = dances.length;
}

function matchesFilters(dance) {
  const query = elements.search.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  const difficulty = elements.difficultyFilter.value;
  const onlyCues = elements.showCueDances.checked;
  const searchableText = [
    dance.name,
    dance.songs.join(" "),
    dance.counts,
    dance.difficulty,
    dance.tags,
    dance.restarts,
    dance.notes
  ]
    .join(" ")
    .toLowerCase();

  return (
    (!query || searchableText.includes(query)) &&
    (status === "all" || dance.status === status) &&
    (difficulty === "all" || dance.difficulty === difficulty) &&
    (!onlyCues || dance.tags !== "No" || dance.restarts !== "No")
  );
}

function parseSongs(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/\n|,/)
    .map((song) => song.trim())
    .filter(Boolean);
}

function updateStatus(id, status) {
  dances = dances.map((dance) => (dance.id === id ? { ...dance, status } : dance));
  saveDances();
  render();
}

function editDance(id) {
  const dance = dances.find((item) => item.id === id);
  if (!dance) return;

  elements.formTitle.textContent = "Edit dance";
  elements.id.value = dance.id;
  elements.name.value = dance.name;
  elements.songs.value = dance.songs.join("\n");
  elements.counts.value = dance.counts;
  elements.difficulty.value = dance.difficulty;
  elements.tags.value = dance.tags;
  elements.restarts.value = dance.restarts;
  elements.status.value = dance.status;
  elements.notes.value = dance.notes;
  elements.cancelEdit.hidden = false;
  elements.name.focus();
}

function deleteDance(id) {
  const dance = dances.find((item) => item.id === id);
  if (!dance) return;

  const confirmed = confirm(`Delete ${dance.name}?`);
  if (!confirmed) return;

  dances = dances.filter((item) => item.id !== id);
  saveDances();
  render();
  setMessage(`Deleted ${dance.name}.`);
}

function resetForm() {
  elements.form.reset();
  elements.id.value = "";
  elements.formTitle.textContent = "Add a dance";
  elements.cancelEdit.hidden = true;
}

function setMessage(message) {
  elements.dataMessage.textContent = message;
}
