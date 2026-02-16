import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Image as ImageIcon, HelpCircle, ExternalLink } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { getStatusColor } from '../lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { theme, userData, updateUserData, isDarkMode, toggleDarkMode, uploadImage, user, logout } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempName, setTempName] = useState(userData.name);
  const [tempBio, setTempBio] = useState(userData.bio);
  const [discordId, setDiscordId] = useState('');
  const [isFetchingDiscord, setIsFetchingDiscord] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleFetchDiscord = async () => {
    if (!discordId) return;
    
    setIsFetchingDiscord(true);
    try {
      // Use Lanyard API to fetch Discord user data
      const response = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
      const data = await response.json();
      
      if (data.success) {
        const { discord_user, discord_status } = data.data;
        
        const avatarUrl = discord_user.avatar 
          ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.${discord_user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(discord_user.discriminator) % 5}.png`;
          
        setTempName(discord_user.display_name || discord_user.username);
        
        const updates: any = { 
            name: discord_user.display_name || discord_user.username,
            avatar: avatarUrl,
            status: discord_status
        };

        if (discord_user.banner) {
           const bannerUrl = `https://cdn.discordapp.com/banners/${discord_user.id}/${discord_user.banner}.${discord_user.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`;
           updates.backgroundImage = bannerUrl;
        }

        await updateUserData(updates);
        
        alert('Discord profile fetched successfully!');
      } else {
        alert('Could not fetch Discord data. Make sure the ID is correct and you are visible to Lanyard (join their server or use the app).');
      }
    } catch (error) {
      console.error('Error fetching Discord data:', error);
      alert('Error connecting to Discord data provider.');
    } finally {
      setIsFetchingDiscord(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'account'>('profile');

  const handleSave = () => {
    updateUserData({ name: tempName, bio: tempBio });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      // Upload to Supabase
      const publicUrl = await uploadImage(file, 'images', type);

      if (publicUrl) {
        if (type === 'avatar') {
          await updateUserData({ avatar: publicUrl });
        } else {
          await updateUserData({ backgroundImage: publicUrl });
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 max-w-2xl mx-auto">
      <header className="flex items-center gap-2 mb-4">
        <h1 className={`text-2xl font-bold ${theme.colors.accent} flex items-center gap-2`}>
          <SettingsIcon className={theme.colors.text} />
          Settings
        </h1>
      </header>

      {/* Unified Settings Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#111214] rounded-[20px] overflow-hidden shadow-2xl border border-gray-800"
      >
        {/* Profile Banner Preview (Always visible at top) */}
        <div 
          className="h-[120px] w-full relative"
          style={{
            backgroundColor: userData.themeColors ? `rgb(${userData.themeColors.primary})` : '#5865F2',
            backgroundImage: userData.backgroundImage ? `url(${userData.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
           {/* Avatar Overlay */}
           <div className="absolute -bottom-[45px] left-6 p-1.5 bg-[#111214] rounded-full z-10">
             <div className="w-[90px] h-[90px] rounded-full overflow-hidden relative">
               <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover bg-[#2B2D31]" />
               <div className={`absolute bottom-1 right-1 w-5 h-5 ${getStatusColor(userData.status)} rounded-full border-4 border-[#111214]`} title={userData.status || 'offline'}></div>
             </div>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-end px-4 pt-2 border-b border-gray-800 bg-[#111214]">
           <div className="flex gap-1 pb-2 mt-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'profile' ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#3F4147]/50'}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab('appearance')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'appearance' ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#3F4147]/50'}`}
              >
                Appearance
              </button>
              <button 
                onClick={() => setActiveTab('account')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'account' ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#3F4147]/50'}`}
              >
                Account
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-6 pt-12 bg-[#111214] min-h-[300px]">
           {activeTab === 'profile' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-6"
             >
                <div className="bg-[#2B2D31] rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-100 font-bold uppercase text-xs tracking-wide">User Profile</h3>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      {isEditing ? 'Cancel Editing' : 'Edit User Profile'}
                    </button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex gap-2 items-center pb-4 border-b border-gray-700">
                        <input
                            type="text"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            className="flex-1 p-2 rounded bg-[#1E1F22] text-gray-100 text-xs border border-gray-700 focus:ring-0"
                            placeholder="Discord User ID (Auto-fetch)"
                        />
                        <button 
                            onClick={handleFetchDiscord}
                            disabled={isFetchingDiscord}
                            className="px-3 py-2 bg-[#5865F2] text-white text-xs font-bold rounded hover:bg-[#4752C4] whitespace-nowrap disabled:opacity-50 transition-colors"
                        >
                            {isFetchingDiscord ? '...' : 'Fetch'}
                        </button>
                      </div>
                      
                      <div className="bg-[#1E1F22] p-3 rounded border border-gray-700/50">
                        <div className="flex gap-3">
                          <div className="mt-0.5 min-w-[20px]">
                             <HelpCircle size={16} className="text-[#5865F2]" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-300 font-medium">To display your Discord status:</p>
                            <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1 ml-1">
                              <li>Join the <a href="https://discord.gg/lanyard" target="_blank" rel="noopener noreferrer" className="text-[#5865F2] hover:underline">Lanyard Discord Server</a></li>
                              <li>Make sure you are not "Invisible" on Discord</li>
                              <li>Enter your User ID above and click Fetch</li>
                            </ol>
                            <a 
                              href="https://discord.gg/lanyard" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-xs text-white bg-[#5865F2] hover:bg-[#4752C4] px-3 py-1.5 rounded transition-colors mt-1"
                            >
                              Join Server <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Display Name</label>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="w-full p-2.5 rounded bg-[#1E1F22] text-gray-100 border-none focus:ring-0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">About Me</label>
                        <textarea
                          value={tempBio}
                          onChange={(e) => setTempBio(e.target.value)}
                          className="w-full p-2.5 rounded bg-[#1E1F22] text-gray-100 border-none focus:ring-0 resize-none h-24"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={handleSave}
                          className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-100">{userData.name}</h2>
                          {userData.status && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              userData.status === 'online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              userData.status === 'idle' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              userData.status === 'dnd' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            } border`}>
                              {userData.status === 'dnd' ? 'Do Not Disturb' : userData.status}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{user === 'angy' ? 'angy' : 'bozy'}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-600/50">
                        <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">About Me</h4>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{userData.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
             </motion.div>
           )}

           {activeTab === 'appearance' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-6"
             >
                <div className="space-y-4">
                  <h3 className="text-gray-100 font-bold uppercase text-xs tracking-wide mb-4">Theme & Customization</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[#2B2D31]">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Moon size={20} className="text-gray-300" /> : <Sun size={20} className="text-gray-300" />}
                      <span className="text-gray-200 font-medium">Dark Mode</span>
                    </div>
                    <button 
                      onClick={toggleDarkMode}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-[#2B2D31] space-y-4">
                    <p className="text-gray-200 font-medium flex items-center gap-2">
                      <ImageIcon size={18} /> Profile Images
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full p-3 rounded bg-[#1E1F22] hover:bg-[#3F4147] transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm text-gray-300">Change Avatar</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                           <img src={userData.avatar} className="w-full h-full object-cover" />
                        </div>
                      </button>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={() => backgroundInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full p-3 rounded bg-[#1E1F22] hover:bg-[#3F4147] transition-colors flex items-center justify-between group"
                        >
                          <span className="text-sm text-gray-300">Change Profile Banner</span>
                          <div className="w-12 h-8 rounded overflow-hidden bg-gray-700">
                             {userData.backgroundImage && <img src={userData.backgroundImage} className="w-full h-full object-cover" />}
                          </div>
                        </button>
                        {userData.backgroundImage && (
                          <button 
                            onClick={() => updateUserData({ backgroundImage: '', themeColors: undefined })}
                            className="text-xs text-red-400 hover:underline px-1"
                          >
                            Remove Custom Banner
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
             </motion.div>
           )}

           {activeTab === 'account' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-6"
             >
                <h3 className="text-gray-100 font-bold uppercase text-xs tracking-wide mb-4">Account Management</h3>
                
                <div className="bg-[#2B2D31] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-gray-200 font-medium">Log Out</h4>
                      <p className="text-xs text-gray-400">Sign out of your current session</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="px-4 py-2 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium border border-red-500/20"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
             </motion.div>
           )}
        </div>
      </motion.div>

      {/* Hidden Inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'avatar')}
      />
      <input 
        type="file" 
        ref={backgroundInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'background')}
      />
    </div>
  );
}
