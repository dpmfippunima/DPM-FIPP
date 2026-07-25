const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll("[data-page-target]");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navItems = document.querySelectorAll(".nav-item");
const topButton = document.querySelector(".to-top");
const newsTrack = document.querySelector(".news-track");

const ormawaNames = [
  "BEM FIPP", "KPRM", "HIMAPSI", "HIMAPRO PGSD",
  "HIMAPRO BK", "HIMAPRO PKH", "HIMAPRO PG-PAUD", "UPK-MK FIPP",
  "BTM FIPP", "KMK FIPP", "MHDI FIPP", "MAPALA PAEDAGOGIC"
];

const starterComments = {};

function showPage(pageName) {
  const target = document.querySelector(`[data-page="${pageName}"]`);
  if (!target) return;

  pages.forEach(page => page.classList.remove("active"));
  target.classList.add("active");

  navLinks.forEach(link => {
    link.classList.toggle("active-link", link.dataset.pageTarget === pageName);
  });

  navMenu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  closeDropdowns();
  window.scrollTo({ top: 0, behavior: "smooth" });
  revealVisibleElements();
}

function closeDropdowns(exceptItem = null) {
  navItems.forEach(item => {
    if (item === exceptItem) return;
    item.classList.remove("open");
    const button = item.querySelector("button");
    if (button) button.setAttribute("aria-expanded", "false");
  });
}

function openDropdown(item) {
  const button = item.querySelector("button");
  closeDropdowns(item);
  item.classList.add("open");
  if (button) button.setAttribute("aria-expanded", "true");
}

navLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const pageName = link.dataset.pageTarget;
    history.pushState({ pageName }, "", `#${pageName}`);
    showPage(pageName);
  });
});

window.addEventListener("popstate", () => {
  showPage(location.hash.replace("#", "") || "beranda");
});

menuToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navItems.forEach(item => {
  const button = item.querySelector("button");
  button.setAttribute("aria-expanded", "false");

  item.addEventListener("mouseenter", () => {
    openDropdown(item);
  });

  item.addEventListener("mouseleave", () => {
    closeDropdowns();
  });

  button.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = item.classList.contains("open");
    if (isOpen) {
      closeDropdowns();
    } else {
      openDropdown(item);
    }
  });
});

document.addEventListener("click", event => {
  if (!event.target.closest(".nav-item")) {
    closeDropdowns();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeDropdowns();
  }
});

document.querySelectorAll("[data-slide]").forEach(button => {
  button.addEventListener("click", () => {
    const direction = button.dataset.slide === "next" ? 1 : -1;
    scrollNews(direction);
  });
});

function scrollNews(direction) {
  if (!newsTrack) return;

  const cards = Array.from(newsTrack.querySelectorAll(".news-card"));
  if (!cards.length) return;

  const styles = getComputedStyle(newsTrack);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;
  const cardWidth = cards[0].getBoundingClientRect().width;
  const step = cardWidth + gap;
  const maxScroll = newsTrack.scrollWidth - newsTrack.clientWidth;
  const targetLeft = Math.max(0, Math.min(maxScroll, newsTrack.scrollLeft + direction * step));

  newsTrack.scrollTo({ left: targetLeft, behavior: "smooth" });
}

function buildOrmawaCards() {
  const list = document.querySelector("#ormawa-list");
  const archive = document.querySelector("#archive-list");
  if (!list || !archive) return;

  ormawaNames.forEach((name, index) => {
    const card = document.createElement("article");
    card.innerHTML = `
      <span>ORMAWA ${String(index + 1).padStart(2, "0")}</span>
      <h3>${name}</h3>
      <p>Profil singkat, ruang publikasi program, dan evaluasi kinerja organisasi mahasiswa.</p>
      <a class="mini-button" href="#" aria-label="Evaluasi kinerja ${name}">Link Evaluasi</a>
    `;
    list.appendChild(card);

    const archiveLink = document.createElement("a");
    archiveLink.href = "#";
    archiveLink.textContent = `Arsip ${name}`;
    archive.appendChild(archiveLink);
  });
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCommentTime(value) {
  if (!value) return "Baru saja";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "Permintaan belum berhasil.");
  }

  return data;
}

function createComment(comment) {
  const item = document.createElement("div");
  item.className = "comment";
  item.innerHTML = `
    <div class="comment-head">
      <strong>Anonim</strong>
      <span>${escapeHtml(formatCommentTime(comment.created_at))}</span>
    </div>
    <p>${escapeHtml(comment.text)}</p>
  `;

  return item;
}

function setCommentMessage(list, message) {
  list.innerHTML = `<p class="comment-empty">${escapeHtml(message)}</p>`;
}

async function loadComments(discussionName, list) {
  setCommentMessage(list, "Memuat komentar...");

  try {
    const comments = await requestJson(`/api/comments?discussion=${encodeURIComponent(discussionName)}`);
    list.innerHTML = "";

    if (!comments.length) {
      setCommentMessage(list, "Belum ada komentar.");
      return;
    }

    comments.forEach(comment => {
      list.appendChild(createComment(comment));
    });
  } catch (error) {
    setCommentMessage(list, error.message || "Belum bisa memuat komentar.");
  }
}

function buildDiscussion(box) {
  const discussionName = box.dataset.discussion || "umum";

  box.innerHTML = `
    <form class="discussion-form">
      <textarea required placeholder="Tulis pesan anonim..."></textarea>
      <button class="btn btn-primary" type="submit">Kirim Komentar</button>
    </form>
    <div class="comment-list"></div>
  `;

  const form = box.querySelector(".discussion-form");
  const textarea = box.querySelector("textarea");
  const button = box.querySelector("button");
  const list = box.querySelector(".comment-list");

  loadComments(discussionName, list);

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const text = cleanText(textarea.value);
    if (!text) return;

    button.disabled = true;
    button.textContent = "Mengirim...";

    try {
      const savedComment = await requestJson("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discussion: discussionName,
          text,
        }),
      });

      if (list.querySelector(".comment-empty")) {
        list.innerHTML = "";
      }

      list.prepend(createComment(savedComment));
      form.reset();
    } catch (error) {
      alert(error.message || "Komentar belum terkirim. Coba lagi nanti.");
    } finally {
      button.disabled = false;
      button.textContent = "Kirim Komentar";
    }
  });
}

document.querySelectorAll(".discussion").forEach(buildDiscussion);


const aspirationForm = document.querySelector("#aspiration-form");

if (aspirationForm) {
  aspirationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const note = aspirationForm.querySelector(".form-note");
    const formData = new FormData(aspirationForm);

    const payload = {
      email: formData.get("email"),
      name: formData.get("name"),
      nim: formData.get("nim"),
      programStudi: formData.get("programStudi"),
      aspiration: formData.get("aspiration"),
    };

    note.textContent = "Mengirim aspirasi...";

    try {
      const response = await fetch("/api/aspirations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim aspirasi.");
      }

      note.textContent = "Aspirasi berhasil dikirim.";
      aspirationForm.reset();
    } catch (error) {
      note.textContent = "Aspirasi belum terkirim. Coba lagi nanti.";
    }
  });
}


const surveyButtons = Array.from(document.querySelectorAll(".survey button"));
const surveyNote = document.querySelector(".survey-note");
const surveyStorageKey = "dpm-fipp-survey-vote";

function getStoredSurveyVote() {
  try {
    return localStorage.getItem(surveyStorageKey);
  } catch (error) {
    return "";
  }
}

function setStoredSurveyVote(vote) {
  try {
    localStorage.setItem(surveyStorageKey, vote);
  } catch (error) {
    return;
  }
}

function updateSurveyCounts(counts) {
  const countMap = new Map((counts || []).map(item => [item.issue, item.votes]));

  surveyButtons.forEach(button => {
    const count = button.querySelector("span");
    const votes = countMap.get(button.dataset.vote);

    if (Number.isFinite(Number(votes))) {
      count.textContent = Number(votes);
    }
  });
}

function applySurveyVoteState() {
  const selectedVote = getStoredSurveyVote();
  if (!selectedVote) return;

  surveyButtons.forEach(button => {
    button.disabled = true;
    button.classList.toggle("selected", button.dataset.vote === selectedVote);
  });

  if (surveyNote) {
    surveyNote.textContent = `Kamu sudah memberi suara untuk isu ${selectedVote}.`;
  }
}

async function loadSurveyCounts() {
  if (!surveyButtons.length) return;

  try {
    const data = await requestJson("/api/survey");
    updateSurveyCounts(data.counts);
    applySurveyVoteState();
  } catch (error) {
    if (surveyNote) {
      surveyNote.textContent = error.message || "Survei belum terhubung ke server.";
    }
  }
}

surveyButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const vote = button.dataset.vote;

    if (getStoredSurveyVote()) {
      applySurveyVoteState();
      return;
    }

    surveyButtons.forEach(item => {
      item.disabled = true;
    });

    if (surveyNote) {
      surveyNote.textContent = "Mengirim suara...";
    }

    try {
      const data = await requestJson("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vote }),
      });

      updateSurveyCounts(data.counts);
      setStoredSurveyVote(vote);
      applySurveyVoteState();
    } catch (error) {
      surveyButtons.forEach(item => {
        item.disabled = false;
      });

      if (surveyNote) {
        surveyNote.textContent = error.message || "Suara belum terkirim. Coba lagi nanti.";
      }
    }
  });
});

function revealVisibleElements() {
  document.querySelectorAll(".page.active .reveal").forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      element.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", () => {
  revealVisibleElements();
  topButton.classList.toggle("show", window.scrollY > 420);
});

topButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

buildOrmawaCards();
loadSurveyCounts();
showPage(location.hash.replace("#", "") || "beranda");
revealVisibleElements();
