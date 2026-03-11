'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import {
  Plus, Edit, Trash2, Check, X, Shield,
  User, DollarSign, Languages, Star, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ROBUT IMAGE URL HELPER
const getImageUrl = (path: any, name: string = 'User') => {
  if (!path || path === 'undefined' || path === 'null') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff`;
  }

  if (typeof path === 'object') {
    console.warn('getImageUrl received object:', path);
    const urlCandidate = path.url || path.secure_url || path.path;
    if (typeof urlCandidate === 'string') return getImageUrl(urlCandidate, name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff`;
  }

  if (typeof path !== 'string') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff`;
  }

  if (path.startsWith('http')) return path;
  if (path.startsWith('data:image')) return path; // Support Base64

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};

const AdminAstrologers = () => {
  const [astrologers, setAstrologers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: 'Vedic',
    personalityType: 'Traditional',
    ratePerMinute: 10,
    languages: 'English, Hindi',
    experience: 5,
    education: '',
    focusArea: '',
    isAvailable: true,
    tone: 'Professional and caring',
    styleGuide: 'Provide detailed explanations with practical advice',
    image: null
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPersonality, setFilterPersonality] = useState('All Personalities');

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.fetchAllAiAstrologers({ limit: 100, t: Date.now() } as any);
      const data = response.data;

      // Robust data extraction
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (data.data && Array.isArray(data.data.astrologers)) {
        list = data.data.astrologers;
      } else if (data.data && Array.isArray(data.data.items)) {
        list = data.data.items;
      } else if (data.astrologers && Array.isArray(data.astrologers)) {
        list = data.astrologers;
      }

      console.log('📡 Fetched AI Astrologers List (Refresh):', list);
      setAstrologers(list || []);
    } catch (error) {
      toast.error("Failed to load AI astrologers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAstrologers = astrologers.filter(a => {
    const name = a.name || '';
    const bio = a.bio || '';
    const personality = a.personalityType || a.personality || '';

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPersonality = filterPersonality === 'All Personalities' || personality === filterPersonality;
    return matchesSearch && matchesPersonality;
  });

  const getDisplayExpertise = (astrologer: any) => {
    if (Array.isArray(astrologer.specializations) && astrologer.specializations.length > 0) {
      const valid = astrologer.specializations.find((s: any) => typeof s === 'string' && s.trim().length > 0);
      if (valid) return valid;
    }
    if (astrologer.expertise && typeof astrologer.expertise === 'string' && astrologer.expertise.length > 0) {
      return astrologer.expertise;
    }
    if (astrologer.specialization && typeof astrologer.specialization === 'string' && astrologer.specialization.length > 0) {
      return astrologer.specialization;
    }
    return 'Vedic';
  };

  const handleOpenModal = (astrologer: any = null) => {
    if (astrologer) {
      setEditingId(astrologer._id);
      const expertiseValue = getDisplayExpertise(astrologer);
      const rateValue = astrologer.pricing?.chat ?? astrologer.ratePerMinute ?? 10;

      setFormData({
        name: astrologer.name || '',
        bio: astrologer.bio || '',
        expertise: expertiseValue,
        personalityType: astrologer.personalityType || astrologer.personality || 'Traditional',
        ratePerMinute: Number(rateValue),
        languages: Array.isArray(astrologer.languages) ? astrologer.languages.join(', ') : 'English',
        experience: astrologer.experience || 5,
        education: astrologer.education || '',
        focusArea: astrologer.focusArea || '',
        isAvailable: astrologer.isAvailable ?? astrologer.availability?.isAvailable ?? true,
        tone: astrologer.tone || '',
        styleGuide: astrologer.styleGuide || '',
        image: null
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        bio: '',
        expertise: 'Vedic',
        personalityType: 'Traditional',
        ratePerMinute: 10,
        languages: 'English, Hindi',
        experience: 5,
        education: '',
        focusArea: '',
        isAvailable: true,
        tone: 'Professional and caring',
        styleGuide: 'Provide detailed explanations with practical advice',
        image: null
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Values
    const rateVal = Number(formData.ratePerMinute);
    const expStr = formData.expertise || 'Vedic';
    const langArray = formData.languages.split(',').map(l => l.trim());

    // Prepare JSON Payload (Backend strategy)
    let payload: any = {
      name: formData.name,
      bio: formData.bio,
      personality: formData.personalityType,
      personalityType: formData.personalityType,
      experience: formData.experience,
      education: formData.education,
      focusArea: formData.focusArea,
      tone: formData.tone,
      styleGuide: formData.styleGuide,
      aiModel: 'GPT-4',
      knowledgeBase: 'Vedic Astrology',
      responseStyle: formData.personalityType,
      specializations: [expStr],
      expertise: expStr,
      languages: langArray,
      pricing: {
        chat: rateVal,
        call: rateVal,
        videoCall: rateVal * 2
      },
      isAvailable: formData.isAvailable,
      accountStatus: formData.isAvailable ? 'active' : 'inactive',
      ratePerMinute: rateVal
    };

    // AWS S3 Image Upload
    if (imageFile) {
      try {
        const uploadRes = await adminApi.uploadImage(imageFile);
        if (uploadRes.data.success) {
          payload.profilePicture = uploadRes.data.data.url;
          payload.image = payload.profilePicture;
        } else {
          toast.error("Image upload failed, using fallback if available");
        }
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        toast.error("Failed to upload image to AWS S3");
        // Don't proceed with save if image upload was intended but failed?
        // For now, continue without updating image if it fails.
      }
    }

    try {
      if (editingId) {
        const response: any = await adminApi.updateAIAstrologer(editingId, payload);
        const updatedFromBackend = response.data?.data || response.data;
        toast.success("Profile updated!");

        // OPTIMISTIC UPDATE
        setAstrologers(prevList => prevList.map(item => {
          if (item._id === editingId) {
            return {
              ...item,
              ...updatedFromBackend,
              ...payload, // Overlay our payload
              pricing: payload.pricing,
              specializations: [expStr],
              availability: {
                ...(item.availability || {}),
                isAvailable: formData.isAvailable
              }
            };
          }
          return item;
        }));

      } else {
        await adminApi.createAIAstrologer(payload);
        toast.success("New AI Astrologer created!");
      }
      setIsModalOpen(false);

      setTimeout(fetchAstrologers, 1500);

    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to save profile";
      toast.error(errorMsg);
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure?")) {
      try {
        await adminApi.deleteAIAstrologer(id);
        toast.success("Profile deleted");
        setTimeout(fetchAstrologers, 1000);
      } catch (error) {
        toast.error("Deletion failed");
      }
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      await adminApi.toggleAIAstrologerAvailability(id);
      fetchAstrologers();
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Restored Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Astrologers</h1>
          <p className="text-gray-500 mt-1">Configure AI personalities and expertise</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Create AI Profile
        </button>
      </div>

      {/* Restored Premium Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <select
          value={filterPersonality}
          onChange={(e) => setFilterPersonality(e.target.value)}
          className="border-gray-200 bg-gray-50 rounded-lg text-sm font-bold text-gray-600 p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option>All Personalities</option>
          <option>Traditional</option><option>Modern</option><option>Analytical</option><option>Empathetic</option><option>Mystical</option><option>Humorous</option>
        </select>
      </div>

      {/* Restored Premium Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Expertise</th>
                <th className="px-6 py-4">Personality</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && astrologers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading profiles...</td></tr>
              ) : filteredAstrologers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No AI astrologers found.</td></tr>
              ) : filteredAstrologers.map((astrologer) => (
                <tr key={astrologer._id || astrologer.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(astrologer.profilePicture || astrologer.image, astrologer.name)}
                        className="w-10 h-10 rounded-xl object-cover"
                        alt=""
                        onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name)}&background=0f172a&color=fff`)}
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">{astrologer.name}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                          {astrologer.ratings?.average || 4.5} · {astrologer.stats?.totalSessions || 0} Sessions
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold border border-indigo-100 uppercase tracking-tight">
                      {getDisplayExpertise(astrologer)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                      {astrologer.personalityType || astrologer.personality}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">₹{astrologer.pricing?.chat ?? astrologer.ratePerMinute ?? 0}</span>
                    <span className="text-xs text-gray-500 ml-1">/min</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAvailability(astrologer._id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${(astrologer.isAvailable || astrologer.availability?.isAvailable) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${(astrologer.isAvailable || astrologer.availability?.isAvailable) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      {(astrologer.isAvailable || astrologer.availability?.isAvailable) ? 'Online' : 'Offline'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(astrologer)} className="p-2 hover:bg-slate-100 text-slate-900 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(astrologer._id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restored Premium Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{editingId ? 'Edit AI Profile' : 'New AI Astrologer Profile'}</h3>
                <p className="text-xs text-gray-400">Define the personality and expertise of your AI</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-black/20 p-2 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Profile Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Swami Ajay" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Personality Type</label>
                    <select value={formData.personalityType} onChange={(e) => setFormData({ ...formData, personalityType: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                      <option>Traditional</option><option>Modern</option><option>Analytical</option><option>Empathetic</option><option>Mystical</option><option>Humorous</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Tone / Voice</label>
                    <input
                      type="text"
                      required
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Calm, wise, and encouraging"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Rate (₹ per min)</label>
                    <input type="number" required value={formData.ratePerMinute} onChange={(e) => setFormData({ ...formData, ratePerMinute: Number(e.target.value) })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Expertises</label>
                    <select value={formData.expertise} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700">
                      <option value="Vedic">Vedic</option><option value="Tarot">Tarot</option><option value="Numerology">Numerology</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Languages (comma separated)</label>
                    <input type="text" required value={formData.languages} onChange={(e) => setFormData({ ...formData, languages: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="English, Hindi" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Style Guide / Rules</label>
                    <textarea
                      rows={2}
                      value={formData.styleGuide}
                      onChange={(e) => setFormData({ ...formData, styleGuide: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      placeholder="e.g. Avoid jargon, use metaphors, always end with a blessing"
                    ></textarea>
                  </div>
                  <div className="flex items-center gap-2.5 pt-2">
                    <input type="checkbox" id="isAvailable" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="isAvailable" className="text-sm font-bold text-gray-700">Set Profile Online</label>
                  </div>
                </div>

                {/* Full Width Section */}
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Exp (Yrs)</label>
                    <input type="number" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Education</label>
                    <input type="text" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. PhD" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Focus Area</label>
                    <input type="text" value={formData.focusArea} onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Love, Career" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="w-full mt-1.5 text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer" />
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">AI Bio / Description</label>
                  <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="Describe the expertise and style of this AI..."></textarea>
                </div>

                <div className="col-span-full pt-4 flex gap-3">
                  <button type="submit" className="flex-grow bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                    {editingId ? 'Update AI Profile' : 'Save New Profile'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAstrologers;
