import { useEffect, useState } from "react";
import "./App.css";

// Firebase Firestore
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// React Router v6 (no BrowserRouter or Router here, because it's in main.jsx)
import { Routes, Route, Navigate } from "react-router-dom";

// Firebase Auth
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Your pages
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import TrophyCabinet from "./pages/TrophyCabinet";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import RandomXI from "./pages/RandomXI";
import SocialSharingButtons from "./components/SocialSharingButtons";


// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';


function createEmbedURL(youtubeURL) {
  let videoID;
  
  try {
    // Handle youtu.be format
    if (youtubeURL.includes('youtu.be/')) {
      videoID = youtubeURL.split('youtu.be/')[1].split('?')[0];
    }
    // Handle youtube.com/watch format
    else if (youtubeURL.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(youtubeURL).search);
      videoID = urlParams.get('v');
    }
    // Handle youtube.com/shorts format
    else if (youtubeURL.includes('youtube.com/shorts/')) {
      videoID = youtubeURL.split('youtube.com/shorts/')[1].split('?')[0];
    }
    // Handle direct video ID (like in your first example)
    else if (youtubeURL.includes('youtube.com/')) {
      // Extract everything after youtube.com/ and before ?
      videoID = youtubeURL.split('youtube.com/')[1].split('?')[0];
    }
    // Default case
    else {
      // Assume the URL itself might be just the ID
      videoID = youtubeURL.trim();
    }

    // Clean up any remaining parameters or slashes
    videoID = videoID.split('/')[0].split('?')[0];
    
    return `https://www.youtube.com/embed/${videoID}?enablejsapi=1&origin=${window.location.origin}`;
  } catch (error) {
    console.error("Error processing YouTube URL:", error);
    return null;
  }
}


//
// SOUND EFFECTS LOGIC
let soundIndex = 0;

const playRandomSound = (isMuted) => {
  if (isMuted) return;

  const sounds = [
    "/sounds/who-mate.mp3",
    "/sounds/sad-trombone.mp3",
    "/sounds/laugh.mp3",
    "/sounds/sad-violin.mp3",
  ];
  const audio = new Audio(sounds[soundIndex]);
  audio.volume = 0.3;
  audio.play();
  soundIndex = (soundIndex + 1) % sounds.length;
};

function App() {
  // AUTH STATE
  const [user, setUser] = useState(null);

  // TROPHY / STATS / JOKES / ETC. STATE
  const [timeSinceTrophy, setTimeSinceTrophy] = useState("");
  const [funnyStat, setFunnyStat] = useState("");
  const [heroImages, setHeroImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statsJokes, setStatsJokes] = useState([]);
  const [results, setResults] = useState([]);
  const [embarrassingResult, setEmbarrassingResult] = useState(null);
  const [signings, setSignings] = useState([]);
  const [randomSigning, setRandomSigning] = useState(null);
  const [dvdClips, setDvdClips] = useState([]);
  const [spursClip, setSpursClip] = useState("");
  const [prevIndex, setPrevIndex] = useState(null);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('mute') === 'true';
  });
  
  const [recentSignings, setRecentSignings] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
const [imageA, setImageA] = useState({src: '', visible: true});
const [imageB, setImageB] = useState({src: '', visible: false});


  //
  // INITIAL FETCH & AUTH LISTENER
  //
  useEffect(() => {
    const auth = getAuth();

    // Listen for login/logout changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Fetch Firestore data
    const fetchData = async () => {
      try {
     // Hero images
const heroSnap = await getDocs(collection(db, "heroImages"));
const heroData = heroSnap.docs.map((doc) => doc.data());
setHeroImages(heroData);


        // Stats / Jokes
        const statsSnap = await getDocs(collection(db, "statsJokes"));
        const statsArray = statsSnap.docs.map((doc) => doc.data().content);
        setStatsJokes(statsArray);

        // Embarrassing Results
        const resultsSnap = await getDocs(collection(db, "embarrassingResults"));
        const resultsArray = resultsSnap.docs.map((doc) => doc.data());
        setResults(resultsArray);

        // Signings
        const signingsSnap = await getDocs(collection(db, "signings"));
        const signingsArray = signingsSnap.docs.map((doc) => doc.data());
        setSignings(signingsArray);

        // DVD clips
        const dvdSnap = await getDocs(collection(db, "dvdClips"));
        const dvdArray = dvdSnap.docs.map((doc) => doc.data().url);
        setDvdClips(dvdArray);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();

    // TROPHY TIMER
    const updateTimer = () => {
      const lastTrophyDate = new Date("2008-02-24T17:00:00Z");
      const now = new Date();
      const diff = now - lastTrophyDate;

      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      const days = Math.floor(
        (diff % (1000 * 60 * 60 * 24 * 365.25)) /
          (1000 * 60 * 60 * 24)
      );
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeSinceTrophy(
        `${years} years, ${days} days, ${hours}h ${minutes}m ${seconds}s`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (heroImages.length > 0) {
      // Initialize both images with the first hero image
      setImageA({src: heroImages[0].url, visible: true});
      setImageB({src: heroImages[0].url, visible: false});
      setActiveImageIdx(0);
    }
  }, [heroImages]);
  
  useEffect(() => {
    if (heroImages.length < 2) return;
    
    const interval = setInterval(() => {
      // Calculate next image index
      const nextIdx = (activeImageIdx + 1) % heroImages.length;
      
      // If A is visible, update B and make it visible
      if (imageA.visible) {
        setImageB({src: heroImages[nextIdx].url, visible: true});
        setImageA({...imageA, visible: false});
      } 
      // If B is visible, update A and make it visible
      else {
        setImageA({src: heroImages[nextIdx].url, visible: true});
        setImageB({...imageB, visible: false});
      }
      
      // Update the active index
      setActiveImageIdx(nextIdx);
      
    }, 10000); // Image changes every 10 seconds
    
    return () => clearInterval(interval);
  }, [heroImages, activeImageIdx, imageA, imageB]);
  
  //
  // LOGOUT
  //
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
  };

  //
  // SITE LOGIC
  //
  const showFunnyStat = () => {
    if (statsJokes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * statsJokes.length);
    setFunnyStat(statsJokes[randomIndex]);
    playRandomSound(isMuted);
  };

  const showEmbarrassingResult = () => {
    if (results.length === 0) return;
    const randomIndex = Math.floor(Math.random() * results.length);
    setEmbarrassingResult(results[randomIndex]);
    playRandomSound(isMuted);
  };

  const showRandomSigning = () => {
    const eligible = signings.filter(
      (signing) =>
        !signing.excludeFromSOTS && !recentSignings.includes(signing.name) // or signing.id if available
    );
  
    if (eligible.length === 0) {
      // Reset cooldown if all have been used recently
      setRecentSignings([]);
      return showRandomSigning(); // try again
    }
  
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const chosen = eligible[randomIndex];
  
    setRandomSigning(chosen);
    setRecentSignings((prev) => [...prev.slice(-19), chosen.name]); // or chosen.id
    playRandomSound(isMuted);
  };
  

  const showNextSpursClip = () => {
    if (dvdClips.length === 0) return;
  
    const nextIndex = (currentClipIndex + 1) % dvdClips.length;
    setCurrentClipIndex(nextIndex);
  
    const rawURL = dvdClips[nextIndex];
    const formatted = createEmbedURL(rawURL);
    setSpursClip(formatted);
    playRandomSound(isMuted); // keep this if you still want a sound on each click
  };
  
  

  //
  // RENDER ROUTES
  //
  return (
    <Routes>
      {/* LOGIN ROUTE */}
      <Route
        path="login"
        element={
          user ? (
            // If user is logged in, go to /admin
            <Navigate to="/admin" replace />
          ) : (
            // Otherwise, show the Login page
            <Login />
          )
        }
      />

Yes, replace that entire code block with this:
jsxCopy      {/* ADMIN ROUTE (PROTECTED) */}
      <Route
        path="admin"
        element={
          user ? (
            <>
              {/* Admin page content */}
              <Admin />
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            // If not logged in, go to /login
            <Navigate to="/login" replace />
          )
        }
      />

      {/* TROPHY CABINET ROUTE */}
      <Route path="/trophy-cabinet" element={<TrophyCabinet />} />

      {/* MAIN APP ROUTE */}
      <Route
        path=""
        element={
          <>
            {/* HEADER BANNER */}
            <div className="site-header">
  <div className="header-inner">
    <img src="/logo.png" alt="Spurs Logo" className="header-logo" />
    <div className="header-text">
  <h1>THE HISTORY OF THE TOTTENHAM</h1>
  <p className="tagline">The Spurs Mausoleum</p>
</div>
  </div>
</div>
        
            <div className="container">
              <div className="ad-slot">
                <img
                  src="/ads/no-cup.png"
                  alt="NoCup Finance Ad"
                  className="ad-banner"
                  style={{ width: "100%", maxWidth: "728px", height: "auto" }}
                />
              </div>
        
              {heroImages.length > 0 && (
  <div className="hero-rotation-wrapper">
    {/* Image A */}
    <img
      src={imageA.src}
      alt="Hero"
      className={`hero-img ${imageA.visible ? 'img-visible' : 'img-hidden'}`}
    />
    
    {/* Image B */}
    <img
      src={imageB.src}
      alt="Hero"
      className={`hero-img ${imageB.visible ? 'img-visible' : 'img-hidden'}`}
    />
    
    <div className="news-ticker">
      <div className="ticker-track">
        <div className="ticker-item">
          🐓 {heroImages[activeImageIdx]?.headline}
        </div>
      </div>
    </div>
  </div>
)}

{/* Social Sharing Buttons */}
<SocialSharingButtons />

<div className="dvd-header timer-header">
  <h2>⏱️ How Long Has It Been Since Spurs Won a Trophy?</h2>
  <div className="dvd-badge">Going for a record</div>
</div>


<div className="timer-box">
  <h2 className="trophy-timer">
    ⏱️ {timeSinceTrophy}
  </h2>
  <p className="subtext">Spoiler: It’s been a while.</p>
</div>

<button
    className="mute-toggle-button"
    onClick={() => setIsMuted(!isMuted)}
  >
    {isMuted ? "TURN SOUND ON 🔈" : "TURN SOUND OFF 🔇"}
  </button>
</div>

<div className="dvd-header">
  <h2>💩 Tottenham Legendary XI Generator</h2>
  <div className="dvd-badge">Click any shirt to reroll</div>
</div>


<RandomXI playRandomSound={playRandomSound} isMuted={isMuted} />
<div className="transparent-container">

            <div className="ad-slot">
  <img
    src="/ads/spurs-singles.png"
    alt="Spurs Singles Ad"
    className="ad-banner"
    style={{ width: "100%", maxWidth: "728px", height: "auto" }}
  />
</div>


<div className="timer-box trophy-cabinet-box">
  <a href="/trophy-cabinet" className="trophy-link">
    🏆 Visit Tottenham's Trophy Cabinet
  </a>
</div>
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
  
            <div className="button-stack">
              <button
                className="stat-button"
                onClick={() => {
                  showFunnyStat();
                }}
              >
                  Give me a spurs funny

              </button>

              {funnyStat && (
 <p className="stat-text">
 <span role="img" aria-label="funny">🤣</span>
 {funnyStat}
</p>

)}


              <button
                className="result-button"
                onClick={() => {
                  showEmbarrassingResult();
                }}
              >
                Reveal an embarrassing result
              </button>

              {embarrassingResult && (
                <div className="match-box">
                  <h3 className="match-score">{embarrassingResult.score}</h3>
                  <p className="match-details">{embarrassingResult.details}</p>
                  <a
                    href={embarrassingResult.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="match-link"
                  >
                    Read more
                  </a>
                </div>
              )}

<button className="signing-button last-button" onClick={() => { showRandomSigning(); }}>
  Show me a signing of the season
</button>
            </div>

            {randomSigning && (
  <div className="signing-card">
    <img
      src={randomSigning.image}
      alt={randomSigning.name}
      className="signing-img"
    />

    <h3>
      <a
        href={randomSigning.wiki}
        target="_blank"
        rel="noopener noreferrer"
      >
        {randomSigning.name}
      </a>
    </h3>

    <div className="signing-stats">
      <p>📅 Year Signed: {randomSigning.year}</p>
      <p>💰 Fee: {randomSigning.fee}</p>
      <p>
        📊 Apps: {randomSigning.apps} | Goals: {randomSigning.goals} | Assists:{" "}
        {randomSigning.assists}
      </p>
    </div>

    <p className="signing-bio">"{randomSigning.bio}"</p>
  </div>
)}

<div className="ad-slot">
  <img
    src="/ads/no-cup.png"
    alt="NoCup Finance Ad"
    className="ad-banner"
    style={{ width: "100%", maxWidth: "728px", height: "auto" }}
  />
</div>


<div className="dvd-section">
<div className="dvd-header">
  <h2>💿 Spurs’ Greatest Moments: The DVD</h2>
  <div className="dvd-badge">Limited Edition</div>
</div>


              <button
                className="stat-button"
                onClick={() => {
                  showNextSpursClip();
                }}
              >
                Play spurs classic dvd's
              </button>
             
              {spursClip && (
               <div className="video-wrapper">
               <div className="tv-frame">
                 <iframe
                   width="100%"
                   height="315"
                   src={spursClip}
                   title="Spurs Moment"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                 ></iframe>
               </div>
               
               <div className="dvd-tray">💿 Spurs DVD Player 3000™</div>
             </div>
             
              )}
            </div>

            <footer className="site-footer">
  <p>
    © 2025{" "}
    <a href="https://thehistoryofthetottenham.com" target="_blank" rel="noopener noreferrer">
      thehistoryofthetottenham.com
    </a>{" "}
    — No trophies were harmed in the making of this site.
  </p>
  <p>
    <a
      href="https://github.com/teknotel17/the-history-of-the-tottenham"
      target="_blank"
      rel="noopener noreferrer"
    >
      View on GitHub
    </a>{" "}
    | Sponsored by <strong>NoCup Finance™</strong>
  </p>
  <p>
    <a href="/privacy-policy">Privacy Policy</a> |{" "}
    <a href="/terms-of-use">Terms of Use</a> |{" "}
    <a href="mailto:info@thehistoryofthetottenham.com">Contact</a>
  </p>
</footer>
<Analytics />


</div>
</div>
    </>
  }
/>
       {/* NEW LEGAL ROUTES */}
  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
  <Route path="/terms-of-use" element={<TermsOfUse />} />
            {/* 404 FALLBACK ROUTE */}
            <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
