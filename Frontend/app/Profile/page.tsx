"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, MapPin, Loader2, Save, Briefcase } from "lucide-react";

const ALL_AREAS = [
  "Lekki Phase 1",
  "Lekki Phase 2",
  "Victoria Island",
  "Ikoyi",
  "Yaba",
  "Surulere",
  "Ikeja GRA",
  "Ajah",
  "Magodo",
  "Gbagada",
  "Festac",
  "Ikorodu",
];

const ALL_CATEGORIES = ["General", "Cleaning", "Repairs", "Errands", "Plumbing", "Electrical", "Carpentry", "Painting"];

function ProfilePage() {
  const { isLoggedIn, isLoading: authLoading, userRole, user } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      window.location.href = "/";
      return;
    }

    if (userRole === "hustler") {
      const loadProfile = async () => {
        setLoadingProfile(true);
        const data = await api.getHustlerProfile();
        setProfile(data);
        setSelectedAreas(data.service_areas || []);
        setSelectedCategories(data.categories || []);
        setLoadingProfile(false);
      };
      loadProfile();
    }
  }, [isLoggedIn, authLoading, userRole]);

  const toggleArea = (a: string) => {
    if (selectedAreas.includes(a)) {
      setSelectedAreas(selectedAreas.filter((x) => x !== a));
    } else {
      setSelectedAreas([...selectedAreas, a]);
    }
  };

  const toggleCategory = (c: string) => {
    if (selectedCategories.includes(c)) {
      setSelectedCategories(selectedCategories.filter((x) => x !== c));
    } else {
      setSelectedCategories([...selectedCategories, c]);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const data = await api.updateHustlerProfile({
        service_areas: selectedAreas,
        categories: selectedCategories,
      });
      setProfile(data);
      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  if (userRole !== "hustler") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Customer Profile</h1>
        <p className="text-muted-foreground">Customers manage their settings directly from the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">My Profile</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Hustler Settings</h1>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition shadow-soft"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditMode(false);
                setSelectedAreas(profile?.service_areas || []);
                setSelectedCategories(profile?.categories || []);
              }}
              className="rounded-full border px-6 py-2.5 text-sm font-semibold hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updating}
              className="flex items-center gap-2 rounded-full bg-success px-6 py-2.5 text-sm font-semibold text-success-foreground hover:opacity-95 transition shadow-soft disabled:opacity-50"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-3xl bg-card border shadow-soft p-6 text-center">
            <div className="h-24 w-24 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <User className="h-10 w-10" />
            </div>
            <h2 className="font-display text-xl font-bold">{user?.name || "Hustler"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1.5 text-xs font-semibold text-success">
              Verified Hustler
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl bg-card border shadow-soft p-6 sm:p-8">
            <div className="flex items-center gap-2 text-lg font-bold mb-4 border-b pb-4">
              <MapPin className="h-5 w-5 text-primary" /> Service Areas
            </div>
            {loadingProfile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading areas...
              </div>
            ) : editMode ? (
              <div className="flex flex-wrap gap-2">
                {ALL_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleArea(a)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${selectedAreas.includes(a) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedAreas.length === 0 && <span className="text-muted-foreground text-sm italic">No service areas set.</span>}
                {selectedAreas.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary px-4 py-2 text-sm font-semibold"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">These are the neighborhoods where you are willing to accept jobs.</p>
          </div>

          <div className="rounded-3xl bg-card border shadow-soft p-6 sm:p-8">
            <div className="flex items-center gap-2 text-lg font-bold mb-4 border-b pb-4">
              <Briefcase className="h-5 w-5 text-primary" /> Job Categories
            </div>
            {loadingProfile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading categories...
              </div>
            ) : editMode ? (
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${selectedCategories.includes(c) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedCategories.length === 0 && <span className="text-muted-foreground text-sm italic">No categories set.</span>}
                {selectedCategories.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-muted border px-4 py-2 text-sm font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">Select the types of tasks you specialize in to get better matching accuracy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
