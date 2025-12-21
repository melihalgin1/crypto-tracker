import React, { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from './firebase';
import { translations } from './translations'; // Import texts

const ManageAccount = ({ user, onBack, lang = 'en' }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const t = translations[lang]; // Get current language texts

  // 1. CLEAR DATA ONLY (Keep Account)
  const handleClearData = async () => {
    if (!window.confirm(t.confirmReset)) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", user.uid));
      // Force reload to reset local state
      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Error: " + error.message);
      setIsDeleting(false);
    }
  };

  // 2. DELETE EVERYTHING (Nuke Account)
  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(`⚠ ${t.confirmDelete}`);
    if (!confirm1) return;

    setIsDeleting(true);
    try {
      // Step A: Delete Database Data
      await deleteDoc(doc(db, "users", user.uid));
      
      // Step B: Delete Authentication User
      await deleteUser(auth.currentUser);
      
      // Auth listener in App.jsx will handle the redirect to guest mode
    } catch (error) {
      console.error("Delete Error:", error);
      setIsDeleting(false);
      
      // Security Check: Firebase requires a recent login to delete an account
      if (error.code === 'auth/requires-recent-login') {
        alert("Security measure: Please Sign Out and Sign In again, then try deleting your account immediately.");
      } else {
        alert("Error deleting account: " + error.message);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button 
        onClick={onBack} 
        className="mb-6 text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
      >
        {t.back}
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center gap-4">
          <img 
            src={user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName} 
            alt="Profile" 
            className="w-16 h-16 rounded-full border-2 border-white shadow-md"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Section 1: Portfolio Management */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t.portfolioData}</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {t.resetDesc}
            </p>
            <button 
              onClick={handleClearData}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors border border-gray-200"
            >
              {t.resetPortfolio}
            </button>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Section 2: Danger Zone */}
          <div>
            <h3 className="text-lg font-bold text-red-600 mb-2">{t.dangerZone}</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {t.deleteDesc}
            </p>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors border border-red-200"
            >
              {isDeleting ? t.processing : t.deleteAccount}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageAccount;