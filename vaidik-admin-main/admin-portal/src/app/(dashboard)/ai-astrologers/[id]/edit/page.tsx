'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

const SPECIALIZATIONS = [
  'Vedic Astrology',
  'Numerology',
  'Tarot Reading',
  'Palmistry',
  'Love & Relationships',
  'Career & Finance',
  'Health & Wellness',
  'Spiritual Guidance',
];

const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'];
const AI_MODELS = ['GPT-4', 'Claude-3', 'Gemini', 'LLaMA', 'Custom'];
const RESPONSE_STYLES = ['Traditional', 'Modern', 'Mystical', 'Scientific', 'Compassionate'];

export default function EditAIAstrologerPage() {
  const params = useParams();
  const router = useRouter();
  const aiAstrologerId = params.id as string;
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    profilePicture: '',
    bio: '',
    description: '',
    aiModel: '',
    knowledgeBase: '',
    responseStyle: '',
    specializations: [] as string[],
    languages: [] as string[],
    pricingChat: '',
    pricingCall: '',
    pricingVideoCall: '',
    expertise: 'Vedic',
    accountStatus: 'active',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: astrologer } = useQuery({
    queryKey: ['ai-astrologer', aiAstrologerId],
    queryFn: async () => {
      const response = await adminApi.getAIAstrologerDetails(aiAstrologerId);
      return response.data.data;
    },
    enabled: !!aiAstrologerId,
  });

  useEffect(() => {
    if (astrologer) {
      setFormData({
        name: astrologer.name || '',
        personality: astrologer.personality || '',
        profilePicture: astrologer.profilePicture || '',
        bio: astrologer.bio || '',
        description: astrologer.description || '',
        aiModel: astrologer.aiModel || '',
        knowledgeBase: astrologer.knowledgeBase || '',
        responseStyle: astrologer.responseStyle || '',
        specializations: astrologer.specializations || [],
        languages: astrologer.languages || [],
        pricingChat: astrologer.pricing?.chat?.toString() || '',
        pricingCall: astrologer.pricing?.call?.toString() || '',
        pricingVideoCall: astrologer.pricing?.videoCall?.toString() || '',
        expertise: astrologer.expertise || 'Vedic',
        accountStatus: astrologer.accountStatus || 'active',
      });
      if (astrologer.profilePicture) {
        setImagePreview(astrologer.profilePicture);
      }
    }
  }, [astrologer]);

  const { mutate: updateAIAstrologer, isPending } = useMutation({
    mutationFn: async () => {
      let profilePictureUrl = formData.profilePicture;

      if (imageFile) {
        try {
          const uploadRes = await adminApi.uploadImage(imageFile);
          if (uploadRes.data.success) {
            profilePictureUrl = uploadRes.data.data.url;
          }
        } catch (error) {
          console.error('Image upload failed', error);
        }
      }

      const payload = {
        name: formData.name,
        personality: formData.personality,
        profilePicture: profilePictureUrl,
        bio: formData.bio,
        description: formData.description,
        aiModel: formData.aiModel,
        knowledgeBase: formData.knowledgeBase,
        responseStyle: formData.responseStyle,
        specializations: formData.specializations,
        languages: formData.languages,
        expertise: formData.expertise,
        pricing: {
          chat: parseFloat(formData.pricingChat) || 0,
          call: parseFloat(formData.pricingCall) || 0,
          videoCall: parseFloat(formData.pricingVideoCall) || 0,
        },
        accountStatus: formData.accountStatus,
      };
      const response = await adminApi.updateAIAstrologer(aiAstrologerId, payload);
      return response.data;
    },
    onSuccess: () => {
      router.push(`/ai-astrologers/${aiAstrologerId}`);
    },
  });

  const handleAddSpecialization = (spec: string) => {
    if (spec && !formData.specializations.includes(spec)) {
      setFormData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, spec],
      }));
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== spec),
    }));
  };

  const handleAddLanguage = (lang: string) => {
    if (lang && !formData.languages.includes(lang)) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, lang],
      }));
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAIAstrologer();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/ai-astrologers/${aiAstrologerId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit AI Astrologer</h1>
          <p className="text-gray-600 mt-1">Update {formData.name} details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="personality">Personality Type</Label>
                <Input
                  id="personality"
                  value={formData.personality}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, personality: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="expertise">Expertise *</Label>
                <Select
                  value={formData.expertise}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, expertise: value }))
                  }
                >
                  <SelectTrigger id="expertise">
                    <SelectValue placeholder="Select Expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vedic">Vedic</SelectItem>
                    <SelectItem value="Tarot">Tarot</SelectItem>
                    <SelectItem value="Numerology">Numerology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Profile Picture */}
            <div>
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* AI Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aiModel">AI Model</Label>
                <Select
                  value={formData.aiModel}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, aiModel: value }))
                  }
                >
                  <SelectTrigger id="aiModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responseStyle">Response Style</Label>
                <Select
                  value={formData.responseStyle}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, responseStyle: value }))
                  }
                >
                  <SelectTrigger id="responseStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="knowledgeBase">Knowledge Base</Label>
              <Textarea
                id="knowledgeBase"
                value={formData.knowledgeBase}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, knowledgeBase: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Specializations & Languages */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Specializations & Languages</h2>
          <div className="space-y-4">
            <div>
              <Label>Specializations</Label>
              <Select onValueChange={handleAddSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="Add specializations" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.specializations.map((spec) => (
                  <div
                    key={spec}
                    className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialization(spec)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Languages</Label>
              <Select onValueChange={handleAddLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Add languages" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.languages.map((lang) => (
                  <div
                    key={lang}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pricingChat">Chat Price (₹/min)</Label>
              <Input
                id="pricingChat"
                type="number"
                step="0.01"
                value={formData.pricingChat}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pricingChat: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="pricingCall">Call Price (₹/min)</Label>
              <Input
                id="pricingCall"
                type="number"
                step="0.01"
                value={formData.pricingCall}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pricingCall: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="pricingVideoCall">Video Call Price (₹/min)</Label>
              <Input
                id="pricingVideoCall"
                type="number"
                step="0.01"
                value={formData.pricingVideoCall}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricingVideoCall: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <Select
            value={formData.accountStatus}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, accountStatus: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
          <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-sm transition-all">
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href={`/ai-astrologers/${aiAstrologerId}`}>
            <Button type="button" variant="outline" className="font-bold px-8 py-2.5 rounded-xl border-gray-200 hover:bg-gray-50 transition-all">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
