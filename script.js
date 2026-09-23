const CONFIG = {
    discordId: "958614271221182484",
    bio: ["heartrev", "rev that shit"]
};

const API = `https://api.lanyard.rest/v1/users/${CONFIG.discordId}`;
const $ = id => document.getElementById(id);


/* DISCORD */

function avatarUrl(u) {
    if (!u?.avatar) {
        const i = Number((BigInt(u?.id || "0") >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${i}.png`;
    }

    return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith("a_") ? "gif" : "png"}?size=512`;
}

function decorationUrl(u) {
    const a = u?.avatar_decoration_data?.asset;

    return a
        ? `https://cdn.discordapp.com/avatar-decoration-presets/${a}.png?size=512`
        : null;
}

function updateDiscord(d) {
    const u = d.discord_user;

    if (!u) return;

    const display = u.global_name || u.username;

    $("name").textContent = display;
$("handle").textContent = "@" + u.username;

const serverTag = $("server-tag");
const serverTagIcon = $("server-tag-icon");
const serverTagText = $("server-tag-text");

const tag = u.primary_guild;

if (serverTag && serverTagIcon && serverTagText) {

    if (tag?.identity_enabled && tag?.tag) {

        serverTagText.textContent = tag.tag;

        if (tag.badge && tag.identity_guild_id) {
            serverTagIcon.src =
                `https://cdn.discordapp.com/clan-badges/${tag.identity_guild_id}/${tag.badge}.png?size=64`;

            serverTagIcon.style.display = "block";
        } else {
            serverTagIcon.style.display = "none";
        }

        serverTag.style.display = "inline-flex";

    } else {

        serverTag.style.display = "none";
        serverTagText.textContent = "";
        serverTagIcon.src = "";

    }
}
    $("avatar").src = avatarUrl(u);

const favicon = $("favicon");

if (favicon) {
    favicon.href = avatarUrl(u);
}
    const dec = decorationUrl(u);

    $("avatar-decoration").style.display = dec ? "block" : "none";

    if (dec) {
        $("avatar-decoration").src = dec;
    }

    const status = ["online", "idle", "dnd"].includes(d.discord_status)
        ? d.discord_status
        : "offline";

    $("status-dot").className = "status-dot " + status;
    updateActivities(d.activities || []);
}

async function fetchLanyard() {
    try {
        const response = await fetch(API, {
            cache: "no-store"
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.success) {
            updateDiscord(data.data);
        }

    } catch (error) {
        console.error("Lanyard error:", error);
    }
}
function updateActivities(activities) {

    const container = $("activities");

    if (!container) return;

    const visible = activities.filter(activity => {

        return activity.type !== 2;

    });

    if (!visible.length) {

        container.innerHTML = `
            <div class="activity-card">
                <div class="activity-empty">
                    NO ACTIVE ACTIVITY
                </div>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    visible.forEach(activity => {

        const card = document.createElement("div");
        card.className = "activity-card";

        let type = "ACTIVITY";

        if (activity.type === 0) {
            type = "PLAYING";
        }

        if (activity.type === 1) {
            type = "STREAMING";
        }

        if (activity.type === 3) {
            type = "WATCHING";
        }

        if (activity.type === 5) {
            type = "COMPETING";
        }

        let image = "";

        if (activity.assets?.large_image) {

    const large = activity.assets.large_image;

    if (large.startsWith("mp:")) {

        image =
            "https://media.discordapp.net/" +
            large.substring(3);

    } else if (activity.application_id) {

        image =
            `https://cdn.discordapp.com/app-assets/${activity.application_id}/${large}.png`;

    }

}

        if (!image && activity.application_id) {

            image =
                `https://cdn.discordapp.com/app-icons/${activity.application_id}/${activity.application_id}.png?size=128`;

        }

        const details = activity.details || "";
        const state = activity.state || "";

        let timestamp = "";

        if (activity.timestamps?.start) {

            const elapsed =
                Math.floor((Date.now() - activity.timestamps.start) / 1000);

            if (elapsed > 0) {

                const hours = Math.floor(elapsed / 3600);
                const minutes = Math.floor((elapsed % 3600) / 60);

                if (hours > 0) {
                    timestamp = `${hours}h ${minutes}m elapsed`;
                } else {
                    timestamp = `${minutes}m elapsed`;
                }

            }

        }

        card.innerHTML = `

            <div class="activity-main">

                ${
                    image
                    ? `<img class="activity-image" src="${image}" alt="">`
                    : `<div class="activity-image"></div>`
                }

                <div class="activity-info">

                    <div class="activity-type">
                        • ${type}
                    </div>

                    <div class="activity-name">
                        ${activity.name || "Unknown Activity"}
                    </div>

                    ${
                        details
                        ? `<div class="activity-details">${details}</div>`
                        : ""
                    }

                    ${
                        state
                        ? `<div class="activity-state">${state}</div>`
                        : ""
                    }

                    ${
                        timestamp
                        ? `<div class="activity-state">${timestamp}</div>`
                        : ""
                    }

                </div>

            </div>

        `;

        if (activity.buttons?.length) {

            const buttons = document.createElement("div");

            buttons.className = "activity-buttons";

            activity.buttons.forEach((button, index) => {

                const url = activity.metadata?.button_urls?.[index];

                if (!url) return;

                const a = document.createElement("a");

                a.className = "activity-button";
                a.href = url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = button;

                buttons.appendChild(a);

            });

            if (buttons.children.length) {
                card.appendChild(buttons);
            }

        }

        if (
            activity.type === 1 &&
            activity.url
        ) {

            const stream = document.createElement("a");

            stream.className = "activity-stream";
            stream.href = activity.url;
            stream.target = "_blank";
            stream.rel = "noopener noreferrer";
            stream.textContent = "▶  Watch Stream";

            card.appendChild(stream);

        }

        container.appendChild(card);

    });

}


/* MUSIC PLAYER */

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    seconds = Math.max(0, Math.floor(seconds));

    const minutes = Math.floor(seconds / 60);
    const secs = String(seconds % 60).padStart(2, "0");

    return `${minutes}:${secs}`;
}


window.addEventListener("DOMContentLoaded", () => {

    const enterScreen = $("enter-screen");

    const audio = $("audio");
    const playButton = $("music-play");
    const progress = $("progress");
    const currentTime = $("current-time");
    const duration = $("duration");
    const volume = $("volume");


    /* ENTER SCREEN */

    if (enterScreen) {

        enterScreen.addEventListener("click", () => {

            document.body.classList.remove("page-loading");

            enterScreen.classList.add("hidden");

        }, { once: true });

    }


    /* MUSIC */

    if (!audio || !playButton) {
        console.error("Music player elements not found.");
        return;
    }


    /* DEFAULT VOLUME = 25% */

    audio.volume = 0.25;

    if (volume) {
        volume.value = 0.25;
    }


    /* PLAY / PAUSE */

    playButton.addEventListener("click", async (event) => {

        event.stopPropagation();

        try {

            if (audio.paused) {

                await audio.play();

                playButton.textContent = "Ⅱ";

            } else {

                audio.pause();

                playButton.textContent = "▶";

            }

        } catch (error) {

            console.error("Audio playback error:", error);

            alert("Hindi ma-play ang song. Check mo kung tama ang assets/song.mp3.");

        }

    });


    /* SONG LOADED */

    audio.addEventListener("loadedmetadata", () => {

        if (duration) {
            duration.textContent = formatTime(audio.duration);
        }

        if (progress) {
            progress.max = audio.duration;
            progress.value = 0;
        }

    });


    /* PROGRESS */

    audio.addEventListener("timeupdate", () => {

        if (currentTime) {
            currentTime.textContent = formatTime(audio.currentTime);
        }

        if (progress && !progress.matches(":active")) {
            progress.value = audio.currentTime;
        }

    });


    /* DRAG PROGRESS */

    if (progress) {

        progress.addEventListener("input", () => {

            audio.currentTime = Number(progress.value);

        });

    }


    /* VOLUME */

    if (volume) {

        volume.addEventListener("input", () => {

            audio.volume = Number(volume.value);

        });

    }


    /* PLAY */

    audio.addEventListener("play", () => {

        playButton.textContent = "Ⅱ";

    });


    /* PAUSE */

    audio.addEventListener("pause", () => {

        playButton.textContent = "▶";

    });


    /* END */

    audio.addEventListener("ended", () => {

        playButton.textContent = "▶";

        if (progress) {
            progress.value = 0;
        }

        if (currentTime) {
            currentTime.textContent = "0:00";
        }

    });


    /* AUDIO ERROR */

    audio.addEventListener("error", () => {

        console.error("Audio file could not be loaded:", audio.error);

    });

});


/* BIO */

let bioIndex = 0;
let bioChar = 0;
let deleting = false;

function typeBio() {

    const bio = $("bio");

    if (!bio || !CONFIG.bio.length) return;

    const text = CONFIG.bio[bioIndex];

    if (!deleting) {

        bioChar++;

        bio.textContent = text.slice(0, bioChar);

        if (bioChar >= text.length) {

            deleting = true;

            setTimeout(typeBio, 1600);

            return;
        }

        setTimeout(typeBio, 60);

    } else {

        bioChar--;

        bio.textContent = text.slice(0, bioChar);

        if (bioChar <= 0) {

            bioChar = 0;
            deleting = false;
            bioIndex = (bioIndex + 1) % CONFIG.bio.length;

        }

        setTimeout(typeBio, 30);

    }

}


/* START */

fetchLanyard();

setInterval(fetchLanyard, 5000);

typeBio();