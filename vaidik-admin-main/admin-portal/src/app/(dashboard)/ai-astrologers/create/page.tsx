'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Plus, X } from 'lucide-react';
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

export default function CreateAIAstrologerPage() {
  const router = useRouter();
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
    expertise: 'Vedic',
    pricingChat: '',
    pricingCall: '',
    pricingVideoCall: '',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { mutate: createAIAstrologer, isPending } = useMutation({
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
          // Optional: throw error or continue with base64/empty
        }
      }

      const payload = {
        name: formData.name,
        personality: formData.personality,
        personalityType: formData.personality,
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
        ratePerMinute: parseFloat(formData.pricingChat) || 0,
      };
      const response = await adminApi.createAIAstrologer(payload);
      return response.data;
    },
    onSuccess: () => {
      router.push('/ai-astrologers');
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
    if (!formData.name || !formData.personality || !formData.aiModel) {
      alert('Please fill in all required fields');
      return;
    }
    createAIAstrologer();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/ai-astrologers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create AI Astrologer</h1>
          <p className="text-gray-600 mt-1">Add a new AI astrologer personality</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Vedic Sage"
                  required
                />
              </div>
              <div>
                <Label htmlFor="personality">Personality Type *</Label>
                <Input
                  id="personality"
                  value={formData.personality}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, personality: e.target.value }))
                  }
                  placeholder="e.g., Wise Mentor, Spiritual Guide"
                  required
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
                placeholder="Brief background and expertise"
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
                placeholder="Detailed description of this AI astrologer"
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
                <Label htmlFor="aiModel">AI Model *</Label>
                <Select
                  value={formData.aiModel}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, aiModel: value }))
                  }
                >
                  <SelectTrigger id="aiModel">
                    <SelectValue placeholder="Select AI Model" />
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
                <Label htmlFor="responseStyle">Response Style *</Label>
                <Select
                  value={formData.responseStyle}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, responseStyle: value }))
                  }
                >
                  <SelectTrigger id="responseStyle">
                    <SelectValue placeholder="Select Response Style" />
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
                placeholder="Training data and knowledge focus"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Specializations & Languages */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Specializations & Languages</h2>
          <div className="space-y-4">
            {/* Specializations */}
            <div>
              <Label>Specializations</Label>
              <Select
                onValueChange={(value) => {
                  handleAddSpecialization(value);
                }}
              >
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
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialization(spec)}
                      className="hover:bg-blue-200 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <Label>Languages</Label>
              <Select
                onValueChange={(value) => {
                  handleAddLanguage(value);
                }}
              >
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
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="hover:bg-green-200 rounded-full p-1"
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
                placeholder="0.00"
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
                placeholder="0.00"
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
                placeholder="0.00"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create AI Astrologer'}
          </Button>
          <Link href="/ai-astrologers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
