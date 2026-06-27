(function () {
  const BASE      = "https://d3d4yli4hf5bmh.cloudfront.net/hls/";
  const MASTER_URL= BASE + "live.m3u8";
  const FLAC_URL  = BASE + "flac_hires.m3u8";  // lossless, fMP4 / FLAC
  const AAC_URL   = BASE + "aac_hifi.m3u8";    // AAC, MPEG-TS (universal)

  const META_URL  = "https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json";
  const COVER_URL = "https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg";

  const audio    = document.getElementById("audio");
  const playBtn  = document.getElementById("playBtn");
  const statusEl = document.getElementById("status");
  const timeEl   = document.getElementById("time");
  const volume   = document.getElementById("volume");
  const cover    = document.getElementById("cover");
  const npArtist = document.getElementById("npArtist");
  const npTitle  = document.getElementById("npTitle");
  const npAlbum  = document.getElementById("npAlbum");
  const srcQ     = document.getElementById("srcQuality");
  const streamQ  = document.getElementById("streamQuality");
  const recentList = document.getElementById("recentList");
  const thumbUp   = document.getElementById("thumbUp");
  const thumbDown = document.getElementById("thumbDown");
  const upCount   = document.getElementById("upCount");
  const downCount = document.getElementById("downCount");

  let hls = null;
  let ready = false;       // stream source attached?
  let usingFlac = false;   // currently on the lossless variant?
  let liveMeta = null;     // latest metadatav2.json payload
  let nowSong = null;      // { artist, title } currently being rated
  let myRating = 0;        // this listener's vote for nowSong (-1/0/1)
  // Identity is handled server-side via an IP-based fingerprint — no login
  // and no client token, so there's nothing here to clear and re-vote with.

  // Can this browser actually DECODE FLAC inside HLS?  Most desktop
  // browsers cannot, which is why the lossless variant just buffers.
  function flacSupported() {
    const native = audio.canPlayType('audio/mp4; codecs="flac"') !== ""
                || audio.canPlayType("application/vnd.apple.mpegurl") !== "";
    const mse = !!(window.MediaSource &&
                   MediaSource.isTypeSupported('audio/mp4; codecs="flac"'));
    return mse || native;
  }

  function setStatus(text, live) {
    statusEl.innerHTML = '<span class="live-dot"></span>' + text;
    statusEl.classList.toggle("is-live", !!live);
  }

  function fmtKhz(rate) {
    return (rate / 1000).toFixed(1).replace(/\.0$/, "");
  }

  // Source = the recording's quality (from metadata).
  // Stream = how we're delivering it (FLAC vs AAC over HLS).
  function setQuality() {
    if (liveMeta && liveMeta.bit_depth && liveMeta.sample_rate) {
      srcQ.textContent = liveMeta.bit_depth + "-bit " + fmtKhz(liveMeta.sample_rate) + "kHz";
    } else {
      srcQ.textContent = "—";
    }
    streamQ.textContent = usingFlac ? "lossless FLAC / HLS" : "AAC / HLS";
  }

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  }

  function setPlayingUI(playing) {
    playBtn.classList.toggle("is-playing", playing);
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    playBtn.setAttribute("aria-pressed", String(playing));
  }

  // (Re)load a specific variant playlist through hls.js.
  function loadWithHlsJs(url) {
    if (hls) { hls.destroy(); hls = null; }
    hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(url);
    hls.attachMedia(audio);
    hls.on(Hls.Events.ERROR, function (evt, data) {
      if (!data.fatal) return;
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          // Don't abandon lossless over a transient network blip — retry it.
          setStatus("Reconnecting…");
          hls.startLoad();
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          // A real decode failure. If we were on FLAC, the browser can't
          // decode it — fall back to AAC as a last resort.
          if (usingFlac) {
            usingFlac = false;
            setQuality();
            setStatus("Switching to AAC…");
            loadWithHlsJs(AAC_URL);
            audio.play().catch(() => {});
          } else {
            setStatus("Recovering…");
            hls.recoverMediaError();
          }
          break;
        default:
          setStatus("Stream unavailable");
          hls.destroy(); hls = null; ready = false;
          setPlayingUI(false);
      }
    });
  }

  // Attach the HLS stream, choosing lossless only when the browser can
  // decode it. Uses native HLS on Safari / iOS where available.
  function attachStream() {
    if (ready) return;
    usingFlac = flacSupported();
    setQuality();

    if (window.Hls && Hls.isSupported()) {
      loadWithHlsJs(usingFlac ? FLAC_URL : AAC_URL);
      ready = true;
    } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari, iOS) — let the OS negotiate the rendition.
      audio.src = MASTER_URL;
      ready = true;
    } else {
      setStatus("Can't play here");
    }
  }

  async function play() {
    attachStream();
    if (!ready) return;
    setStatus("Connecting…");
    try {
      await audio.play();
    } catch (err) {
      setStatus("Tap play again");
      setPlayingUI(false);
    }
  }

  function pause() { audio.pause(); }

  playBtn.addEventListener("click", function () {
    if (audio.paused) play();
    else pause();
  });

  audio.addEventListener("playing", () => { setPlayingUI(true);  setStatus("Live", true); });
  audio.addEventListener("pause",   () => { setPlayingUI(false); setStatus("Paused"); });
  audio.addEventListener("waiting", () => setStatus("Buffering…"));
  audio.addEventListener("stalled", () => setStatus("Buffering…"));
  audio.addEventListener("timeupdate", () => { timeEl.textContent = fmtTime(audio.currentTime); });

  // Volume
  audio.volume = volume.value / 100;
  volume.addEventListener("input", () => { audio.volume = volume.value / 100; });

  // Initialise the stream-quality line before playback begins.
  usingFlac = flacSupported();
  setQuality();

  // ---------- Song ratings ----------
  function renderRating(t) {
    upCount.textContent = t.up || 0;
    downCount.textContent = t.down || 0;
    myRating = t.yourRating || 0;
    thumbUp.classList.toggle("is-active", myRating === 1);
    thumbDown.classList.toggle("is-active", myRating === -1);
    thumbUp.setAttribute("aria-pressed", String(myRating === 1));
    thumbDown.setAttribute("aria-pressed", String(myRating === -1));
  }

  async function loadRating(song) {
    if (!song || (!song.artist && !song.title)) return;
    const q = new URLSearchParams({ artist: song.artist || "", title: song.title || "" });
    try {
      const res = await fetch("/api/ratings?" + q.toString(), { cache: "no-store" });
      if (res.ok) renderRating(await res.json());
    } catch (_) { /* leave last known counts */ }
  }

  async function vote(value) {
    if (!nowSong || (!nowSong.artist && !nowSong.title)) return;
    // Clicking your current choice again clears it (toggle). Otherwise it
    // switches. Either way the server keeps just one vote per listener.
    const rating = (myRating === value) ? 0 : value;
    thumbUp.disabled = thumbDown.disabled = true;
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: nowSong.artist || "", title: nowSong.title || "", rating: rating,
        }),
      });
      if (res.ok) renderRating(await res.json());
    } catch (_) { /* ignore; counts stay as-is */ }
    finally { thumbUp.disabled = thumbDown.disabled = false; }
  }

  thumbUp.addEventListener("click", () => vote(1));
  thumbDown.addEventListener("click", () => vote(-1));

  // ---------- Now-playing metadata ----------
  function renderMeta(m) {
    document.title = (m.artist && m.title)
      ? m.artist + " — " + m.title + " · RadioCalico"
      : "RadioCalico — Lossless Radio";

    npArtist.textContent = m.artist || "Radio Calico";
    npTitle.textContent = (m.title || "") + (m.date ? " (" + m.date + ")" : "");
    npAlbum.textContent = m.album || "";
    setQuality();

    // Previous tracks (prev_artist_1..5 / prev_title_1..5), "Artist: Title"
    const items = [];
    for (let i = 1; i <= 5; i++) {
      const a = m["prev_artist_" + i], t = m["prev_title_" + i];
      if (a || t) items.push({ a: a || "", t: t || "" });
    }
    if (items.length) {
      recentList.innerHTML = items.map(() =>
        '<li><span class="r-artist"></span><span class="r-title"></span></li>').join("");
      recentList.querySelectorAll("li").forEach((li, i) => {
        li.querySelector(".r-artist").textContent =
          items[i].a + (items[i].a && items[i].t ? ": " : "");
        li.querySelector(".r-title").textContent = items[i].t;
      });
    }
  }

  function refreshCover() {
    // cover.jpg is reused per track, so bust the cache on each refresh.
    const img = new Image();
    img.onload = () => { cover.src = img.src; };
    img.src = COVER_URL + "?t=" + Date.now();
  }

  async function pollMeta() {
    try {
      const res = await fetch(META_URL, { cache: "no-store" });
      if (!res.ok) return;
      const m = await res.json();
      const changed = !liveMeta ||
        m.title !== liveMeta.title || m.artist !== liveMeta.artist;
      liveMeta = m;
      renderMeta(m);
      if (changed) {
        refreshCover();
        nowSong = { artist: m.artist || "", title: m.title || "" };
        loadRating(nowSong);   // pull fresh totals for the new song
      }
    } catch (_) { /* keep last known metadata on transient failure */ }
  }

  pollMeta();
  setInterval(pollMeta, 10000);   // server caches for ~10s
})();
