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

function createComment(comment, discussionName, isReply = false) {
  const item = document.createElement("div");
  item.className = isReply ? "comment reply" : "comment";
  item.innerHTML = `
    <div class="comment-head">
      <strong>Anonim</strong>
      <span>Baru saja</span>
    </div>
    <p>${comment.text}</p>
    ${isReply ? "" : "<button class='reply-button' type='button'>Balas</button>"}
  `;

  if (!isReply) {
    const replyButton = item.querySelector(".reply-button");
    replyButton.addEventListener("click", () => {
      const answer = prompt("Tulis balasan anonim:");
      if (!answer || !answer.trim()) return;
      const reply = createComment({ text: cleanText(answer) }, discussionName, true);
      item.after(reply);
    });
  }

  return item;
}

function cleanText(value) {
  return value.replace(/[<>]/g, "").trim();
}

function buildDiscussion(box) {
  const discussionName = box.dataset.discussion;
  const comments = starterComments[discussionName] || [];

  box.innerHTML = `
    <form class="discussion-form">
      <textarea required placeholder="Tulis pesan anonim..."></textarea>
      <button class="btn btn-primary" type="submit">Kirim Komentar</button>
    </form>
    <div class="comment-list"></div>
  `;

  const form = box.querySelector(".discussion-form");
  const textarea = box.querySelector("textarea");
  const list = box.querySelector(".comment-list");

  comments.forEach(comment => {
    list.appendChild(createComment(comment, discussionName));
    comment.replies.forEach(reply => {
      list.appendChild(createComment({ text: reply }, discussionName, true));
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = cleanText(textarea.value);
    if (!text) return;
    async function loadComments(discussionName, list) {
  try {
    const response = await fetch(`/api/comments?discussion=${encodeURIComponent(discussionName)}`);

    if (!response.ok) {
      throw new Error("Gagal memuat komentar.");
    }

    const comments = await response.json();

    list.innerHTML = "";
    comments.forEach(comment => {
      list.appendChild(createComment({ text: comment.text }, discussionName));
    });
  } catch (error) {
    list.innerHTML = "<p>Belum bisa memuat komentar.</p>";
  }
}

function buildDiscussion(box) {
  const discussionName = box.dataset.discussion;

  box.innerHTML = `
    <form class="discussion-form">
      <textarea required placeholder="Tulis pesan anonim..."></textarea>
      <button class="btn btn-primary" type="submit">Kirim Komentar</button>
    </form>
    <div class="comment-list"></div>
  `;

  const form = box.querySelector(".discussion-form");
  const textarea = box.querySelector("textarea");
  const list = box.querySelector(".comment-list");

  loadComments(discussionName, list);

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const text = cleanText(textarea.value);
    if (!text) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discussion: discussionName,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim komentar.");
      }

      const savedComment = await response.json();

      list.prepend(createComment({ text: savedComment.text }, discussionName));
      form.reset();
    } catch (error) {
      alert("Komentar belum terkirim. Coba lagi nanti.");
    }
  });
};
    form.reset();
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


document.querySelectorAll(".survey button").forEach(button => {
  button.addEventListener("click", () => {
    const count = button.querySelector("span");
    count.textContent = Number(count.textContent) + 1;
    document.querySelector(".survey-note").textContent = `Terima kasih. Suara untuk isu ${button.dataset.vote} sudah ditambahkan.`;
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
showPage(location.hash.replace("#", "") || "beranda");
revealVisibleElements();
