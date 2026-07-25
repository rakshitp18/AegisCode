import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../contexts/AuthContext";
import TyndallParticles from "../components/ui/TyndallParticles";

const PRESETS = [
  {
    id: 1,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" fill="#ff005b"/><rect width="36" height="36" fill="#ffb238" rx="6" transform="translate(9 -5) rotate(219 18 18) scale(1)"/><g transform="translate(4.5 -4) rotate(9 18 18)"><path d="M15 19c2 1 4 1 6 0" stroke="#000000" stroke-linecap="round" fill="none"/><rect x="10" y="14" width="1.5" height="2" rx="1" fill="#000000" stroke="none"/><rect x="24" y="14" width="1.5" height="2" rx="1" fill="#000000" stroke="none"/></g></svg>`,
    alt: "Avatar 1",
  },
  {
    id: 2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" fill="#ff7d10"/><rect width="36" height="36" fill="#0a0310" rx="6" transform="translate(5 -1) rotate(55 18 18) scale(1.1)"/><g transform="translate(7 -6) rotate(-5 18 18)"><path d="M15 20c2 1 4 1 6 0" stroke="#FFFFFF" stroke-linecap="round" fill="none"/><rect x="14" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" stroke="none"/><rect x="20" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" stroke="none"/></g></svg>`,
    alt: "Avatar 2",
  },
  {
    id: 3,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" fill="#0a0310"/><rect width="36" height="36" fill="#ff005b" rx="36" transform="translate(-3 7) rotate(227 18 18) scale(1.2)"/><g transform="translate(-3 3.5) rotate(7 18 18)"><path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"/><rect x="12" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" stroke="none"/><rect x="22" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" stroke="none"/></g></svg>`,
    alt: "Avatar 3",
  },
  {
    id: 4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" fill="#d8fcb3"/><rect width="36" height="36" fill="#89fcb3" rx="6" transform="translate(9 -5) rotate(219 18 18) scale(1)"/><g transform="translate(4.5 -4) rotate(9 18 18)"><path d="M15 19c2 1 4 1 6 0" stroke="#000000" stroke-linecap="round" fill="none"/><rect x="10" y="14" width="1.5" height="2" rx="1" fill="#000000" stroke="none"/><rect x="24" y="14" width="1.5" height="2" rx="1" fill="#000000" stroke="none"/></g></svg>`,
    alt: "Avatar 4",
  }
];

function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Sync state with context user
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setProfileImage(user.image || null);
    }
  }, [user]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please check camera permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setProfileImage(dataUrl);
      }
      stopCamera();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result || null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Display name cannot be empty.");
      return;
    }

    setError("");
    updateProfile(displayName.trim(), profileImage);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-955 text-white flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-955 relative overflow-hidden">
        <TyndallParticles className="z-0" />
        {/* Animated Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-6 py-6 md:py-6.5 backdrop-blur-xl">
          <div className="text-center mb-4.5">
            <h2 className="text-xl font-bold tracking-tight mb-1">Profile Settings</h2>
            <p className="text-xs text-slate-400">Update your account information and avatar picture</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {showSuccess && (
            <div className="mb-6 p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <span className="text-base">✓</span>
              <span>Your profile details have been successfully updated!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950 flex items-center justify-center transition-all duration-300 group-hover:border-blue-500 shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-3xl">
                      {getInitials(displayName || user?.email)}
                    </div>
                  )}
                </div>

                {/* Change photo overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] uppercase font-bold tracking-wider gap-1 select-none">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Edit</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer border-none bg-transparent hover:underline"
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer border-none bg-transparent hover:underline"
                >
                  Take Photo
                </button>
                {profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-slate-400 hover:text-red-400 font-semibold cursor-pointer border-none bg-transparent hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* Predefined Avatars Selection */}
              <div className="w-full flex flex-col items-center gap-1.5 mt-1.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Select Predefined Avatar</span>
                <div className="flex gap-2.5 mt-0.5 justify-center">
                  {PRESETS.map((preset) => {
                    const presetDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(preset.svg)}`;
                    const isSelected = profileImage === presetDataUri;
                    
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setProfileImage(presetDataUri)}
                        className={`relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border-2 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${
                          isSelected ? "border-blue-500 ring-2 ring-blue-500/20 scale-105" : "border-slate-800 hover:border-slate-650"
                        }`}
                        title={preset.alt}
                      >
                        <div className="w-7.5 h-7.5 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: preset.svg }} />
                        {isSelected && (
                          <div className="absolute right-0.5 bottom-0.5 bg-blue-500 text-white rounded-full p-0.5 shadow flex items-center justify-center">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fields Section */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="w-full bg-[#141417]/50 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800/40 rounded-xl py-2 px-3 text-xs text-slate-550 select-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex gap-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/40 font-semibold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Back to Dashboard
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/15 active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera Preview Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Camera Preview</h3>
            
            <div className="w-64 h-64 rounded-2xl overflow-hidden bg-black border border-slate-800 relative shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>
            
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg shadow-blue-600/15"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
